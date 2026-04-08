import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function TicketDetailsModal({ ticket, isOpen, onClose, onUpdateStatus }) {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Local state just for the select dropdown
  const [newStatus, setNewStatus] = useState(ticket?.status || 'En attente')

  if (!isOpen || !ticket) return null

  const handleStatusChange = async () => {
    if (newStatus === ticket.status) return
    setLoading(true)
    setError(null)
    try {
      await onUpdateStatus(ticket.id, newStatus)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800'
      case 'En cours': return 'bg-blue-100 text-blue-800'
      case 'Résolu': return 'bg-green-100 text-green-800'
      case 'Rejeté': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Normale': return 'text-slate-600 bg-slate-100'
      case 'Haute': return 'text-orange-600 bg-orange-100'
      case 'Urgente': return 'text-red-600 bg-red-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Détails de la demande #{ticket.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
            <p className="text-slate-500 text-sm mt-1">Créée le {new Date(ticket.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getUrgencyColor(ticket.urgency)}`}>
              {ticket.urgency}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              {ticket.type}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              {ticket.format}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              {ticket.perimeter}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Description detailée</h4>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {isAdmin() && (
             <div className="pt-4 border-t border-slate-100">
             <label className="block text-sm font-medium text-slate-700 mb-2">Mettre à jour le statut (Admin)</label>
             <div className="flex gap-3">
               <select
                 value={newStatus}
                 onChange={(e) => setNewStatus(e.target.value)}
                 className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
               >
                 <option value="En attente">En attente</option>
                 <option value="En cours">En cours</option>
                 <option value="Résolu">Résolu</option>
                 <option value="Rejeté">Rejeté</option>
               </select>
               <button
                 onClick={handleStatusChange}
                 disabled={loading || newStatus === ticket.status}
                 className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 {loading ? '...' : 'Appliquer'}
               </button>
             </div>
           </div>
          )}
        </div>
      </div>
    </div>
  )
}
