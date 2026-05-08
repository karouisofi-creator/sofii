import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  HERO_GRADIENT,
  INPUT_CLASS,
  PAGE_WRAPPER,
  PANEL_TITLE,
  PANEL_WRAPPER,
  SELECT_CLASS,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SHELL,
} from "../../components/adminUi";

function RoleBadge({ role }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isAdmin ? "bg-primary-100 text-primary-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {isAdmin ? "Administrateur" : "Utilisateur"}
    </span>
  );
}

function StatusBadge({ isActive }) {
  const active = isActive !== false;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Actif" : "Désactivé"}
    </span>
  );
}

export default function AdminUsers() {
  const { apiFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/admin/users");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Erreur serveur");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.email?.toLowerCase().includes(term) ||
        user.fullName?.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive !== false).length;
    const admins = users.filter((user) => user.role === "admin").length;

    return {
      total,
      active,
      admins,
      inactive: total - active,
    };
  }, [users]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    const fullName = form.fullName.value.trim();
    const password = form.password.value;
    const role = form.role.value;

    if (!email || !password) {
      setError("Email et mot de passe requis");
      return;
    }

    setError("");
    try {
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, fullName, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur création");
      setCreateOpen(false);
      form.reset();
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = editUser.id;
    const fullName = form.fullName.value.trim();
    const role = form.role.value;
    const isActive = form.isActive.checked;
    const password = form.password.value;

    setError("");
    try {
      const res = await apiFetch(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName,
          role,
          isActive,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur mise à jour");
      setEditUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={PAGE_WRAPPER}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className={PANEL_WRAPPER}>
          <div className={HERO_GRADIENT}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Gestion des utilisateurs
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Crée, modifie et désactive les comptes depuis une interface plus
                lisible et plus rapide à parcourir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreateOpen(true);
                setError("");
              }}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1a237e] transition hover:bg-slate-100"
            >
              Créer un utilisateur
            </button>
          </div>
          </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-4">
          {[
            { label: "Total comptes", value: stats.total },
            { label: "Actifs", value: stats.active },
            { label: "Administrateurs", value: stats.admins },
            { label: "Désactivés", value: stats.inactive },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className={PANEL_TITLE}>
            Liste des comptes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Recherche, filtrage et gestion rapide des accès.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Rechercher par nom ou email"
            className={`${INPUT_CLASS} sm:w-80`}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">Tous les rôles</option>
            <option value="user">Utilisateurs</option>
            <option value="admin">Administrateurs</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className={TABLE_SHELL}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[linear-gradient(135deg,#08122f,#1a237e)] text-white">
                <tr>
                  <th className={TABLE_HEAD}>
                    Email
                  </th>
                  <th className={TABLE_HEAD}>
                    Nom
                  </th>
                  <th className={TABLE_HEAD}>
                    Rôle
                  </th>
                  <th className={TABLE_HEAD}>
                    Statut
                  </th>
                  <th className={TABLE_HEAD + " text-right"}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-14 text-center text-slate-500"
                    >
                      <p className="text-4xl mb-2">👥</p>
                      <p className="font-medium text-slate-700">
                        Aucun utilisateur trouvé
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Essaie de modifier la recherche ou le filtre de rôle.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`${TABLE_ROW} ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                    >
                      <td className="px-4 py-4 text-slate-800">{user.email}</td>
                      <td className="px-4 py-4 text-slate-700">
                        {user.fullName || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditUser(user);
                            setError("");
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:bg-white hover:text-primary-700"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className={HERO_GRADIENT}>
              <h2 className="text-xl font-bold">Créer un utilisateur</h2>
              <p className="mt-1 text-sm text-white/75">
                Ajoute un nouveau compte au dashboard.
              </p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className={INPUT_CLASS}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom complet
                </label>
                <input
                  name="fullName"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mot de passe *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className={INPUT_CLASS}
                  placeholder="Min. 8 caractères"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Min. 8 caractères, majuscule, minuscule, chiffre et symbole.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Rôle
                </label>
                <select
                  name="role"
                  className={SELECT_CLASS}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 font-semibold text-white transition hover:bg-primary-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className={HERO_GRADIENT}>
              <h2 className="text-xl font-bold">Modifier l'utilisateur</h2>
              <p className="mt-1 text-sm text-white/75">{editUser.email}</p>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom complet
                </label>
                <input
                  name="fullName"
                  type="text"
                  defaultValue={editUser.fullName}
                  className={INPUT_CLASS}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Rôle
                </label>
                <select
                  name="role"
                  defaultValue={editUser.role}
                  className={SELECT_CLASS}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editUser.isActive !== false}
                  id="edit-active"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Compte actif
                  </span>
                  <span className="block text-sm text-slate-500">
                    Désactive temporairement l'accès de cet utilisateur.
                  </span>
                </span>
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nouveau mot de passe (optionnel)
                </label>
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  className={INPUT_CLASS}
                  placeholder="Min. 8 caractères"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 font-semibold text-white transition hover:bg-primary-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
