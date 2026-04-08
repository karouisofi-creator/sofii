import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../hooks/useTickets'
import CreateTicketModal from '../components/Reporting/CreateTicketModal'
import TicketDetailsModal from '../components/Reporting/TicketDetailsModal'

export default function Reporting() {
  const { user, isAdmin } = useAuth()
  const { tickets, loading, error, createTicket, updateTicket } = useTickets(localStorage.getItem('dataflow_token'))
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  
  const [filterStatus, setFilterStatus] = useState('Tous')
  
  const handleCreateSubmit = async (formData) => {
    await createTicket(formData)
  }

  const handleUpdateStatus = async (id, newStatus) => {
<<<<<<< HEAD
    const update = { status: newStatus }
    if (newStatus === 'Résolu' && user) {
      update.solvedBy = user.email // or user.fullName if you prefer
    }
    await updateTicket(id, update)
=======
    await updateTicket(id, { status: newStatus })
>>>>>>> b385096c56d9c16716bdf65aa09115e5ba4b8c8f
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

  const filteredTickets = tickets.filter(t => 
    filterStatus === 'Tous' ? true : t.status === filterStatus
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Demandes de Reporting</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin() ? 'Gérez les demandes d\'extraction des utilisateurs.' : 'Suivez vos demandes d\'extraction spécifiques.'}
          </p>
        </div>
        {!isAdmin() && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
          >
           Nouvelle Demande
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours</option>
            <option value="Résolu">Résolu</option>
            <option value="Rejeté">Rejeté</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Titre</th>
                <th className="px-6 py-4 font-medium">Type</th>
                {isAdmin() && <th className="px-6 py-4 font-medium">Demandeur</th>}
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Date Création</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Chargement...</td></tr>
              ) : error ? (
                 <tr><td colSpan={7} className="text-center py-8 text-red-500">{error}</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Aucune demande trouvée.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">#{ticket.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{ticket.title}</td>
                    <td className="px-6 py-4 text-slate-600">{ticket.type}</td>
                    {isAdmin() && <td className="px-6 py-4 text-slate-600">User ID: {ticket.userId}</td>}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                       Consulter
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTicketModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreateSubmit} 
      />

      <TicketDetailsModal 
        ticket={selectedTicket} 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  )
}
