import odbc from "odbc";
const connStr =
  "DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;";
async function main() {
  const conn = await odbc.connect(connStr);
  try {
    const rows = await conn.query(
      "SELECT TOP 10 Id, Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications FROM dbo.Medicaments WHERE Nom LIKE '%Gyn%' OR PrincipeActif LIKE '%Gyn%' OR Indications LIKE '%Gyn%' OR ContreIndications LIKE '%Gyn%' ORDER BY Id",
    );
    console.log("rows", rows);
  } catch (err) {
    console.error("ERR", err);
  } finally {
    await conn.close();
  }
}
main();
