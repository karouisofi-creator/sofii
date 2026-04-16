import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/profile', label: 'Mon profil', icon: '👤' },
  { to: '/batch', label: 'Batch Processing', icon: '⚙️' },
  { to: '/reporting', label: 'Demandes Reporting', icon: '📋' },
]

const adminItems = [
  { to: '/admin/users', label: 'Gestion utilisateurs', icon: '👥' },
  { to: '/admin/logs', label: 'Logs d\'activité', icon: '📋' },
  { to: '/admin/settings', label: 'Paramètres', icon: '⚙️' },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-lg font-bold text-primary-700">DataFlow Assurance</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 transition ${
                isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-slate-50'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <div className="pt-4 mt-4 border-t border-slate-200">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</p>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 transition ${
                    isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-slate-50'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
