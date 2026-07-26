import odbc from "odbc";
const connStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;`;
async function main() {
  const conn = await odbc.connect(connStr);
  try {
    const r = await conn.query(
      "SELECT TOP (5) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE '%Gyn%' OR PrincipeActif LIKE '%Gyn%'",
    );
    console.log("rows", r && r.length ? r.slice(0, 5) : r);
  } catch (e) {
    console.error("err", e);
  } finally {
    await conn.close();
  }
}
main();
