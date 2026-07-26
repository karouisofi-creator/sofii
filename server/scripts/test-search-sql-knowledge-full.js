import { query, getPool } from "../db.js";

async function runLitQuery(sqlLit) {
  try {
    return await query(sqlLit);
  } catch (e) {
    console.warn(
      "⚠ query() failed, falling back to direct ODBC:",
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
  const raw = q.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  const tokenFrag = raw.slice(0, 3) || q;
  const token = tokenFrag ? `%${tokenFrag}%` : search;
  const medSql = `SELECT TOP (8) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE @search OR PrincipeActif LIKE @search OR Indications LIKE @search OR Posologie LIKE @search OR EffetsSecondaires LIKE @search OR ContreIndications LIKE @search OR Nom LIKE @token OR PrincipeActif LIKE @token ORDER BY Nom`;
  const icdSql = `SELECT TOP (8) Id, Category, Care, ICDCode FROM dbo.ICD10 WHERE Category LIKE @search OR Care LIKE @search OR ICDCode LIKE @search OR Category LIKE @token OR Care LIKE @token ORDER BY Category`;
  const diseaseSql = `SELECT TOP (8) Id, Maladie, Medicaments, ICD10 FROM dbo.MaladieChronique WHERE Maladie LIKE @search OR Medicaments LIKE @search OR ICD10 LIKE @search OR Maladie LIKE @token OR Medicaments LIKE @token ORDER BY Maladie`;
  const esc = (v) => String(v || "").replace(/'/g, "''");
  const safeSearch = esc(search);
  const safeToken = esc(token);
  const medSqlLit = medSql
    .replace(/@search/g, `'${safeSearch}'`)
    .replace(/@token/g, `'${safeToken}'`);
  const icdSqlLit = icdSql
    .replace(/@search/g, `'${safeSearch}'`)
    .replace(/@token/g, `'${safeToken}'`);
  const diseaseSqlLit = diseaseSql
    .replace(/@search/g, `'${safeSearch}'`)
    .replace(/@token/g, `'${safeToken}'`);
  console.log("medSqlLit", medSqlLit);
  console.log("icdSqlLit", icdSqlLit);
  console.log("diseaseSqlLit", diseaseSqlLit);
  for (const [label, sql] of [
    ["med", medSqlLit],
    ["icd", icdSqlLit],
    ["disease", diseaseSqlLit],
  ]) {
    try {
      const res = await runLitQuery(sql);
      console.log(label, "count", (res.recordset || []).length);
    } catch (e) {
      console.error(label, "failed", e);
    }
  }
}
main();
