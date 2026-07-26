import { query } from "../db.js";

async function main() {
  const q = "Gynécologie";
  const search = `%${q.replace(/%/g, "[%]").replace(/_/g, "[_]")}%`;
  const exact = search;
  const norm = q;
  const tokenFrag = norm.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").slice(0, 3) || norm;
  const token = tokenFrag ? `%${tokenFrag}%` : search;

  const medSql = `SELECT TOP (8) Id, Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications, 'medication' AS SourceType, 'dbo.Medicaments' AS SourceTable FROM dbo.Medicaments WHERE Nom LIKE @search OR PrincipeActif LIKE @search OR Indications LIKE @search OR Posologie LIKE @search OR EffetsSecondaires LIKE @search OR ContreIndications LIKE @search OR Nom LIKE @token OR PrincipeActif LIKE @token ORDER BY CASE WHEN Nom LIKE @exact THEN 0 ELSE 1 END, Nom`;
  const icdSql = `SELECT TOP (8) Id, Category, Care, ICDCode, SourceSheet, 'icd' AS SourceType, 'dbo.ICD10' AS SourceTable FROM dbo.ICD10 WHERE Category LIKE @search OR Care LIKE @search OR ICDCode LIKE @search OR Category LIKE @token OR Care LIKE @token ORDER BY CASE WHEN Category LIKE @exact THEN 0 ELSE 1 END, Category`;
  const diseaseSql = `SELECT TOP (8) Id, Maladie, Medicaments, ICD10, SourceSheet, 'disease' AS SourceType, 'dbo.MaladieChronique' AS SourceTable FROM dbo.MaladieChronique WHERE Maladie LIKE @search OR Medicaments LIKE @search OR ICD10 LIKE @search OR Maladie LIKE @token OR Medicaments LIKE @token ORDER BY CASE WHEN Maladie LIKE @exact THEN 0 ELSE 1 END, Maladie`;

  console.log("search param", search, "token", token);

  try {
    console.log("-- medSql --");
    try {
      const medR = await query(medSql, { search, exact, token });
      console.log("medResult count", (medR.recordset || []).length);
      console.log("med sample", (medR.recordset || []).slice(0, 3));
    } catch (e) {
      console.error("med query error", e);
    }

    console.log("-- icdSql --");
    try {
      const icdR = await query(icdSql, { search, exact, token });
      console.log("icdResult count", (icdR.recordset || []).length);
      console.log("icd sample", (icdR.recordset || []).slice(0, 3));
    } catch (e) {
      console.error("icd query error", e);
    }

    console.log("-- diseaseSql --");
    try {
      const disR = await query(diseaseSql, { search, exact, token });
      console.log("diseaseResult count", (disR.recordset || []).length);
      console.log("disease sample", (disR.recordset || []).slice(0, 3));
    } catch (e) {
      console.error("disease query error", e);
    }
  } catch (err) {
    console.error("ERR", err);
  }
}

main();
