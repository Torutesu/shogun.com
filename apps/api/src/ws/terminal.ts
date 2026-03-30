import { Hono } from "hono";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "../middleware/auth";
import { randomBytes } from "node:crypto";

const terminal = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// In-memory ticket store (short-lived, single-use)
// ---------------------------------------------------------------------------

interface Ticket {
  userId: string;
  machineId: string;
  flyAppName: string;
  createdAt: number;
}

const ticketStore = new Map<string, Ticket>();

// Clean up expired tickets every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, ticket] of ticketStore) {
    if (now - ticket.createdAt > 60_000) {
      ticketStore.delete(key);
    }
  }
}, 60_000);

// ---------------------------------------------------------------------------
// POST /ticket - generate one-time WebSocket ticket
// ---------------------------------------------------------------------------
terminal.post("/ticket", async (c) => {
  const userId = c.get("userId");
  const supabase = createServerClient();

  // Get the user's running machine
  const { data: machine, error } = await supabase
    .from("machines")
    .select("fly_machine_id, fly_app_name, status")
    .eq("user_id", userId)
    .single();

  if (error || !machine) {
    return c.json({ error: { code: "NO_MACHINE", message: "No machine found", status: 404 } }, 404);
  }

  if (machine.status !== "running") {
    return c.json(
      { error: { code: "MACHINE_NOT_RUNNING", message: "Machine must be running to open a terminal", status: 409 } },
      409,
    );
  }

  if (!machine.fly_machine_id || !machine.fly_app_name) {
    return c.json({ error: { code: "MACHINE_NOT_READY", message: "Machine is not fully provisioned", status: 409 } }, 409);
  }

  const ticket = randomBytes(32).toString("hex");
  ticketStore.set(ticket, {
    userId,
    machineId: machine.fly_machine_id,
    flyAppName: machine.fly_app_name,
    createdAt: Date.now(),
  });

  return c.json({ ticket, expires_in: 60 });
});

// ---------------------------------------------------------------------------
// GET /ws - WebSocket upgrade with ticket validation
// ---------------------------------------------------------------------------
terminal.get("/ws", async (c) => {
  const ticket = c.req.query("ticket");

  if (!ticket) {
    return c.json({ error: { code: "MISSING_TICKET", message: "ticket query parameter is required", status: 400 } }, 400);
  }

  const ticketData = ticketStore.get(ticket);
  if (!ticketData) {
    return c.json({ error: { code: "INVALID_TICKET", message: "Invalid or expired ticket", status: 401 } }, 401);
  }

  // Consume ticket (single-use)
  ticketStore.delete(ticket);

  // Check ticket age (max 60 seconds)
  if (Date.now() - ticketData.createdAt > 60_000) {
    return c.json({ error: { code: "TICKET_EXPIRED", message: "Ticket has expired", status: 401 } }, 401);
  }

  // Upgrade to WebSocket
  // Note: WebSocket upgrade depends on the runtime adapter (Node.js, Bun, Cloudflare Workers, etc.)
  // For @hono/node-server, WebSocket support requires additional setup.
  // This implementation provides the upgrade handler structure.
  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader !== "websocket") {
    return c.json({ error: { code: "UPGRADE_REQUIRED", message: "WebSocket upgrade required", status: 426 } }, 426);
  }

  // The actual WebSocket relay implementation depends on the runtime.
  // For Node.js with @hono/node-server, you'd typically use the underlying
  // Node HTTP server's upgrade event. Here we define the message protocol:
  //
  // Client -> Server messages (JSON):
  //   { type: "stdin", data: string }       - Terminal input
  //   { type: "resize", cols: number, rows: number } - Terminal resize
  //
  // Server -> Client messages (JSON):
  //   { type: "stdout", data: string }      - Terminal output
  //   { type: "stderr", data: string }      - Terminal error output
  //   { type: "exit", code: number }        - Process exited
  //   { type: "error", message: string }    - Error message

  // For the Hono + Node.js runtime, WebSocket handling is typically done
  // at the server level. We'll store the connection info for the upgrade handler.
  // @ts-expect-error - runtime-specific WebSocket handling
  const { response, socket } = Reflect.get(c, "env")?.upgrade?.() ?? {};

  if (!socket) {
    // Fallback: return connection info for external WebSocket server
    return c.json({
      error: {
        code: "WS_NOT_SUPPORTED",
        message: "WebSocket not supported in this runtime configuration. Use the Node.js upgrade handler.",
        status: 501,
      },
    }, 501);
  }

  // If WebSocket upgrade succeeded, set up bidirectional relay
  const agentWsUrl = `ws://${ticketData.machineId}.vm.flycast:8080/terminal/ws`;

  // Connect to the container agent's terminal WebSocket
  const agentWs = new WebSocket(agentWsUrl);

  agentWs.onopen = () => {
    // Send initial resize if needed
  };

  agentWs.onmessage = (event: MessageEvent) => {
    // Relay agent output to client
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(typeof event.data === "string" ? event.data : JSON.stringify({ type: "stdout", data: event.data }));
    }
  };

  agentWs.onclose = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "exit", code: 0 }));
      socket.close();
    }
  };

  agentWs.onerror = (err: Event) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "error", message: "Agent connection failed" }));
      socket.close();
    }
  };

  // Relay client input to agent
  socket.onmessage = (event: MessageEvent) => {
    if (agentWs.readyState === WebSocket.OPEN) {
      agentWs.send(typeof event.data === "string" ? event.data : String(event.data));
    }
  };

  socket.onclose = () => {
    agentWs.close();
  };

  return response ?? new Response(null, { status: 101 });
});

export default terminal;
