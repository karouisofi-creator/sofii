import odbc from "odbc";
const connStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;`;
async function main() {
  const conn = await odbc.connect(connStr);
  try {
    const q = "Gynécologie";
    const search = `%${q.replace(/%/g, "[%]").replace(/_/g, "[_]")}%`;
    const sql = `SELECT TOP (8) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE '${search.replace(/'/g, "''")}' OR PrincipeActif LIKE '${search.replace(/'/g, "''")}' OR Indications LIKE '${search.replace(/'/g, "''")}' ORDER BY Nom`;
    console.log("sql start", sql.slice(0, 150));
    const r = await conn.query(sql);
    console.log("rows", r && r.length ? r.slice(0, 5) : r);
  } catch (e) {
    console.error("err", e);
  } finally {
    await conn.close();
  }
}
main();
