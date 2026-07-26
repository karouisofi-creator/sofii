import { query } from "../db.js";

async function main() {
  const sql = `SELECT TOP (2) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE '%gyn%' ORDER BY Id`;
  const res = await query(sql);
  console.log("recordset length", res.recordset.length);
  res.recordset.forEach((row, idx) => {
    const nom = row.Nom;
    console.log("row", idx + 1);
    console.log("Nom:", nom);
    console.log("Nom length:", nom.length);
    console.log("Nom hex:", Buffer.from(nom, "latin1").toString("hex"));
    console.log(
      "Nom latin1->utf8:",
      Buffer.from(nom, "latin1").toString("utf8"),
    );
    console.log(
      "Nom utf8->latin1:",
      Buffer.from(nom, "utf8").toString("latin1"),
    );
    console.log("----");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
