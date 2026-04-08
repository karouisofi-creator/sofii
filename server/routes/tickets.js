import express from 'express'
import fetch from 'node-fetch'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET /api/tickets -> List all tickets (User sees own, Admin sees all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { id, role } = req.user
    // Proxy to Python API
    const pyApiUrl = 'http://localhost:5001/tickets'
    const pyRes = await fetch(pyApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': id,
        'x-user-role': role
      }
    })
    let tickets = await pyRes.json()
    if (!pyRes.ok) {
      return res.status(pyRes.status).json(tickets)
    }
    // If not admin, filter tickets by userId
    if (role !== 'admin') {
      tickets = tickets.filter(t => t.userId == id)
    }
    res.json(tickets)
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

// POST /api/tickets -> Create a new ticket (User & Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, perimeter, format, urgency } = req.body
    if (!title || !description || !type || !perimeter || !urgency) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' })
    }
    // Proxy the ticket creation to the Python API
    const pyApiUrl = 'http://localhost:5001/tickets'
    const pyRes = await fetch(pyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-role': req.user.role
      },
      body: JSON.stringify({
        userId: req.user.id,
        userEmail: req.user.email,
        title,
        description,
        type,
        perimeter,
        format,
        urgency,
        status: 'En attente'
      })
    })
    const data = await pyRes.json()
    if (!pyRes.ok) {
      return res.status(pyRes.status).json(data)
    }
    res.status(201).json(data)
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

// PATCH /api/tickets/:id -> Update ticket status (Admin) or details
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    // Forward the PATCH request to the Python API
    const pyApiUrl = `http://localhost:5001/tickets/${ticketId}`
    const pyRes = await fetch(pyApiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-role': req.user.role
      },
      body: JSON.stringify(req.body)
    })
    const data = await pyRes.json()
    if (!pyRes.ok) {
      return res.status(pyRes.status).json(data)
    }
    res.json(data)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

export default router
