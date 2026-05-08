import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  HERO_GRADIENT,
  PAGE_CONTAINER,
  PAGE_WRAPPER,
  PANEL_DESC,
  PANEL_TITLE,
  PANEL_WRAPPER,
  SELECT_CLASS,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SHELL,
} from "../../components/adminUi";

const ACTION_LABELS = {
  login: "Connexion",
  login_failed: "Échec connexion",
  logout: "Déconnexion",
  profile_update: "Mise à jour profil",
  user_created: "Utilisateur créé",
  user_updated: "Utilisateur modifié",
};

const ACTION_COLORS = {
  login: "bg-green-100 text-green-700 border border-green-200",
  login_failed: "bg-red-100 text-red-700 border border-red-200",
  logout: "bg-slate-100 text-slate-600 border border-slate-200",
  profile_update: "bg-blue-100 text-blue-700 border border-blue-200",
  user_created: "bg-purple-100 text-purple-700 border border-purple-200",
  user_updated: "bg-orange-100 text-orange-700 border border-orange-200",
};

const ACTION_ICONS = {
  login: "✅",
  login_failed: "❌",
  logout: "🚪",
  profile_update: "✏️",
  user_created: "👤",
  user_updated: "🔄",
};

export default function AdminLogs() {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const loadLogs = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set("action", filterAction);
      params.set("limit", "100");
      const res = await apiFetch(`/admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Erreur serveur");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterAction]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={PAGE_WRAPPER}>
      <div className={`${PAGE_CONTAINER} max-w-[1200px]`}>
        <div className={PANEL_WRAPPER}>
          <div className={HERO_GRADIENT}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10">📋</div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Logs d'activité</h1>
                  <p className="mt-2 max-w-2xl text-sm text-white/80">Supervision des actions de tous les utilisateurs</p>
                </div>
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className={SELECT_CLASS + " border-white/20 bg-white/10 text-white"}
              >
                <option value="">Toutes les actions</option>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="text-slate-800">
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white">
                  <p className="text-lg">{ACTION_ICONS[k]}</p>
                  <p className="text-xs text-slate-500 mt-1">{v}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {logs.filter((l) => l.action === k).length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className={TABLE_SHELL}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={TABLE_HEAD}>
                    Date
                  </th>
                  <th className={TABLE_HEAD}>
                    Utilisateur
                  </th>
                  <th className={TABLE_HEAD}>
                    Action
                  </th>
                  <th className={TABLE_HEAD}>
                    Détails
                  </th>
                  <th className={TABLE_HEAD}>
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <p className="text-4xl mb-2">📭</p>
                      <p>Aucune activité enregistrée</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={`${TABLE_ROW} ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {log.userEmail || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ACTION_ICONS[log.action]} {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {log.details || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {log.ip || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
