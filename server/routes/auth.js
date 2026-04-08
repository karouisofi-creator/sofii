
import { Router } from 'express'
import fetch from 'node-fetch'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { authMiddleware } from '../middleware/auth.js'
import { getStore } from '../store/index.js'
import { verifyPassword, sanitizeString, isValidEmail } from '../utils/security.js'
import { ACTIONS } from '../utils/activityLogger.js'

const router = Router()

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
  })
})

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})

function toSafeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  }
}  // <-- this closing brace was missing

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 255)
    const password = req.body.password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' })
    }

    console.log('[LOGIN] Calling Python service for login:', email)

    let pyRes, pyData
    try {
      pyRes = await fetch('http://localhost:5001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      pyData = await pyRes.json()
    } catch (fetchErr) {
      console.error('[LOGIN] Error calling Python service:', fetchErr)
      return res.status(503).json({ error: 'Service Python injoignable' })
    }

    console.log('[LOGIN] Python service response:', pyRes.status, pyData)

    if (!pyRes.ok) {
      return res.status(401).json({ error: pyData.error || 'Login failed' })
    }

    const store = getStore()
    let user = store ? await store.getByEmail(email) : null
    console.log('[LOGIN] store.getByEmail result:', user)
    let safeUser = toSafeUser(user)
    if (!safeUser && pyData.user) {
      safeUser = {
        id: pyData.user.id,
        email: pyData.user.email,
        fullName: pyData.user.fullName,
        role: pyData.user.role,
      }
      user = safeUser
      console.log('[LOGIN] Using user info from Python:', safeUser)
    }
    console.log('[LOGIN] toSafeUser result:', safeUser)
    if (!safeUser) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: safeUser,
    })

    try {
      await fetch('http://localhost:5001/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          action: pyRes.ok ? 'login' : 'login_failed',
          details: pyRes.ok ? 'Connexion réussie' : 'Échec de connexion',
          ip: getClientIp(req)
        })
      })
    } catch (e) {
      console.error('Log error:', e)
    }
  } catch (err) {
    console.error('[LOGIN] Login error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Déconnexion réussie' })
})

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })
    if (!store.update) return res.status(501).json({ error: 'Modification non supportée' })

    const id = req.user.id
    const { fullName, currentPassword, newPassword } = req.body

    let passwordToSet = undefined
    if (newPassword && newPassword.length > 0) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel requis pour le changer' })
      }
      const user = await store.getByEmail(req.user.email)
      if (!user) return res.status(401).json({ error: 'Session invalide' })
      const valid = await verifyPassword(currentPassword, user.passwordHash)
      if (!valid) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
      }
      const { validatePasswordStrength } = await import('../utils/security.js')
      const pwCheck = validatePasswordStrength(newPassword)
      if (!pwCheck.valid) {
        return res.status(400).json({ error: `Nouveau mot de passe : ${pwCheck.error}` })
      }
      passwordToSet = newPassword
    }

    const updates = {}
    if (fullName !== undefined && fullName !== null) updates.fullName = sanitizeString(String(fullName), 255)
    if (passwordToSet) updates.password = passwordToSet

    let updated
    if (Object.keys(updates).length > 0) {
      updated = await store.update(id, updates)
    } else {
      updated = await store.getById(id)
    }

    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    res.json(toSafeUser(updated))
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router