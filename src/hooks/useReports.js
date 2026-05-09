import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000/api'

export function useReports(token, isAdmin) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const url = isAdmin ? `${API_URL}/admin/reports` : `${API_URL}/reports`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erreur récupération reports')
      const data = await res.json()
      setReports(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (reportData) => {
    const res = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(reportData)
    })
    if (!res.ok) throw new Error('Erreur création report')
    await fetchReports()
  }

  const solveReport = async (id, solution) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ solution })
    })
    if (!res.ok) throw new Error('Erreur résolution report')
    await fetchReports()
  }

  useEffect(() => {
    if (token) fetchReports()
  }, [token, isAdmin])

  return { reports, loading, error, createReport, solveReport, refresh: fetchReports }
}