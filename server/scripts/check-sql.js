import { query } from "../db.js";

async function main() {
  try {
    const tables = await query(
      "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME",
    );
    console.log(
      "TABLES",
      tables.recordset.map((r) => `${r.TABLE_SCHEMA}.${r.TABLE_NAME}`),
    );

    const medTables = await query(
      "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME LIKE '%med%' ORDER BY TABLE_NAME",
    );
    console.log(
      "MED TABLES",
      medTables.recordset.map((r) => r.TABLE_NAME),
    );

    const icdTables = await query(
      "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME LIKE '%icd%' ORDER BY TABLE_NAME",
    );
    console.log(
      "ICD TABLES",
      icdTables.recordset.map((r) => r.TABLE_NAME),
    );

    const medicamentsCols = await query(
      "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Medicaments' ORDER BY ORDINAL_POSITION",
    );
    console.log("MEDICAMENTS COLUMNS", medicamentsCols.recordset);

    const count = await query("SELECT COUNT(*) AS Total FROM dbo.Medicaments");
    console.log("MEDICAMENTS COUNT", count.recordset[0]);

    const sample = await query("SELECT TOP 3 * FROM dbo.Medicaments");
    console.log("MEDICAMENTS SAMPLE", sample.recordset);

    const columnsSearch = await query(
      "SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND (COLUMN_NAME LIKE '%ICD%' OR COLUMN_NAME LIKE '%ICD-10%' OR COLUMN_NAME LIKE '%Maladie%' OR COLUMN_NAME LIKE '%Nom%' OR COLUMN_NAME LIKE '%Principe%' OR COLUMN_NAME LIKE '%Contre%') ORDER BY TABLE_NAME, ORDINAL_POSITION",
    );
    console.log("COLUMN MATCHES", columnsSearch.recordset.slice(0, 50));
  } catch (err) {
    console.error("ERROR", err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    process.exit(1);
  }
}

main();
