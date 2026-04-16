import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const ACTION_LABELS = {
  login: 'Connexion',
  login_failed: 'Échec connexion',
  logout: 'Déconnexion',
  profile_update: 'Mise à jour profil',
  user_created: 'Utilisateur créé',
  user_updated: 'Utilisateur modifié',
}

export default function AdminLogs() {
  const { apiFetch } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const loadLogs = async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterAction) params.set('action', filterAction)
      params.set('limit', '100')
      const res = await apiFetch(`/admin/logs?${params}`)
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Erreur serveur')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filterAction])

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Logs d'activité</h1>
          <p className="text-slate-500 mt-1">Supervision des actions de tous les utilisateurs</p>
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Utilisateur</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Action</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Détails</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Aucune activité enregistrée
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-slate-800">{log.userEmail || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === 'login_failed' ? 'bg-red-100 text-red-800' :
                        log.action === 'login' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{log.details || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 font-mono">{log.ip || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
