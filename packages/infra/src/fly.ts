import type { SubscriptionTier } from "@shogun/shared";
import { TIER_CONFIGS } from "@shogun/shared";

export interface ProvisionConfig {
  userId: string;
  handle: string;
  tier: SubscriptionTier;
  region: string;
}

export interface MachineInfo {
  machineId: string;
  appName: string;
  ipAddress: string;
  status: string;
}

const FLY_API_BASE = "https://api.machines.dev/v1";

export class FlyMachineManager {
  private token: string;
  private org: string;

  constructor(token: string, org: string) {
    this.token = token;
    this.org = org;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async provision(config: ProvisionConfig): Promise<MachineInfo> {
    const appName = `shogun-${config.handle}`;
    const tierConfig = TIER_CONFIGS[config.tier];

    // 1. Create Fly app
    await fetch(`${FLY_API_BASE}/apps`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        app_name: appName,
        org_slug: this.org,
      }),
    });

    // 2. Create machine with volume
    const machineResponse = await fetch(
      `${FLY_API_BASE}/apps/${appName}/machines`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          region: config.region,
          config: {
            image: "shogun/user-machine:latest",
            guest: {
              cpus: tierConfig.cpuCores,
              memory_mb: tierConfig.memoryMb,
            },
            mounts: [
              {
                volume: `vol_${config.handle}`,
                path: "/home/user",
              },
            ],
            env: {
              SHOGUN_USER_ID: config.userId,
              SHOGUN_HANDLE: config.handle,
            },
            auto_destroy: false,
            restart: { policy: "always" },
          },
        }),
      },
    );

    const machine = (await machineResponse.json()) as {
      id: string;
      private_ip: string;
      state: string;
    };

    return {
      machineId: machine.id,
      appName,
      ipAddress: machine.private_ip,
      status: machine.state,
    };
  }

  async start(appName: string, machineId: string): Promise<void> {
    await fetch(
      `${FLY_API_BASE}/apps/${appName}/machines/${machineId}/start`,
      { method: "POST", headers: this.headers() },
    );
  }

  async stop(appName: string, machineId: string): Promise<void> {
    await fetch(
      `${FLY_API_BASE}/apps/${appName}/machines/${machineId}/stop`,
      { method: "POST", headers: this.headers() },
    );
  }

  async getStatus(appName: string, machineId: string): Promise<string> {
    const response = await fetch(
      `${FLY_API_BASE}/apps/${appName}/machines/${machineId}`,
      { headers: this.headers() },
    );
    const data = (await response.json()) as { state: string };
    return data.state;
  }

  async exec(
    appName: string,
    machineId: string,
    command: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const response = await fetch(
      `${FLY_API_BASE}/apps/${appName}/machines/${machineId}/exec`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ command: ["sh", "-c", command] }),
      },
    );
    return (await response.json()) as {
      stdout: string;
      stderr: string;
      exitCode: number;
    };
  }
}
