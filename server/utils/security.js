import bcrypt from 'bcrypt'
import crypto from 'crypto'

/**
 * Facteur de coût bcrypt (10 = ~100ms, 12 = ~400ms, plus sécurisé)
 * 12 recommandé en production
 */
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10) || 12

/** Longueur min recommandée pour JWT_SECRET */
const MIN_JWT_SECRET_LENGTH = 32

/** Règles de complexité du mot de passe */
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128
const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

/**
 * Hash un mot de passe avec bcrypt (algorithme sécurisé, salt intégré)
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * Valide la complexité du mot de passe
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Mot de passe requis' }
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Minimum ${PASSWORD_MIN_LENGTH} caractères` }
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Maximum ${PASSWORD_MAX_LENGTH} caractères` }
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Au moins une majuscule requise' }
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Au moins une minuscule requise' }
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    return { valid: false, error: 'Au moins un chiffre requis' }
  }
  if (PASSWORD_RULES.requireSpecial) {
    const hasSpecial = [...SPECIAL_CHARS].some((c) => password.includes(c))
    if (!hasSpecial) {
      return { valid: false, error: `Au moins un caractère spécial (${SPECIAL_CHARS.slice(0, 10)}...)` }
    }
  }
  return { valid: true }
}

/**
 * Vérifie que JWT_SECRET est suffisamment fort
 */
export function validateJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) return false
  if (secret.length < MIN_JWT_SECRET_LENGTH) return false
  if (secret === 'dev-secret-change-in-production') return false
  return true
}

/**
 * Génère un secret aléatoire sécurisé (pour documentation/setup)
 */
export function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Sanitize une chaîne : trim, limite de longueur
 */
export function sanitizeString(str, maxLength = 255) {
  if (str == null) return ''
  const s = String(str).trim()
  return s.length > maxLength ? s.slice(0, maxLength) : s
}

/**
 * Valide le format email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim().toLowerCase()
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return trimmed.length <= 255 && regex.test(trimmed)
}

export { BCRYPT_ROUNDS }
