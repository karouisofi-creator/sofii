import sql from 'mssql'

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'DataFlowAssurance',
<<<<<<< HEAD
  options: {
=======
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true,
>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
}

<<<<<<< HEAD
// Use Windows Authentication (NTLM) if requested
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.authentication = {
    type: 'ntlm',
    options: {
      domain: '', // Use current user's domain
      userName: '', // Use current Windows user
      password: '', // Use current Windows user
    }
  }
} else {
  config.user = process.env.DB_USER || 'sa';
  config.password = process.env.DB_PASSWORD || '';
}

=======
>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f
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
