import { Redis } from 'ioredis'
import { env } from '@/config/env'

const redisUrlParsed = parseRedisUrl(env.REDIS_URL)

const redisOpts = {
  maxRetriesPerRequest: null as null, // required by BullMQ
  enableReadyCheck:     false,
  // parse the URL into discrete fields so BullMQ's bundled ioredis is happy
  ...redisUrlParsed,
}

function parseRedisUrl(url: string) {
  try {
    const u = new URL(url)
    return {
      host:     u.hostname || '127.0.0.1',
      port:     u.port ? Number(u.port) : 6379,
      password: u.password || undefined,
      db:       u.pathname && u.pathname !== '/' ? Number(u.pathname.slice(1)) : 0,
      tls:      u.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
    }
  } catch {
    return { host: '127.0.0.1', port: 6379 }
  }
}

/**
 * Returns a plain connection-options object for BullMQ Queue / Worker.
 * BullMQ bundles its own ioredis, so passing a typed Redis *instance*
 * causes a structural type mismatch at compile time.
 */
export function createRedisConnection() {
  return redisOpts
}

/** Singleton Redis client for lightweight non-BullMQ reads/writes */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
  ...(redisUrlParsed.tls ? { tls: redisUrlParsed.tls } : {}),
})
