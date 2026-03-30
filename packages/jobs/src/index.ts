// Connection
export { getRedisConnection, closeRedisConnection } from "./connection";

// Queues
export {
  memorySummarizeQueue,
  memoryEmbedQueue,
  machineLifecycleQueue,
  automationScheduleQueue,
  backupSyncQueue,
  weeklyDigestQueue,
} from "./queues";

// Workers
export { createMemorySummarizeWorker, type MemorySummarizeJob } from "./workers/memory-summarize";
export { createMemoryEmbedWorker, type MemoryEmbedJob } from "./workers/memory-embed";
export { createAutomationScheduleWorker, type AutomationScheduleJob } from "./workers/automation-schedule";
export { createWeeklyDigestWorker, type WeeklyDigestJob } from "./workers/weekly-digest";
