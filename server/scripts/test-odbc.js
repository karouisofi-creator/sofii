import odbc from "odbc";
const connStr =
  "DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;";
async function main() {
  const conn = await odbc.connect(connStr);
  try {
    const result1 = await conn.query("SELECT TOP 3 * FROM dbo.Medicaments");
    console.log(
      "result1 type",
      typeof result1,
      Array.isArray(result1),
      Object.keys(result1),
    );
    console.log("result1 sample", result1[0]);
    const result2 = await conn.query(
      "SELECT COUNT(*) AS Total FROM dbo.Medicaments",
    );
    console.log(
      "result2 type",
      typeof result2,
      Array.isArray(result2),
      Object.keys(result2),
    );
    console.log("result2 sample", result2[0]);
  } catch (err) {
    console.error("ERR", err);
  } finally {
    await conn.close();
  }
}
main();
