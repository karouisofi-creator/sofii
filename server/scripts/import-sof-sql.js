import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";
import { query } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFile = process.argv[2] || path.join(__dirname, "..", "sof.xlsx");

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function sanitizeText(value) {
  return normalize(value).replace(/\s+/g, " ");
}

function readWorkbook(file) {
  const workbook = xlsx.readFile(file);
  const rows = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    sheetRows.forEach((row, index) => {
      rows.push({ sheetName, row, index });
    });
  });
  return rows;
}

function buildIcdRow(entry) {
  const row = entry.row;
  const sheetName = entry.sheetName;

  const category = sanitizeText(
    row["Catégorie"] ||
      row["Spécialité"] ||
      row["Category"] ||
      row["Specialite"] ||
      "",
  );
  const care = sanitizeText(
    row["Soins"] || row["Soin / Acte"] || row["Care"] || row["Acte"] || "",
  );
  const icdCode = sanitizeText(
    row["ICD à utiliser"] || row["ICD-10"] || row["ICD"] || "",
  );

  if (!category && !care && !icdCode) return null;

  return {
    Category: category,
    Care: care,
    ICDCode: icdCode,
    SourceSheet: sheetName,
  };
}

function buildDiseaseRow(entry) {
  const row = entry.row;
  const sheetName = entry.sheetName;

  const maladie = sanitizeText(
    row["Maladie chronique"] || row["Maladie"] || "",
  );
  const medicaments = sanitizeText(
    row["Exemples de médicaments (courants)"] || row["Médicaments"] || "",
  );
  const icdCode = sanitizeText(row["ICD-10"] || row["ICD à utiliser"] || "");

  if (!maladie && !medicaments && !icdCode) return null;

  return {
    Maladie: maladie,
    Medicaments: medicaments,
    ICD10: icdCode,
    SourceSheet: sheetName,
  };
}

async function ensureTables() {
  await query(`
    IF OBJECT_ID('dbo.ICD10', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ICD10 (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Category NVARCHAR(255) NULL,
        Care NVARCHAR(MAX) NULL,
        ICDCode NVARCHAR(255) NULL,
        SourceSheet NVARCHAR(100) NULL
      );
    END

    IF OBJECT_ID('dbo.MaladieChronique', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.MaladieChronique (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Maladie NVARCHAR(255) NULL,
        Medicaments NVARCHAR(MAX) NULL,
        ICD10 NVARCHAR(255) NULL,
        SourceSheet NVARCHAR(100) NULL
      );
    END
  `);
}

async function insertIcdRows(rows) {
  let inserted = 0;
  for (const row of rows) {
    await query(
      `INSERT INTO dbo.ICD10 (Category, Care, ICDCode, SourceSheet)
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM dbo.ICD10
         WHERE Category = ? AND Care = ? AND ICDCode = ?
       )`,
      [
        row.Category,
        row.Care,
        row.ICDCode,
        row.SourceSheet,
        row.Category,
        row.Care,
        row.ICDCode,
      ],
    );
    inserted += 1;
  }
  return inserted;
}

async function insertDiseaseRows(rows) {
  let inserted = 0;
  for (const row of rows) {
    await query(
      `INSERT INTO dbo.MaladieChronique (Maladie, Medicaments, ICD10, SourceSheet)
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM dbo.MaladieChronique
         WHERE Maladie = ? AND Medicaments = ? AND ICD10 = ?
       )`,
      [
        row.Maladie,
        row.Medicaments,
        row.ICD10,
        row.SourceSheet,
        row.Maladie,
        row.Medicaments,
        row.ICD10,
      ],
    );
    inserted += 1;
  }
  return inserted;
}

async function main() {
  console.log("Using input file:", inputFile);
  const entries = readWorkbook(inputFile);
  if (!entries.length) {
    console.error("Aucune ligne trouvée dans le fichier Excel.");
    process.exit(1);
  }

  await ensureTables();

  const icdEntries = entries
    .map(buildIcdRow)
    .filter(Boolean)
    .filter((row) => row.ICDCode || row.Category || row.Care);

  const diseaseEntries = entries
    .filter((entry) => entry.sheetName === "Maladie Chronique")
    .map(buildDiseaseRow)
    .filter(Boolean)
    .filter((row) => row.Maladie || row.Medicaments || row.ICD10);

  console.log(
    `Found ${icdEntries.length} ICD/general-care rows and ${diseaseEntries.length} disease rows.`,
  );

  const icdInserted = await insertIcdRows(icdEntries);
  const diseaseInserted = await insertDiseaseRows(diseaseEntries);

  console.log(`Inserted ${icdInserted} rows into dbo.ICD10.`);
  console.log(`Inserted ${diseaseInserted} rows into dbo.MaladieChronique.`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
