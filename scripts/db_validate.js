const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set. Set it before running db_validate.js')
  process.exit(1)
}

async function run() {
  const client = new Client({ connectionString: url })
  await client.connect()

  const report = { tables: [], indexes: [], fks: [], issues: [] }

  // Check required tables
  const required = ['vessel_positions','vessel_tracking_cache','provider_metrics','provider_health','provider_failures','provider_request_logs','user','apiCredential','search']
  for (const t of required) {
    const r = await client.query(`SELECT to_regclass($1) IS NOT NULL as exists`, [t])
    report.tables.push({ table: t, exists: r.rows[0].exists })
    if (!r.rows[0].exists) report.issues.push(`Missing table: ${t}`)
  }

  // Indexes
  const idxRes = await client.query(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'`)
  report.indexes = idxRes.rows

  // FKs
  const fkRes = await client.query(`SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE constraint_type = 'FOREIGN KEY';`)
  report.fks = fkRes.rows

  const outDir = path.resolve(process.cwd(), 'reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'db-validation.json'), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(outDir, 'db-validation.md'), `# DB Validation Report\n\n${report.issues.length ? 'Issues:\n' + report.issues.join('\n') : 'No issues found.'}`)

  console.log('DB validation report written to reports/db-validation.*')
  await client.end()
}

run().catch((e) => { console.error(e); process.exit(2) })
