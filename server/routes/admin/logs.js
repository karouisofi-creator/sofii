import { Router } from 'express'
import { authMiddleware, requireAdmin } from '../../middleware/auth.js'
import { getLogs, ACTIONS } from '../../utils/activityLogger.js'

const router = Router()

router.use(authMiddleware)
router.use(requireAdmin)

// GET /api/admin/logs
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : undefined
    const action = req.query.action || undefined
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200)

    const logs = getLogs({ userId, action, limit })
    res.json(logs)
  } catch (err) {
    console.error('Logs error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/logs/actions — liste des types d'actions
router.get('/actions', (req, res) => {
  res.json(Object.entries(ACTIONS).map(([k, v]) => ({ key: k, value: v })))
})

export default router
