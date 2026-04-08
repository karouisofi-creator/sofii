import express from 'express'
<<<<<<< HEAD
import fetch from 'node-fetch'
import { authMiddleware } from '../middleware/auth.js'
=======
import { getStore } from '../store/index.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'
>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f

const router = express.Router()

// GET /api/tickets -> List all tickets (User sees own, Admin sees all)
router.get('/', authMiddleware, async (req, res) => {
  try {
<<<<<<< HEAD
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
=======
    const { ticketsStore } = getStore()
    const { id, role } = req.user

    if (!ticketsStore) {
        return res.status(500).json({ error: 'Store not initialized' })
    }

    const tickets = role === 'admin' 
      ? await ticketsStore.listAll() 
      : await ticketsStore.listByUser(id)

>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f
    res.json(tickets)
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

// POST /api/tickets -> Create a new ticket (User & Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
<<<<<<< HEAD
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
=======
    const { ticketsStore } = getStore()
    const { title, description, type, perimeter, format, urgency } = req.body

    if (!title || !description || !type || !perimeter || !urgency) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' })
    }

    const ticketData = {
      title,
      description,
      type,
      perimeter,
      format,
      urgency,
      userId: req.user.id
    }

    const newTicket = await ticketsStore.create(ticketData)
    res.status(201).json(newTicket)
>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

// PATCH /api/tickets/:id -> Update ticket status (Admin) or details
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
<<<<<<< HEAD
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
=======
    const { ticketsStore } = getStore()
    const ticketId = parseInt(req.params.id)
    const { status, title, description } = req.body
    
    const existingTicket = await ticketsStore.getById(ticketId)
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket introuvable' })
    }

    // Authorization check
    // Only admins can change status. 
    // Users can only update their own ticket's details IF it's still 'En attente'.
    if (req.user.role !== 'admin') {
      if (existingTicket.userId !== req.user.id) {
          return res.status(403).json({ error: 'Non autorisé à modifier ce ticket' })
      }
      if (status && status !== existingTicket.status) {
          return res.status(403).json({ error: 'Seul un administrateur peut modifier le statut' })
      }
      if (existingTicket.status !== 'En attente') {
          return res.status(403).json({ error: 'Impossible de modifier un ticket en cours de traitement' })
      }
    }

    const updatedTicket = await ticketsStore.update(ticketId, req.body)
    res.json(updatedTicket)
>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

export default router
