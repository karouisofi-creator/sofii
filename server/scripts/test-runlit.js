import { query, getPool } from "../db.js";

async function runLitQuery(sqlLit) {
  try {
    return await query(sqlLit);
  } catch (e) {
    console.warn(
      "query() failed, falling back to direct ODBC:",
      e.message || e,
    );
    const conn = await getPool();
    try {
      const rows = await conn.query(sqlLit);
      return { recordset: rows };
    } finally {
      try {
        await conn.close();
      } catch (ee) {}
    }
  }
}

async function main() {
  const q = "Gynécologie";
  const search = `%${q.replace(/%/g, "[%]").replace(/_/g, "[_]")}%`;
  const tokenFrag = q.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").slice(0, 3) || q;
  const token = tokenFrag ? `%${tokenFrag}%` : search;
  const medSql = `SELECT TOP (8) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE @search OR PrincipeActif LIKE @search OR Indications LIKE @search OR Nom LIKE @token OR PrincipeActif LIKE @token ORDER BY Nom`;
  const esc = (v) => String(v || "").replace(/'/g, "''");
  const medSqlLit = medSql
    .replace(/@search/g, `'${esc(search)}'`)
    .replace(/@token/g, `'${esc(token)}'`);
  console.log("medSqlLit start", medSqlLit.slice(0, 200));
  const medR = await runLitQuery(medSqlLit);
  console.log(
    "medR count",
    (medR.recordset || []).length,
    (medR.recordset || []).slice(0, 5),
  );
}

main();
