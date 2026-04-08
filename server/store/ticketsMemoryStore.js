const tickets = new Map()
let nextId = 1

export async function init() {
  // Pre-seed some mock data for development
  tickets.set(1, {
    id: 1,
    title: 'Extraction Sinistres Optique',
    description: 'Demande extractions lunettes pour clinique la rose 2025',
    type: 'Ponctuelle',
    perimeter: 'Tunis',
    format: 'Excel',
    urgency: 'Haute',
    status: 'En attente',
    userId: 1, // Admin user
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  });

  tickets.set(2, {
    id: 2,
    title: 'Rapport Mensuel Dentaire',
    description: 'Statistiques mensuelles soins dentaires tous centres confondus',
    type: 'Récurrente',
    perimeter: 'Tous centres',
    format: 'Power BI',
    urgency: 'Normale',
    status: 'En cours',
    userId: 1, // Admin user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  nextId = 3;
}

export function getById(id) {
  return tickets.get(id) || null
}

export function listAll() {
  return Array.from(tickets.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function listByUser(userId) {
  return listAll().filter(t => t.userId === userId)
}

export async function create(ticketData) {
  const ticket = {
    id: nextId++,
    title: ticketData.title,
    description: ticketData.description,
    type: ticketData.type || 'Ponctuelle',
    perimeter: ticketData.perimeter,
    format: ticketData.format || 'Excel',
    urgency: ticketData.urgency || 'Normale',
    status: 'En attente',
    userId: ticketData.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  tickets.set(ticket.id, ticket)
  return ticket
}

export async function update(id, updates) {
  const ticket = getById(id)
  if (!ticket) return null

  // Allowed fields for update
  const editableFields = ['title', 'description', 'type', 'perimeter', 'format', 'urgency', 'status']
  
  editableFields.forEach(field => {
    if (updates[field] !== undefined) {
      ticket[field] = updates[field]
    }
  })

  ticket.updatedAt = new Date().toISOString()
  return ticket
}
