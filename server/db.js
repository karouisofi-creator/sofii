import sql from 'mssql'

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'DataFlowAssurance',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
}

let pool = null

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}

export async function query(sqlQuery, params = {}) {
  const p = await getPool()
  const request = p.request()
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value)
  }
  return request.query(sqlQuery)
}
