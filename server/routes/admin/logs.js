import { Router } from 'express'
import { authMiddleware, requireAdmin } from '../../middleware/auth.js'
import fetch from 'node-fetch'
import { ACTIONS } from '../../utils/activityLogger.js'

const router = Router()

router.use(authMiddleware)
router.use(requireAdmin)

// GET /api/admin/logs
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200)
    const url = `http://localhost:5001/logs?limit=${limit}`
    console.log('[ADMIN LOGS] Fetching logs from Python API:', url)
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[ADMIN LOGS] Python API error:', response.status)
      throw new Error('Python API error')
    }
    const logs = await response.json()
    console.log('[ADMIN LOGS] Received logs from Python API:', logs.length)
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
