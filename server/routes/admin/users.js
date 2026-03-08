import { Router } from 'express'
import { authMiddleware, requireAdmin } from '../../middleware/auth.js'
import { getStore } from '../../store/index.js'
import { validatePasswordStrength, sanitizeString, isValidEmail } from '../../utils/security.js'
import { addLog, ACTIONS } from '../../utils/activityLogger.js'

const router = Router()

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress
}

router.use(authMiddleware)
router.use(requireAdmin)

// GET /api/admin/users
router.get('/', async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })

    const list = store.listAll ? await store.listAll() : []
    res.json(list)
  } catch (err) {
    console.error('List users error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/users
router.post('/', async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })
    if (!store.create) return res.status(501).json({ error: 'Création non supportée' })

    const email = sanitizeString(req.body.email, 255).toLowerCase()
    const fullName = sanitizeString(req.body.fullName, 255)
    const password = req.body.password
    const role = req.body.role === 'admin' ? 'admin' : 'user'

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' })
    }
    const pwCheck = validatePasswordStrength(password)
    if (!pwCheck.valid) {
      return res.status(400).json({ error: `Mot de passe : ${pwCheck.error}` })
    }

    const created = await store.create({
      email,
      fullName: fullName || email,
      password,
      role,
    })

    if (!created) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' })
    }

    res.status(201).json(created)
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/admin/users/:id
router.put('/:id', async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })
    if (!store.update) return res.status(501).json({ error: 'Modification non supportée' })

    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })

    const fullName = sanitizeString(req.body.fullName, 255)
    const role = req.body.role === 'admin' ? 'admin' : 'user'
    const isActive = req.body.isActive !== false
    const password = req.body.password

    if (password && password.length > 0) {
      const pwCheck = validatePasswordStrength(password)
      if (!pwCheck.valid) {
        return res.status(400).json({ error: `Mot de passe : ${pwCheck.error}` })
      }
    }

    const updated = await store.update(id, {
      fullName,
      role,
      isActive,
      password,
    })

    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    addLog({ userId: req.user.id, userEmail: req.user.email, action: ACTIONS.USER_UPDATED, details: `Modifié: id=${id}`, ip: getClientIp(req) })

    res.json(updated)
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
