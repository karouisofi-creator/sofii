import { query } from "./db.js";

async function checkDb() {
  try {
    console.log("=== CHECKING LINE TABLES ===\n");

    // Check terminated lines
    const teLines = await query(
      "SELECT COUNT(*) as cnt FROM dbo.sinistres_termines_lignes",
    );
    console.log("Terminated lines count:", teLines.recordset[0].cnt);

    // Check non-terminated lines
    const noTeLines = await query(
      "SELECT COUNT(*) as cnt FROM dbo.sinistres_ter_lignes_no_te",
    );
    console.log("Non-terminated lines count:", noTeLines.recordset[0].cnt);

    console.log("\n--- Terminated Lines ---");
    const teData = await query("SELECT * FROM dbo.sinistres_termines_lignes");
    teData.recordset.forEach((r, i) => {
      console.log(`[${i + 1}]`, JSON.stringify(r, null, 2));
    });

    console.log("\n--- Non-Terminated Lines ---");
    const noTeData = await query(
      "SELECT * FROM dbo.sinistres_ter_lignes_no_te",
    );
    noTeData.recordset.forEach((r, i) => {
      console.log(`[${i + 1}]`, JSON.stringify(r, null, 2));
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}

checkDb();
