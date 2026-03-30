// Connection
export { getRedisConnection, closeRedisConnection } from "./connection";

// Queues
export {
  memorySummarizeQueue,
  memoryEmbedQueue,
  machineLifecycleQueue,
  automationScheduleQueue,
  backupSyncQueue,
} from "./queues";

export type {
  MemorySummarizeData,
  MemoryEmbedData,
  MachineLifecycleData,
  AutomationScheduleData,
  BackupSyncData,
} from "./queues";

// Workers
export { createMemorySummarizeWorker } from "./workers/memory-summarize";
export { createMemoryEmbedWorker } from "./workers/memory-embed";
export { createAutomationScheduleWorker } from "./workers/automation-schedule";
export { createWeeklyDigestWorker } from "./workers/weekly-digest";
export type { WeeklyDigestData } from "./workers/weekly-digest";
