import { Router } from 'express'
import { authMiddleware, requireAdmin } from '../../middleware/auth.js'
import { getStore } from '../../store/index.js'

const router = Router()

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  emailNotifications: true,
  securityAlerts: true,
  autoSaveReports: true,
  aiAssistant: true,
}

router.use(authMiddleware)
router.use(requireAdmin)

function normalizeSettings(body = {}) {
  return {
    maintenanceMode: !!body.maintenanceMode,
    emailNotifications: body.emailNotifications !== false,
    securityAlerts: body.securityAlerts !== false,
    autoSaveReports: body.autoSaveReports !== false,
    aiAssistant: body.aiAssistant !== false,
  }
}

router.get('/', async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })
    if (!store.getSettings) return res.status(501).json({ error: 'Lecture non supportée' })

    const settings = await store.getSettings()
    res.json({ ...DEFAULT_SETTINGS, ...settings })
  } catch (err) {
    console.error('Get settings error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/', async (req, res) => {
  try {
    const store = getStore()
    if (!store) return res.status(503).json({ error: 'Service non prêt' })
    if (!store.saveSettings) return res.status(501).json({ error: 'Écriture non supportée' })

    const payload = normalizeSettings(req.body)
    const settings = await store.saveSettings(payload)
    res.json({ ...DEFAULT_SETTINGS, ...settings })
  } catch (err) {
    console.error('Save settings error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router