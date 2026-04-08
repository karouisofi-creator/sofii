import { Router } from 'express'
import fetch from 'node-fetch'
import { authMiddleware } from '../../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Create a report (user)
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body
    const userId = req.user?.id
    const userEmail = req.user?.email
    const pyRes = await fetch('http://localhost:5001/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, title, description })
    })
    const data = await pyRes.json()
    res.status(pyRes.status).json(data)
  } catch (err) {
    console.error('Create report error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// List all reports (admin)
router.get('/', async (req, res) => {
  try {
    const pyRes = await fetch('http://localhost:5001/reports')
    const data = await pyRes.json()
    res.status(pyRes.status).json(data)
  } catch (err) {
    console.error('List reports error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Solve a report (admin)
router.patch('/:id', async (req, res) => {
  try {
    const { solution } = req.body
    const solvedBy = req.user?.id
    const pyRes = await fetch(`http://localhost:5001/reports/${req.params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solution, solvedBy })
    })
    const data = await pyRes.json()
    res.status(pyRes.status).json(data)
  } catch (err) {
    console.error('Solve report error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
