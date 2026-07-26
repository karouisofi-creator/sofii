import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// SVG Icon Components
const BarChartIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="2" x2="12" y2="22"></line>
    <path d="M17 5H9.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5H17"></path>
    <path d="M5 9h3v10H5z"></path>
  </svg>
);

const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.96 2.96l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m2.96-2.96l4.24-4.24"></path>
  </svg>
);

const ClipboardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <line x1="9" y1="11" x2="15" y2="11"></line>
    <line x1="9" y1="16" x2="15" y2="16"></line>
  </svg>
);

const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const navItems = [
  { to: "/", label: "Tableau de bord", icon: BarChartIcon },
  { to: "/profile", label: "Mon profil", icon: UserIcon },
  { to: "/batch", label: "Batch Processing", icon: SettingsIcon },
  { to: "/reporting", label: "Demandes Reporting", icon: ClipboardIcon },
];

const adminItems = [
  { to: "/admin/users", label: "Gestion utilisateurs", icon: UsersIcon },
  { to: "/admin/logs", label: "Logs d'activité", icon: ClipboardIcon },
  { to: "/admin/settings", label: "Paramètres", icon: SettingsIcon },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-lg font-bold text-primary-700">
          DataFlow Assurance
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 transition ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "hover:bg-slate-50"
              }`
            }
          >
            <span
              className="flex-shrink-0 w-5 h-5"
              style={{ color: "inherit" }}
            >
              <item.icon />
            </span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <div className="pt-4 mt-4 border-t border-slate-200">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 transition ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "hover:bg-slate-50"
                  }`
                }
              >
                <span
                  className="flex-shrink-0 w-5 h-5"
                  style={{ color: "inherit" }}
                >
                  <item.icon />
                </span>
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
            <p className="text-sm font-medium text-slate-800 truncate">
              {user?.fullName}
            </p>
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
  );
}
