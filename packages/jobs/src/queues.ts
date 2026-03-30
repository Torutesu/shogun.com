import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

// ---------------------------------------------------------------------------
// Queue definitions
// ---------------------------------------------------------------------------

function createQueue<T>(name: string) {
  return new Queue<T>(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });
}

// ---------------------------------------------------------------------------
// Job data types
// ---------------------------------------------------------------------------

export interface MemorySummarizeData {
  entryId: string;
  content: string;
}

export interface MemoryEmbedData {
  entryId: string;
  content: string;
}

export interface MachineLifecycleData {
  userId: string;
  action: "start" | "stop" | "provision" | "deprovision";
}

export interface AutomationScheduleData {
  tick: number; // unix timestamp of the tick
}

export interface BackupSyncData {
  userId: string;
  machineId: string;
}

// ---------------------------------------------------------------------------
// Queue instances
// ---------------------------------------------------------------------------

export const memorySummarizeQueue = createQueue<MemorySummarizeData>("memory-summarize");
export const memoryEmbedQueue = createQueue<MemoryEmbedData>("memory-embed");
export const machineLifecycleQueue = createQueue<MachineLifecycleData>("machine-lifecycle");
export const automationScheduleQueue = createQueue<AutomationScheduleData>("automation-schedule");
export const backupSyncQueue = createQueue<BackupSyncData>("backup-sync");
