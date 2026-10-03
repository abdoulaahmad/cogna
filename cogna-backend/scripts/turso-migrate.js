require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { createClient } = require('@libsql/client')

async function runMigrations() {
  const isProd = process.env.APP_ENV === 'production'
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./dev.db'
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (isProd && (!process.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL.startsWith('file:'))) {
    console.error('❌ FATAL: TURSO_DATABASE_URL must be a remote libsql:// endpoint in production.')
    process.exit(1)
  }

  console.log(`🚀 [Turso Migrate] Connecting to database: ${url.startsWith('file:') ? url : url.replace(/\/\/.*@/, '//***@')}`)

  const client = createClient({
    url,
    authToken,
  })

  // 1. Ensure migrations tracking table exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _turso_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 2. Fetch already applied migrations from _turso_migrations
  const result = await client.execute('SELECT name FROM _turso_migrations')
  const appliedMigrations = new Set(result.rows.map((row) => String(row.name)))

  // Also check if _prisma_migrations table exists (e.g. from local prisma migrate dev)
  try {
    const prismaResult = await client.execute('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL')
    for (const row of prismaResult.rows) {
      if (row.migration_name) {
        appliedMigrations.add(String(row.migration_name))
      }
    }
  } catch {
    // Table doesn't exist, ignore
  }

  // 3. Scan prisma/migrations directory
  const migrationsDir = path.resolve(__dirname, '../prisma/migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.log('ℹ️  No migrations directory found. Nothing to apply.')
    return
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
  const migrationFolders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  let appliedCount = 0

  for (const folder of migrationFolders) {
    if (appliedMigrations.has(folder)) {
      continue
    }

    const migrationFilePath = path.join(migrationsDir, folder, 'migration.sql')
    if (!fs.existsSync(migrationFilePath)) {
      console.warn(`⚠️  Skipping ${folder}: no migration.sql found.`)
      continue
    }

    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8')

    // Parse SQL into individual statements, ignoring comments and whitespace
    const statements = sqlContent
      .replace(/--.*$/gm, '') // Remove line comments
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (statements.length === 0) {
      console.log(`ℹ️  [${folder}] Empty migration. Marking as applied.`)
      await client.execute({
        sql: 'INSERT INTO _turso_migrations (name) VALUES (?)',
        args: [folder],
      })
      continue
    }

    console.log(`⏳ [${folder}] Applying ${statements.length} statement(s)...`)

    // Execute in a single batch (atomic transaction)
    await client.batch(
      [
        ...statements,
        {
          sql: 'INSERT INTO _turso_migrations (name) VALUES (?)',
          args: [folder],
        },
      ],
      'write'
    )

    console.log(`✅ [${folder}] Applied successfully.`)
    appliedCount++
  }

  if (appliedCount === 0) {
    console.log('✨ All migrations are up to date.')
  } else {
    console.log(`🎉 Successfully applied ${appliedCount} migration(s).`)
  }
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
