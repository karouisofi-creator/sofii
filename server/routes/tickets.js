import express from 'express'
import { getStore } from '../store/index.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/tickets -> List all tickets (User sees own, Admin sees all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { ticketsStore } = getStore()
    const { id, role } = req.user

    if (!ticketsStore) {
        return res.status(500).json({ error: 'Store not initialized' })
    }

    const tickets = role === 'admin' 
      ? await ticketsStore.listAll() 
      : await ticketsStore.listByUser(id)

    res.json(tickets)
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

// POST /api/tickets -> Create a new ticket (User & Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

// PATCH /api/tickets/:id -> Update ticket status (Admin) or details
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
})

export default router
