import IORedis from "ioredis";

let _connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!_connection) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error("Missing REDIS_URL environment variable");
    }
    _connection = new IORedis(url, {
      maxRetriesPerRequest: null, // required by BullMQ
    });
  }
  return _connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}
