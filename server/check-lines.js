import { query } from "./db.js";

async function checkDb() {
  try {
    console.log("=== CHECKING ACTUAL LINE TABLES ===\n");

    // Check terminated lines
    const teLines = await query(
      "SELECT COUNT(*) as cnt FROM dbo.sinistres_termines_ligne",
    );
    console.log("Terminated lines count:", teLines.recordset[0].cnt);

    // Check non-terminated lines
    const noTeLines = await query(
      "SELECT COUNT(*) as cnt FROM dbo.sinistre_Ter_Lignes_NO_TE",
    );
    console.log("Non-terminated lines count:", noTeLines.recordset[0].cnt);

    console.log(
      "\nTOTAL LINES:",
      teLines.recordset[0].cnt + noTeLines.recordset[0].cnt,
    );

    console.log("\n--- Terminated Lines ---");
    const teData = await query("SELECT * FROM dbo.sinistres_termines_ligne");
    console.log("Columns:", Object.keys(teData.recordset[0] || {}));
    teData.recordset.forEach((r, i) => {
      console.log(`[${i + 1}]`, r);
    });

    console.log("\n--- Non-Terminated Lines ---");
    const noTeData = await query("SELECT * FROM dbo.sinistre_Ter_Lignes_NO_TE");
    console.log("Columns:", Object.keys(noTeData.recordset[0] || {}));
    noTeData.recordset.forEach((r, i) => {
      console.log(`[${i + 1}]`, r);
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}

checkDb();
