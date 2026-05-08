import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, apiFetch, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");

  useEffect(() => {
    setFullName(user?.fullName || "");
  }, [user?.fullName]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword && !currentPassword) {
      setError("Mot de passe actuel requis pour le changer");
      return;
    }

    setLoading(true);
    try {
      const body = { fullName: fullName.trim() };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error || "Erreur mise à jour");

      updateUser(data);
      localStorage.setItem("dataflow_user", JSON.stringify(data));
      setSuccess("Profil mis à jour avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
        >
          {user?.fullName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{user?.fullName}</h1>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          <span
            className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
              user?.role === "admin"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {user?.role === "admin" ? "👑 Administrateur" : "👤 Utilisateur"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        {/* Informations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="px-6 py-4 border-b border-slate-100"
            style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
          >
            <h2 className="text-white font-bold flex items-center gap-2">
              <span>👤</span> Informations personnelles
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                ⚠️ L'email ne peut pas être modifié
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Mot de passe */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="px-6 py-4 border-b border-slate-100"
            style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
          >
            <h2 className="text-white font-bold flex items-center gap-2">
              <span>🔒</span> Changer le mot de passe
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 car., maj., min., chiffre, symbole"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow"
          style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
        >
          {loading
            ? "⏳ Enregistrement..."
            : "💾 Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
