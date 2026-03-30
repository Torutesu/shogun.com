import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_BASIC: z.string().min(1).default("price_basic"),
  STRIPE_PRICE_PRO: z.string().min(1).default("price_pro"),
  STRIPE_PRICE_ULTRA: z.string().min(1).default("price_ultra"),

  // Fly.io
  FLY_API_TOKEN: z.string().min(1),
  FLY_ORG: z.string().min(1).default("shogun"),

  // AI default keys (used when user has no BYOK)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),

  // Encryption key for storing user API keys
  ENCRYPTION_KEY: z.string().min(32),

  // App
  APP_URL: z.string().url().default("https://syogun.com"),
  API_URL: z.string().url().default("https://api.syogun.com"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const missing = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
      throw new Error(`Missing or invalid environment variables:\n${missing.join("\n")}`);
    }
    _env = result.data;
  }
  return _env;
}
