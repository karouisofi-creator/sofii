import { getPool } from "../db.js";
import * as memoryStore from "./memoryStore.js";
import * as sqlStore from "./sqlStore.js";

let store = null;

export async function initStore() {
  try {
    await getPool();
    store = sqlStore;
    return "sql";
  } catch {
    await memoryStore.init();
    store = memoryStore;
    return "memory";
  }
}

export function getStore() {
  return store;
}
