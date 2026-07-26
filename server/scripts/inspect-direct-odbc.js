import { getPool } from "../db.js";

async function main() {
  const sql = `SELECT TOP (2) Id, Nom, PrincipeActif FROM dbo.Medicaments WHERE Nom LIKE '%gyn%' ORDER BY Id`;
  const conn = await getPool();
  try {
    const rows = await conn.query(sql);
    console.log("rows type", Object.prototype.toString.call(rows));
    console.log("isArray", Array.isArray(rows));
    console.log("count", rows.length);
    rows.forEach((row, idx) => {
      const nom = row.Nom;
      console.log("row", idx + 1);
      console.log("Nom raw:", nom);
      console.log("Nom typeof", typeof nom);
      console.log("Nom hex utf8", Buffer.from(nom, "utf8").toString("hex"));
      console.log("Nom hex latin1", Buffer.from(nom, "latin1").toString("hex"));
      console.log(
        "Nom utf8->latin1->utf8",
        Buffer.from(
          Buffer.from(nom, "utf8").toString("latin1"),
          "latin1",
        ).toString("utf8"),
      );
      console.log(
        "Nom latin1->utf8",
        Buffer.from(nom, "latin1").toString("utf8"),
      );
      console.log("---");
    });
  } catch (e) {
    console.error("error", e);
  } finally {
    await conn.close();
  }
}

main().catch(console.error);
