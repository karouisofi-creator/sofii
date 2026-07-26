import odbc from "odbc";
const connStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;`;
async function main() {
  const conn = await odbc.connect(connStr);
  const q = "Gynécologie";
  const search = `%${q}%`;
  try {
    const medSql = `SELECT TOP (8) Id, Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications FROM dbo.Medicaments WHERE Nom LIKE '${search}' OR PrincipeActif LIKE '${search}' OR Indications LIKE '${search}' OR Posologie LIKE '${search}' OR EffetsSecondaires LIKE '${search}' OR ContreIndications LIKE '${search}' ORDER BY Nom`;
    const med = await conn.query(medSql);
    console.log("med rows", med.length ? med.slice(0, 3) : med);

    const icdSql = `SELECT TOP (8) Id, Category, Care, ICDCode, SourceSheet FROM dbo.ICD10 WHERE Category LIKE '${search}' OR Care LIKE '${search}' OR ICDCode LIKE '${search}' ORDER BY Category`;
    const icd = await conn.query(icdSql);
    console.log("icd rows", icd.length ? icd.slice(0, 3) : icd);

    const disSql = `SELECT TOP (8) Id, Maladie, Medicaments, ICD10, SourceSheet FROM dbo.MaladieChronique WHERE Maladie LIKE '${search}' OR Medicaments LIKE '${search}' OR ICD10 LIKE '${search}' ORDER BY Maladie`;
    const dis = await conn.query(disSql);
    console.log("disease rows", dis.length ? dis.slice(0, 3) : dis);
  } catch (e) {
    console.error("ERR", e);
  } finally {
    await conn.close();
  }
}
main();
