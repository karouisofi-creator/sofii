import { query } from '../db.js'
import { hashPassword } from '../utils/security.js'

const defaultSettings = {
  maintenanceMode: false,
  emailNotifications: true,
  securityAlerts: true,
  autoSaveReports: true,
  aiAssistant: true,
}

let settingsTableReady = false

async function ensureSettingsTable() {
  if (settingsTableReady) return

  await query(`
    IF OBJECT_ID('app_settings', 'U') IS NULL
    BEGIN
      CREATE TABLE app_settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        maintenanceMode BIT NOT NULL DEFAULT 0,
        emailNotifications BIT NOT NULL DEFAULT 1,
        securityAlerts BIT NOT NULL DEFAULT 1,
        autoSaveReports BIT NOT NULL DEFAULT 1,
        aiAssistant BIT NOT NULL DEFAULT 1,
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      )
    END
  `)

  settingsTableReady = true
}

export async function getByEmail(email) {
  const result = await query(
    `SELECT id, email, fullName, passwordHash, role, isActive 
     FROM users 
     WHERE LOWER(email) = LOWER(@email)`,
    { email }
  )
  return result.recordset[0] || null
}

export async function getById(id) {
  const result = await query(
    `SELECT id, email, fullName, role, isActive 
     FROM users 
     WHERE id = @id`,
    { id }
  )
  return result.recordset[0] || null
}

export async function listAll() {
  const result = await query(
    `SELECT id, email, fullName, role, isActive, createdAt 
     FROM users 
     ORDER BY createdAt DESC`
  )
  return result.recordset || []
}

export async function create({ email, fullName, password, role = 'user' }) {
  const passwordHash = await hashPassword(password)
  const result = await query(
    `INSERT INTO users (email, fullName, passwordHash, role)
     OUTPUT INSERTED.id, INSERTED.email, INSERTED.fullName, INSERTED.role, INSERTED.isActive, INSERTED.createdAt
     VALUES (@email, @fullName, @passwordHash, @role)`,
    {
      email: email.toLowerCase(),
      fullName: fullName || email,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
    }
  )
  return result.recordset[0] || null
}

export async function update(id, { fullName, role, isActive, password }) {
  const user = await getById(id)
  if (!user) return null

  const updates = {
    fullName: fullName !== undefined ? fullName : user.fullName,
    role: role !== undefined ? (role === 'admin' ? 'admin' : 'user') : user.role,
    isActive: isActive !== undefined ? !!isActive : user.isActive,
  }

  if (password !== undefined && password.length > 0) {
    const passwordHash = await hashPassword(password)
    await query(
      `UPDATE users SET fullName = @fullName, role = @role, isActive = @isActive, passwordHash = @passwordHash, updatedAt = GETDATE() WHERE id = @id`,
      { id, ...updates, passwordHash }
    )
  } else {
    await query(
      `UPDATE users SET fullName = @fullName, role = @role, isActive = @isActive, updatedAt = GETDATE() WHERE id = @id`,
      { id, ...updates }
    )
  }
  return getById(id)
}

export async function getSettings() {
  await ensureSettingsTable()

  const result = await query(
    `SELECT TOP 1 maintenanceMode, emailNotifications, securityAlerts, autoSaveReports, aiAssistant
     FROM app_settings
     ORDER BY id DESC`
  )

  const row = result.recordset[0]
  if (!row) {
    await saveSettings(defaultSettings)
    return { ...defaultSettings }
  }

  return {
    maintenanceMode: !!row.maintenanceMode,
    emailNotifications: !!row.emailNotifications,
    securityAlerts: !!row.securityAlerts,
    autoSaveReports: !!row.autoSaveReports,
    aiAssistant: !!row.aiAssistant,
  }
}

export async function saveSettings(nextSettings) {
  await ensureSettingsTable()

  const payload = { ...defaultSettings, ...nextSettings }
  const existing = await query(`SELECT TOP 1 id FROM app_settings ORDER BY id DESC`)

  if (existing.recordset[0]) {
    await query(
      `UPDATE app_settings
       SET maintenanceMode = @maintenanceMode,
           emailNotifications = @emailNotifications,
           securityAlerts = @securityAlerts,
           autoSaveReports = @autoSaveReports,
           aiAssistant = @aiAssistant,
           updatedAt = GETDATE()
       WHERE id = @id`,
      { id: existing.recordset[0].id, ...payload }
    )
  } else {
    await query(
      `INSERT INTO app_settings
       (maintenanceMode, emailNotifications, securityAlerts, autoSaveReports, aiAssistant)
       VALUES (@maintenanceMode, @emailNotifications, @securityAlerts, @autoSaveReports, @aiAssistant)`,
      payload
    )
  }

  return payload
}
