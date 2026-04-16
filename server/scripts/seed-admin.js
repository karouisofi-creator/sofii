/**
 * Crée un utilisateur admin par défaut.
 * Exécuter: node scripts/seed-admin.js
 * Mot de passe par défaut: Admin123!
 */
import 'dotenv/config'
import bcrypt from 'bcrypt'
import sql from 'mssql'

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'DataFlowAssurance',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
  },
}

async function seed() {
  const hash = await bcrypt.hash('Admin123!', 10)
  const pool = await sql.connect(config)

  const result = await pool.request()
    .input('email', sql.NVarChar(255), 'admin@dataflow.com')
    .input('fullName', sql.NVarChar(255), 'Administrateur')
    .input('passwordHash', sql.NVarChar(255), hash)
    .input('role', sql.NVarChar(50), 'admin')
    .query(`
      IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
      INSERT INTO users (email, fullName, passwordHash, role)
      VALUES (@email, @fullName, @passwordHash, @role)
    `)

  console.log('✓ Admin créé: admin@dataflow.com / Admin123!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Erreur:', err.message)
  process.exit(1)
})
