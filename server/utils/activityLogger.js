/**
 * Logs d'activité — stockage en mémoire
 * En production avec SQL Server, on peut migrer vers une table activity_logs
 */





// Only export ACTIONS, no log storage here
const ACTIONS = {
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PROFILE_UPDATE: 'profile_update',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
}

export { ACTIONS }





