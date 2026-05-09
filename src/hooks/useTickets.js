import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000/api'

export function useTickets(token) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erreur récupération tickets')
      const data = await res.json()
      setTickets(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (ticketData) => {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(ticketData)
    })
    if (!res.ok) throw new Error('Erreur création ticket')
    await fetchTickets()
  }

  const updateTicket = async (id, updates) => {
    const res = await fetch(`${API_URL}/tickets/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Erreur mise à jour ticket')
    await fetchTickets()
  }

  useEffect(() => {
    if (token) fetchTickets()
  }, [token])

  return { tickets, loading, error, createTicket, updateTicket, refresh: fetchTickets }
}
