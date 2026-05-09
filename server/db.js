import sql from 'mssql'

const config = {
  // Prefer explicit DB_SERVER, otherwise default to localhost for typical dev setups
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  // support specifying a named instance (useful for LocalDB: e.g. MyInstance)
};

// If a DB instance name is provided, set it on options (mssql supports instanceName)
if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
}

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

let pool = null

export async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config)
      return pool
    } catch (err) {
      console.error('[DB] Connection failed with config:', {
        server: config.server,
        instanceName: config.options && config.options.instanceName,
        database: config.database,
      })
      console.error('[DB] Connect error:', err && err.message ? err.message : err)
      throw err
    }
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
