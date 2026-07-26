import { query } from "./db.js";

async function checkDb() {
  try {
    console.log("=== LISTING ALL TABLES ===\n");

    // Get all tables
    const tables = await query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    );

    console.log("Available tables:");
    tables.recordset.forEach((t) => {
      console.log("  -", t.TABLE_NAME);
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}

checkDb();
