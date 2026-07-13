import { Redis } from 'ioredis'
import { env } from '@/config/env'

/**
 * Shared Redis connection for BullMQ.
 * BullMQ requires separate connections for Queue and Worker —
 * export a factory so each consumer creates its own connection.
 */
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck:     false,
  })
}

/** Singleton for lightweight usage (non-BullMQ reads/writes) */
export const redis = createRedisConnection()
