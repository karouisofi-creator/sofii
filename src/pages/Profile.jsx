import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, apiFetch, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')

  useEffect(() => {
    setFullName(user?.fullName || '')
  }, [user?.fullName])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword && !currentPassword) {
      setError('Mot de passe actuel requis pour le changer')
      return
    }

    setLoading(true)
    try {
      const body = { fullName: fullName.trim() }
      if (newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Erreur mise à jour')
      }

      updateUser(data)
      localStorage.setItem('dataflow_user', JSON.stringify(data))
      setSuccess('Profil mis à jour')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
      <p className="text-slate-500 mt-1">Consultez et modifiez vos informations</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Rôle</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${user?.role === 'admin' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'}`}>
              {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Changer le mot de passe</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 car., maj., min., chiffre, symbole"
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer"
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  )
}
