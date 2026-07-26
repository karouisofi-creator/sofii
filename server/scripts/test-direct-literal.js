import odbc from "odbc";
const connStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;`;
async function main() {
  const conn = await odbc.connect(connStr);
  const q = "Gynécologie";
  const search = `%${q.replace(/%/g, "[%]").replace(/_/g, "[_]")}%`;
  const norm = q;
  const tokenFrag = norm.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").slice(0, 3) || norm;
  const token = tokenFrag ? `%${tokenFrag}%` : search;

  const medSql = `SELECT TOP (8) Id, Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications, 'medication' AS SourceType, 'dbo.Medicaments' AS SourceTable FROM dbo.Medicaments WHERE Nom LIKE @search OR PrincipeActif LIKE @search OR Indications LIKE @search OR Posologie LIKE @search OR EffetsSecondaires LIKE @search OR ContreIndications LIKE @search OR Nom LIKE @token OR PrincipeActif LIKE @token ORDER BY CASE WHEN Nom LIKE @exact THEN 0 ELSE 1 END, Nom`;
  const medSqlLit = medSql
    .replace(/@search/g, `'${search.replace(/'/g, "''")}'`)
    .replace(/@exact/g, `'${search.replace(/'/g, "''")}'`)
    .replace(/@token/g, `'${token.replace(/'/g, "''")}'`);
  console.log("medSqlLit start:", medSqlLit.slice(0, 200));
  try {
    const r = await conn.query(medSqlLit);
    console.log("OK med rows", r.length ? r.slice(0, 5) : r);
  } catch (e) {
    console.error("ERR med direct", e);
  } finally {
    await conn.close();
  }
}
main();
