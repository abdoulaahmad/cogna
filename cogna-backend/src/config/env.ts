import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  APP_NAME:              z.string().default('Cogna'),
  APP_ENV:               z.enum(['development', 'test', 'production']).default('development'),
  APP_URL:               z.string().url().default('http://localhost:3000'),
  PORT:                  z.coerce.number().default(4000),

  DATABASE_URL:          z.string().min(1),
  NEON_DATABASE_URL:     z.string().url().optional(),
  DATABASE_TEST_URL:     z.string().optional(),

  JWT_SECRET:            z.string().min(32),
  JWT_REFRESH_SECRET:    z.string().min(32),
  JWT_EXPIRES_IN:        z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ADMIN_EMAIL:           z.string().email().default('admin@cogna.store'),
  ADMIN_PASSWORD:        z.string().default('password123'),

  PAYSTACK_SECRET_KEY:   z.string().optional(),
  PAYSTACK_PUBLIC_KEY:   z.string().optional(),
  MONNIFY_API_KEY:       z.string().optional(),
  MONNIFY_SECRET_KEY:    z.string().optional(),
  MONNIFY_BASE_URL:      z.string().url().default('https://sandbox.monnify.com'),
  MONNIFY_CONTRACT_CODE: z.string().optional(),

  PROVIDER_ENCRYPTION_KEY: z.string().min(32).optional(),

  AKUNDING_API_KEY:      z.string().optional(),
  AKUNDING_BASE_URL:     z.string().url().default('https://akunding.shop/api/v1'),

  REDIS_URL:             z.string().default('redis://localhost:6379'),

  SMTP_HOST:             z.string().optional(),
  SMTP_PORT:             z.coerce.number().default(587),
  SMTP_USER:             z.string().optional(),
  SMTP_PASSWORD:         z.string().optional(),
  SMTP_FROM:             z.string().email().default('noreply@cogna.store'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
