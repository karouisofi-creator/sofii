import { getPool } from '../db.js'
import * as memoryStore from './memoryStore.js'
import * as sqlStore from './sqlStore.js'
import * as ticketsMemoryStore from './ticketsMemoryStore.js'
import * as ticketsSqlStore from './ticketsSqlStore.js'

let store = null

export async function initStore() {
  try {
    await getPool()
    store = { ...sqlStore, ticketsStore: ticketsSqlStore }
    return 'sql'
  } catch {
    await memoryStore.init()
    await ticketsMemoryStore.init()
    store = { ...memoryStore, ticketsStore: ticketsMemoryStore }
    return 'memory'
  }
}

export function getStore() {
  return store
}
