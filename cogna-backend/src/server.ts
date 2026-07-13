import { buildApp } from './app'
import { env } from '@/config/env'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 Cogna API running on port ${env.PORT}`)
    console.log(`📖 Docs available at http://localhost:${env.PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
