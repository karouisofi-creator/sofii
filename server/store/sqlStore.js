import { query } from '../db.js'
import { hashPassword } from '../utils/security.js'

export async function getByEmail(email) {
  const result = await query(
    `SELECT id, email, fullName, passwordHash, role, isActive 
     FROM users 
     WHERE LOWER(email) = LOWER(@email)`,
    { email }
  )
  return result.recordset[0] || null
}

export async function getById(id) {
  const result = await query(
    `SELECT id, email, fullName, role, isActive 
     FROM users 
     WHERE id = @id`,
    { id }
  )
  return result.recordset[0] || null
}

export async function listAll() {
  const result = await query(
    `SELECT id, email, fullName, role, isActive, createdAt 
     FROM users 
     ORDER BY createdAt DESC`
  )
  return result.recordset || []
}

export async function create({ email, fullName, password, role = 'user' }) {
  const passwordHash = await hashPassword(password)
  const result = await query(
    `INSERT INTO users (email, fullName, passwordHash, role)
     OUTPUT INSERTED.id, INSERTED.email, INSERTED.fullName, INSERTED.role, INSERTED.isActive, INSERTED.createdAt
     VALUES (@email, @fullName, @passwordHash, @role)`,
    {
      email: email.toLowerCase(),
      fullName: fullName || email,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
    }
  )
  return result.recordset[0] || null
}

export async function update(id, { fullName, role, isActive, password }) {
  const user = await getById(id)
  if (!user) return null

  const updates = {
    fullName: fullName !== undefined ? fullName : user.fullName,
    role: role !== undefined ? (role === 'admin' ? 'admin' : 'user') : user.role,
    isActive: isActive !== undefined ? !!isActive : user.isActive,
  }

  if (password !== undefined && password.length > 0) {
    const passwordHash = await hashPassword(password)
    await query(
      `UPDATE users SET fullName = @fullName, role = @role, isActive = @isActive, passwordHash = @passwordHash, updatedAt = GETDATE() WHERE id = @id`,
      { id, ...updates, passwordHash }
    )
  } else {
    await query(
      `UPDATE users SET fullName = @fullName, role = @role, isActive = @isActive, updatedAt = GETDATE() WHERE id = @id`,
      { id, ...updates }
    )
  }
  return getById(id)
}
