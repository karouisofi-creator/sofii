import { query } from "../db.js";

async function main() {
  const q = await query(
    "SELECT COUNT(*) AS Total FROM dbo.Medicaments WHERE Nom LIKE '%Gyn%' OR PrincipeActif LIKE '%Gyn%' OR Indications LIKE '%Gyn%' OR ContreIndications LIKE '%Gyn%'",
  );
  console.log("count", q.recordset);
  const sample = await query(
    "SELECT TOP 10 * FROM dbo.Medicaments WHERE Nom LIKE '%Gyn%' OR PrincipeActif LIKE '%Gyn%' OR Indications LIKE '%Gyn%' OR ContreIndications LIKE '%Gyn%' ORDER BY Id",
  );
  console.log("rows", sample.recordset);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
