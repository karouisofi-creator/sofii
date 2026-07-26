import odbc from "odbc";
const connStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;`;
async function main() {
  const conn = await odbc.connect(connStr);
  try {
    const r = await conn.query(
      "SELECT TOP (5) Id, Nom, PrincipeActif FROM dbo.Medicaments",
    );
    console.log("rows", r.length ? r : r);
  } catch (e) {
    console.error("err", e);
  } finally {
    await conn.close();
  }
}
main();
