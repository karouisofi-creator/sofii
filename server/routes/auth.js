import { Router } from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { authMiddleware } from '../middleware/auth.js'
import { getStore } from '../store/index.js'
import { verifyPassword, sanitizeString, isValidEmail } from '../utils/security.js'
import { addLog, ACTIONS } from '../utils/activityLogger.js'

const router = Router()

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress
}

// Limite stricte login : 5 tentatives / 15 min par IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})

function toSafeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  }
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const store = getStore()
    if (!store) {
      return res.status(503).json({ error: 'Service non prêt' })
    }

    const email = sanitizeString(req.body.email, 255)
    const password = req.body.password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' })
    }

    const user = await store.getByEmail(email)
    if (!user) {
      addLog({ userEmail: email, action: ACTIONS.LOGIN_FAILED, details: 'Utilisateur non trouvé', ip: getClientIp(req) })
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    if (!user.isActive) {
      addLog({ userId: user.id, userEmail: user.email, action: ACTIONS.LOGIN_FAILED, details: 'Compte désactivé', ip: getClientIp(req) })
      return res.status(401).json({ error: 'Compte désactivé' })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      addLog({ userId: user.id, userEmail: user.email, action: ACTIONS.LOGIN_FAILED, details: 'Mot de passe incorrect', ip: getClientIp(req) })
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    addLog({ userId: user.id, userEmail: user.email, action: ACTIONS.LOGIN, ip: getClientIp(req) })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: toSafeUser(user),
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const store = getStore()
    if (!store) {
      return res.status(503).json({ error: 'Service non prêt' })
    }

    const user = await store.getById(req.user.id)
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' })
    }

    res.json(toSafeUser(user))
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  addLog({ userId: req.user.id, userEmail: req.user.email, action: ACTIONS.LOGOUT, ip: getClientIp(req) })
  res.json({ message: 'Déconnexion réussie' })
})

// PUT /api/auth/profile — modification du profil (utilisateur connecté)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })
    if (!store.update) return res.status(501).json({ error: 'Modification non supportée' })

    const id = req.user.id
    const { fullName, currentPassword, newPassword } = req.body

    // Si changement de mot de passe, vérifier l'actuel
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

    const details = []
    if (fullName !== undefined) details.push('nom')
    if (passwordToSet) details.push('mot de passe')
    addLog({ userId: req.user.id, userEmail: req.user.email, action: ACTIONS.PROFILE_UPDATE, details: details.join(', '), ip: getClientIp(req) })

    res.json(toSafeUser(updated))
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router