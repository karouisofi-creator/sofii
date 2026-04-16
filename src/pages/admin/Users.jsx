import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { apiFetch } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const loadUsers = async () => {
    setError('')
    try {
      const res = await apiFetch('/admin/users')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Erreur serveur')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    const form = e.target
    const email = form.email.value.trim()
    const fullName = form.fullName.value.trim()
    const password = form.password.value
    const role = form.role.value
    if (!email || !password) {
      setError('Email et mot de passe requis')
      return
    }
    setError('')
    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, fullName, password, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur création')
      setCreateOpen(false)
      form.reset()
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    const form = e.target
    const id = editUser.id
    const fullName = form.fullName.value.trim()
    const role = form.role.value
    const isActive = form.isActive.checked
    const password = form.password.value
    setError('')
    try {
      const res = await apiFetch(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName,
          role,
          isActive,
          ...(password ? { password } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour')
      setEditUser(null)
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des utilisateurs</h1>
          <p className="text-slate-500 mt-1">Créer, modifier et désactiver les comptes</p>
        </div>
        <button
          type="button"
          onClick={() => { setCreateOpen(true); setError(''); }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
        >
          Créer un utilisateur
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Rôle</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Aucun utilisateur
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-800">{u.email}</td>
                    <td className="py-3 px-4 text-slate-700">{u.fullName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={u.isActive !== false ? 'text-green-600' : 'text-slate-400'}>
                        {u.isActive !== false ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => { setEditUser(u); setError(''); }}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
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
      )}

      {/* Modal Créer */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Créer un utilisateur</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input name="fullName" type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
                <input name="password" type="password" required minLength={8} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Min. 8 car., maj., min., chiffre, symbole" />
                <p className="text-xs text-slate-500 mt-1">Min. 8 caractères, majuscule, minuscule, chiffre et symbole (!@#$...)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select name="role" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Modifier l'utilisateur</h2>
              <p className="text-sm text-slate-500 mt-1">{editUser.email}</p>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input name="fullName" type="text" defaultValue={editUser.fullName} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select name="role" defaultValue={editUser.role} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input name="isActive" type="checkbox" defaultChecked={editUser.isActive !== false} id="edit-active" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="edit-active" className="text-sm text-slate-700">Compte actif</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe (optionnel)</label>
                <input name="password" type="password" minLength={8} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Min. 8 car., maj., min., chiffre, symbole" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
