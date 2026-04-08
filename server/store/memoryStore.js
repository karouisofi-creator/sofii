import { hashPassword } from '../utils/security.js'

const users = new Map()
let nextId = 2

export async function init() {
  const hash = await hashPassword('Admin123!')
  users.set('admin@dataflow.com', {
    id: 1,
    email: 'admin@dataflow.com',
    fullName: 'Administrateur',
    passwordHash: hash,
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  })
}

export function getByEmail(email) {
  if (!email) return null
  return users.get(email.toLowerCase()) || null
}

export function getById(id) {
  for (const u of users.values()) {
    if (u.id === id) return u
  }
  return null
}

export function listAll() {
  return Array.from(users.values()).map(({ passwordHash, ...u }) => ({
    ...u,
    createdAt: u.createdAt || null,
  }))
}

export async function create({ email, fullName, password, role = 'user' }) {
  const key = email.toLowerCase().trim()
  if (users.has(key)) return null
  const passwordHash = await hashPassword(password)
  const user = {
    id: nextId++,
    email: key,
    fullName: fullName || key,
    passwordHash,
    role: role === 'admin' ? 'admin' : 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  users.set(key, user)
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function update(id, { fullName, role, isActive, password }) {
  const user = getById(id)
  if (!user) return null
  if (fullName !== undefined) user.fullName = fullName
  if (role !== undefined) user.role = role === 'admin' ? 'admin' : 'user'
  if (isActive !== undefined) user.isActive = !!isActive
  if (password !== undefined && password.length > 0) {
    user.passwordHash = await hashPassword(password)
  }
  const { passwordHash: _, ...safe } = user
  return safe
}
