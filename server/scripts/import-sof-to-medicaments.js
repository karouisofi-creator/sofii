import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";
import { query } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFile =
  process.argv[2] || path.join(__dirname, "..", "server", "sof.xlsx");

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeRow(row, sheetName, rowIndex) {
  const mapped = {};
  Object.entries(row).forEach(([k, v]) => {
    mapped[String(k || "").trim()] = normalize(v);
  });

  const nom =
    mapped["Maladie chronique"] ||
    mapped["Soin / Acte"] ||
    mapped["Soins"] ||
    mapped["Spécialité"] ||
    mapped["Catégorie"] ||
    mapped["Nom"] ||
    `${sheetName} ligne ${rowIndex + 1}`;

  const principeActif =
    mapped["Exemples de médicaments (courants)"] ||
    mapped["ICD à utiliser"] ||
    mapped["PrincipeActif"] ||
    "";

  const indications =
    mapped["Indications"] || mapped["ICD-10"] || mapped["ICD à utiliser"] || "";

  const remaining = Object.entries(mapped)
    .filter(
      ([key, value]) =>
        value &&
        ![
          "Maladie chronique",
          "Soin / Acte",
          "Soins",
          "Spécialité",
          "Catégorie",
          "Nom",
          "Exemples de médicaments (courants)",
          "ICD à utiliser",
          "PrincipeActif",
          "Indications",
          "ICD-10",
        ].includes(key),
    )
    .map(([key, value]) => `${key}: ${value}`);

  const contreIndications =
    `Source sheet: ${sheetName}` +
    (remaining.length ? ` | ${remaining.join(" | ")}` : "");

  return {
    Nom: nom,
    PrincipeActif: principeActif,
    Indications: indications,
    Posologie: "",
    EffetsSecondaires: "",
    ContreIndications: contreIndications,
  };
}

function readWorkbook(file) {
  const workbook = xlsx.readFile(file);
  const rows = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    sheetRows.forEach((row, index) => {
      rows.push(normalizeRow(row, sheetName, index));
    });
  });
  return rows;
}

async function ensureMedicamentsTable() {
  await query(`
    IF OBJECT_ID('dbo.Medicaments', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Medicaments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nom NVARCHAR(200) NULL,
        PrincipeActif NVARCHAR(200) NULL,
        Indications NVARCHAR(MAX) NULL,
        Posologie NVARCHAR(MAX) NULL,
        EffetsSecondaires NVARCHAR(MAX) NULL,
        ContreIndications NVARCHAR(MAX) NULL
      );
    END
  `);
}

async function main() {
  console.log("Using input file:", inputFile);
  const rows = readWorkbook(inputFile);
  if (!rows.length) {
    console.error("Aucune ligne trouvée dans le fichier Excel.");
    process.exit(1);
  }

  await ensureMedicamentsTable();

  const uniqueRows = [];
  const seen = new Set();
  rows.forEach((row) => {
    const key = `${row.Nom}||${row.PrincipeActif}||${row.Indications}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(row);
    }
  });

  console.log(
    `Importing ${uniqueRows.length} unique rows into dbo.Medicaments...`,
  );

  let inserted = 0;
  for (const row of uniqueRows) {
    await query(
      `INSERT INTO dbo.Medicaments (Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications)
       VALUES (@Nom, @PrincipeActif, @Indications, @Posologie, @EffetsSecondaires, @ContreIndications)`,
      row,
    );
    inserted += 1;
  }

  console.log(`Inserted ${inserted} rows into dbo.Medicaments.`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
