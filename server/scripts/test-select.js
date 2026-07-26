import odbc from "odbc";
const connStr =
  "DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;";
async function main() {
  const conn = await odbc.connect(connStr);
  try {
    const count = await conn.query(
      "SELECT COUNT(*) AS Total FROM dbo.Medicaments",
    );
    console.log(
      "count type",
      Array.isArray(count),
      count.length ? count[0] : count,
    );
    const sample = await conn.query(
      "SELECT TOP 3 Id, Nom, PrincipeActif FROM dbo.Medicaments ORDER BY Id",
    );
    console.log(
      "sample type",
      Array.isArray(sample),
      sample.length ? sample[0] : sample,
    );
    const sample2 = await conn.query(
      "SELECT TOP 3 Id, Nom, PrincipeActif, Indications FROM dbo.Medicaments ORDER BY Id",
    );
    console.log(
      "sample2 type",
      Array.isArray(sample2),
      sample2.length ? sample2[0] : sample2,
    );
  } catch (err) {
    console.error("ERR", err);
  } finally {
    await conn.close();
  }
}
main();
