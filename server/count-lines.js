import { query } from "./db.js";

async function checkDb() {
  try {
    // Count terminated lines
    const teCnt = await query(
      "SELECT COUNT(*) as cnt FROM dbo.sinistres_termines_ligne",
    );
    const teCount = teCnt.recordset[0].cnt;

    // Count non-terminated lines
    const noTeCnt = await query(
      "SELECT COUNT(*) as cnt FROM dbo.sinistre_Ter_Lignes_NO_TE",
    );
    const noTeCount = noTeCnt.recordset[0].cnt;

    console.log("Terminated lines:", teCount);
    console.log("Non-terminated lines:", noTeCount);
    console.log("TOTAL:", teCount + noTeCount);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}

checkDb();
