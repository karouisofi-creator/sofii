import odbc from "odbc";
const connStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;`;
async function main() {
  const conn = await odbc.connect(connStr);
  const token = "%Gyn%";
  try {
    const medSql = `SELECT TOP (8) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE '${token}' OR PrincipeActif LIKE '${token}' OR Indications LIKE '${token}'`;
    const med = await conn.query(medSql);
    console.log("med rows", med.length ? med.slice(0, 5) : med);

    const icdSql = `SELECT TOP (8) Id, Category, Care FROM dbo.ICD10 WHERE Category LIKE '${token}' OR Care LIKE '${token}'`;
    const icd = await conn.query(icdSql);
    console.log("icd rows", icd.length ? icd.slice(0, 5) : icd);

    const disSql = `SELECT TOP (8) Id, Maladie, Medicaments FROM dbo.MaladieChronique WHERE Maladie LIKE '${token}' OR Medicaments LIKE '${token}'`;
    const dis = await conn.query(disSql);
    console.log("disease rows", dis.length ? dis.slice(0, 5) : dis);
  } catch (e) {
    console.error("ERR", e);
  } finally {
    await conn.close();
  }
}
main();
