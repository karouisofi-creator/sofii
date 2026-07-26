import { useAuth } from "../../context/AuthContext";

export default function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>
        <p className="text-slate-500 mt-1">Page d’administration</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-sm">
          <h2 className="text-lg font-bold">Compte connecté</h2>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/90">
            <p className="font-semibold">Utilisateur</p>
            <p className="mt-1 break-words text-white/75">
              {user?.email || "Inconnu"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
