import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

function createQueue(name: string, defaultOpts?: { attempts?: number; backoffType?: string; backoffDelay?: number }) {
  return new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: defaultOpts?.attempts ?? 3,
      backoff: {
        type: (defaultOpts?.backoffType as "exponential" | "fixed") ?? "exponential",
        delay: defaultOpts?.backoffDelay ?? 2000,
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });
}

export const memorySummarizeQueue = createQueue("memory-summarize", {
  attempts: 3,
  backoffType: "exponential",
  backoffDelay: 2000,
});

export const memoryEmbedQueue = createQueue("memory-embed", {
  attempts: 3,
  backoffType: "exponential",
  backoffDelay: 2000,
});

export const machineLifecycleQueue = createQueue("machine-lifecycle", {
  attempts: 5,
  backoffType: "exponential",
  backoffDelay: 5000,
});

export const automationScheduleQueue = createQueue("automation-schedule", {
  attempts: 1,
  backoffType: "fixed",
  backoffDelay: 60000,
});

export const backupSyncQueue = createQueue("backup-sync", {
  attempts: 3,
  backoffType: "exponential",
  backoffDelay: 10000,
});

export const weeklyDigestQueue = createQueue("weekly-digest", {
  attempts: 3,
  backoffType: "exponential",
  backoffDelay: 5000,
});
