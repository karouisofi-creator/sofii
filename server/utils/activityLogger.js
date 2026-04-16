/**
 * Logs d'activité — stockage en mémoire
 * En production avec SQL Server, on peut migrer vers une table activity_logs
 */

const logs = []
const MAX_LOGS = 500
let nextId = 1

const ACTIONS = {
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PROFILE_UPDATE: 'profile_update',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
}

/**
 * Enregistre une activité
 * @param {{ userId?: number, userEmail?: string, action: string, details?: string, ip?: string }}
 */
export function addLog({ userId, userEmail, action, details = '', ip }) {
  logs.unshift({
    id: nextId++,
    userId: userId ?? null,
    userEmail: userEmail ?? null,
    action,
    details,
    ip: ip ?? null,
    createdAt: new Date().toISOString(),
  })
  if (logs.length > MAX_LOGS) logs.pop()
}

/**
 * Récupère les logs avec filtres optionnels
 * @param {{ userId?: number, action?: string, limit?: number }}
 */
export function getLogs({ userId, action, limit = 100 } = {}) {
  let result = [...logs]
  if (userId != null) result = result.filter((l) => l.userId === userId)
  if (action) result = result.filter((l) => l.action === action)
  return result.slice(0, limit)
}

export { ACTIONS }
