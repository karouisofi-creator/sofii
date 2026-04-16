import jwt from 'jsonwebtoken'

const ROLES = { USER: 'user', ADMIN: 'admin' }

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  next()
}
