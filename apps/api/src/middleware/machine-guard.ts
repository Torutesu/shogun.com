import { createMiddleware } from "hono/factory";
import { createServerClient } from "@shogun/db";
import type { AuthVariables } from "./auth";

/**
 * Middleware that checks if the user's machine is running before allowing
 * file/terminal operations. Returns appropriate errors for non-running states.
 */
export const machineGuard = createMiddleware<{ Variables: AuthVariables & { machineId: string; flyAppName: string } }>(
  async (c, next) => {
    const userId = c.get("userId");
    const supabase = createServerClient();

    const { data: machine, error } = await supabase
      .from("machines")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !machine) {
      return c.json(
        {
          error: {
            code: "NO_MACHINE",
            message: "No machine provisioned. Please provision a machine first.",
            status: 404,
          },
        },
        404,
      );
    }

    switch (machine.status) {
      case "running":
        c.set("machineId", machine.fly_machine_id!);
        c.set("flyAppName", machine.fly_app_name!);
        return await next();

      case "sleeping":
        c.header("Retry-After", "15");
        return c.json(
          {
            error: {
              code: "MACHINE_SLEEPING",
              message: "Machine is sleeping. Wake it up first or wait for auto-wake.",
              status: 503,
            },
          },
          503,
        );

      case "provisioning":
        c.header("Retry-After", "30");
        return c.json(
          {
            error: {
              code: "MACHINE_PROVISIONING",
              message: "Machine is still being provisioned. Please wait.",
              status: 503,
            },
          },
          503,
        );

      case "stopped":
        return c.json(
          {
            error: {
              code: "MACHINE_STOPPED",
              message: "Machine is stopped. Start it to continue.",
              status: 409,
            },
          },
          409,
        );

      case "error":
        return c.json(
          {
            error: {
              code: "MACHINE_ERROR",
              message: "Machine is in an error state. Please contact support or re-provision.",
              status: 500,
            },
          },
          500,
        );

      default:
        return c.json(
          {
            error: {
              code: "MACHINE_UNKNOWN",
              message: `Unexpected machine status: ${machine.status}`,
              status: 500,
            },
          },
          500,
        );
    }
  },
);
