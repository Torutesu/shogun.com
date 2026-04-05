import { Hono } from "hono";
import Stripe from "stripe";
import { createServerClient } from "@shogun/db";
import { TIER_CONFIGS, type SubscriptionTier } from "@shogun/shared";
import type { AuthVariables } from "../middleware/auth";
import { getEnv } from "../lib/env";

const billing = new Hono<{ Variables: AuthVariables }>();

function getStripe(): Stripe {
  return new Stripe(getEnv().STRIPE_SECRET_KEY);
}

// ---------------------------------------------------------------------------
// GET / - get subscription + credits + usage overview
// ---------------------------------------------------------------------------
billing.get("/", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !subscription) {
    return c.json({ error: { code: "NOT_FOUND", message: "Subscription not found", status: 404 } }, 404);
  }

  const tierConfig = TIER_CONFIGS[subscription.tier as SubscriptionTier];

  return c.json({
    subscription: {
      tier: subscription.tier,
      stripe_customer_id: subscription.stripe_customer_id,
      stripe_subscription_id: subscription.stripe_subscription_id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    credits: {
      balance_cents: subscription.ai_credits_balance,
      included_cents: subscription.ai_credits_included,
    },
    tier_config: tierConfig,
  });
});

// ---------------------------------------------------------------------------
// POST /checkout - create Stripe checkout session
// ---------------------------------------------------------------------------
billing.post("/checkout", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ interval: "monthly" | "annual" }>();
  const env = getEnv();
  const supabase = createServerClient();

  if (!body.interval || !["monthly", "annual"].includes(body.interval)) {
    return c.json({ error: { code: "INVALID_INTERVAL", message: "interval must be monthly or annual", status: 400 } }, 400);
  }

  const priceId = body.interval === "annual" ? env.STRIPE_PRICE_ANNUAL : env.STRIPE_PRICE_MONTHLY;

  // Get or create Stripe customer
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  const stripe = getStripe();
  let customerId = subscription?.stripe_customer_id;

  if (!customerId) {
    // Get user email from Supabase Auth
    const adminSupabase = createServerClient();
    const { data: { user } } = await adminSupabase.auth.admin.getUserById(userId);

    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { user_id: userId },
    });
    customerId = customer.id;

    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/settings/billing?success=true`,
    cancel_url: `${env.APP_URL}/settings/billing?canceled=true`,
    metadata: { user_id: userId, tier: "shogun", interval: body.interval },
  });

  return c.json({ url: session.url });
});

// ---------------------------------------------------------------------------
// POST /portal - create Stripe customer portal URL
// ---------------------------------------------------------------------------
billing.post("/portal", async (c) => {
  const userId = c.get("userId");
  const env = getEnv();
  const supabase = createServerClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_customer_id) {
    return c.json({ error: { code: "NO_CUSTOMER", message: "No billing account found", status: 404 } }, 404);
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${env.APP_URL}/settings/billing`,
  });

  return c.json({ url: session.url });
});

// ---------------------------------------------------------------------------
// POST /webhook - Stripe webhook (no auth middleware)
// ---------------------------------------------------------------------------
billing.post("/webhook", async (c) => {
  const env = getEnv();
  const stripe = getStripe();
  const sig = c.req.header("stripe-signature");

  if (!sig) {
    return c.json({ error: { code: "MISSING_SIGNATURE", message: "Missing stripe-signature header", status: 400 } }, 400);
  }

  let event: Stripe.Event;
  try {
    const rawBody = await c.req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return c.json({ error: { code: "WEBHOOK_INVALID", message, status: 400 } }, 400);
  }

  const supabase = createServerClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId) break;

      await supabase
        .from("subscriptions")
        .update({
          tier: "shogun",
          stripe_subscription_id: session.subscription as string,
        })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq("user_id", subscription.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({
            tier: "shogun",
            stripe_subscription_id: null,
            ai_credits_included: 0,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
          })
          .eq("user_id", subscription.user_id);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      // BYOK model — no credits to refresh on payment
      break;
    }
  }

  return c.json({ received: true });
});

// ---------------------------------------------------------------------------
// GET /usage - get credit usage history
// ---------------------------------------------------------------------------
billing.get("/usage", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;

  const { data, error, count } = await supabase
    .from("credit_usage")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({ error: { code: "FETCH_FAILED", message: error.message, status: 500 } }, 500);
  }

  return c.json({ usage: data ?? [], total: count });
});

export default billing;
