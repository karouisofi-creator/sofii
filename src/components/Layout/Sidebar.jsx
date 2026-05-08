import React, { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", label: "Tableau de bord", icon: "📊" },
  { to: "/profile", label: "Mon profil", icon: "👤" },
  { to: "/batch", label: "Batch Processing", icon: "⚙️" },
  { to: "/reporting", label: "Demandes Reporting", icon: "📋" },
];

const adminItems = [
  { to: "/admin/users", label: "Gestion utilisateurs", icon: "👥" },
  { to: "/admin/logs", label: "Logs d'activité", icon: "📋" },
  { to: "/admin/settings", label: "Paramètres", icon: "⚙️" },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  function SearchControl() {
    const [active, setActive] = useState(false);
    const [value, setValue] = useState("");
    const ref = useRef(null);

    const open = () => {
      setActive(true);
      setTimeout(() => ref.current?.focus(), 50);
    };

    return (
      <div className="mt-3">
        <div className="relative h-11 overflow-hidden rounded-full">
          <button
            onClick={open}
            type="button"
            className={`absolute inset-0 flex items-center gap-2 rounded-full bg-white px-3 shadow-sm border border-slate-200 transition-all duration-300 ease-out ${active ? "pointer-events-none translate-y-1 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"}`}
            aria-label="Ouvrir recherche"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-slate-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <span className="text-sm font-medium text-slate-700">Rechercher</span>
          </button>

          <input
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setActive(false)}
            placeholder="Rechercher..."
            className={`absolute inset-0 w-full rounded-full border border-slate-200 bg-white px-3 text-sm text-black placeholder-slate-400 outline-none shadow-sm transition-all duration-300 ease-out ${active ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"}`}
          />
        </div>
      </div>
    );
  }

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg,#08122f 0%,#1a237e 55%,#f4b183 100%)",
      }}
    >
      {/* Logo + quick search */}
      <div className="p-6 border-b border-white border-opacity-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MSH Logo" className="h-10 w-auto" />
          <div>
            <p className="text-white font-bold text-sm">DataFlow</p>
            <p className="text-blue-300 text-xs">Claims Analysis</p>
          </div>
        </div>

        {/* small search input that appears on click/focus */}
        <SearchControl />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ease-out ${
                isActive
                  ? "bg-white bg-opacity-12 text-slate-900 font-semibold shadow-sm translate-x-1"
                  : "text-white/90 hover:bg-white hover:bg-opacity-8 hover:text-white hover:translate-x-1"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <div className="pt-4 mt-4 border-t border-white border-opacity-10">
              <p className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                Administration
              </p>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ease-out ${
                    isActive
                      ? "bg-white bg-opacity-12 text-slate-900 font-semibold shadow-sm translate-x-1"
                      : "text-white/90 hover:bg-white hover:bg-opacity-8 hover:text-white hover:translate-x-1"
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

      {/* User Info */}
      <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-white">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#08122f] to-[#f4b183] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-slate-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm bg-slate-50 text-slate-900 rounded-lg transition font-medium hover:bg-slate-100 border border-slate-100"
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  );
}
