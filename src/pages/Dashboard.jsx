import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Bienvenue, {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Claims traités</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">—</p>
          <p className="text-xs text-slate-400 mt-1">Connexion SSMS requise</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Taux de validation</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">—</p>
          <p className="text-xs text-slate-400 mt-1">Module Dashboard à venir</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Rôle actuel</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{isAdmin() ? 'Administrateur' : 'Utilisateur'}</p>
        </div>
      </div>
    </div>
  )
}
