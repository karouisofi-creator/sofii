import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";
import { query } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFile =
  process.argv[2] || path.join(__dirname, "..", "data", "knowledge.csv");

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value) {
  return normalize(value).replace(/\s+/g, " ");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  values.push(current);
  return values.map((value) => value.trim());
}

function readCsv(file) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function readXlsx(file) {
  const workbook = xlsx.readFile(file);
  const rows = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    sheetRows.forEach((row) => rows.push(row));
  });
  return rows;
}

function readJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
  return [];
}

function readInput(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".csv") return readCsv(file);
  if (ext === ".xlsx" || ext === ".xls") return readXlsx(file);
  if (ext === ".json") return readJson(file);
  throw new Error(`Format de fichier non pris en charge: ${ext}`);
}

function splitMedicines(value) {
  return normalize(value)
    .split(/[,;]+/)
    .map((item) => normalize(item))
    .filter(Boolean);
}

function mapRow(row) {
  const data = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim(), normalize(v)]),
  );

  const name =
    data.Name ||
    data.Nom ||
    data.Médicament ||
    data.Medicament ||
    data["Drug Name"] ||
    data["Nom médicament"] ||
    "";
  const generic =
    data.GenericName ||
    data.Generic ||
    data.PrincipeActif ||
    data.PrincipActif ||
    data["Princip actif"] ||
    "";
  const indications =
    data.Indications || data["Indication"] || data["ICD-10"] || "";
  const sideEffects =
    data.SideEffects || data.EffetsSecondaires || data.Effets || "";
  const contraindications =
    data.Contraindications ||
    data.ContreIndications ||
    data["Contre-indications"] ||
    "";
  const dosage = data.Dosage || data.Posologie || "";
  const route = data.Route || "";
  const references =
    data.References || data["Reference"] || data["Références"] || "";
  const notes = data.Notes || "";

  if (name || generic) {
    return [
      {
        Name: name || generic,
        GenericName: generic || "",
        Indications: indications,
        SideEffects: sideEffects,
        Contraindications: contraindications,
        Dosage: dosage,
        Route: route,
        References: references,
        Notes: notes,
      },
    ];
  }

  const maladie =
    data["Maladie chronique"] || data["Maladie"] || data["Disease"] || "";
  const medicaments =
    data["Exemples de médicaments (courants)"] || data["Médicaments"] || "";
  const icd = data["ICD-10"] || data["ICD à utiliser"] || "";

  if (maladie && medicaments) {
    return splitMedicines(medicaments).map((med) => ({
      Name: med,
      GenericName: "",
      Indications: maladie + (icd ? ` | ICD: ${icd}` : ""),
      SideEffects: "",
      Contraindications: "",
      Dosage: "",
      Route: "",
      References: "Imported from chronic disease list",
      Notes: `Source: ${data.Sheet || "Maladie Chronique"}`,
    }));
  }

  return [];
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
        ContreIndications NVARCHAR(MAX) NULL,
        Route NVARCHAR(200) NULL,
        ReferencesText NVARCHAR(MAX) NULL,
        Notes NVARCHAR(MAX) NULL
      );
    END

    IF OBJECT_ID('dbo.Medicaments', 'U') IS NOT NULL AND COL_LENGTH('dbo.Medicaments', 'Route') IS NULL
    BEGIN
      ALTER TABLE dbo.Medicaments ADD Route NVARCHAR(200) NULL;
    END
    IF OBJECT_ID('dbo.Medicaments', 'U') IS NOT NULL AND COL_LENGTH('dbo.Medicaments', 'ReferencesText') IS NULL
    BEGIN
      ALTER TABLE dbo.Medicaments ADD ReferencesText NVARCHAR(MAX) NULL;
    END
    IF OBJECT_ID('dbo.Medicaments', 'U') IS NOT NULL AND COL_LENGTH('dbo.Medicaments', 'Notes') IS NULL
    BEGIN
      ALTER TABLE dbo.Medicaments ADD Notes NVARCHAR(MAX) NULL;
    END
  `);
}

async function upsertRow(row) {
  const params = {
    Name: row.Name,
    GenericName: row.GenericName,
    Indications: row.Indications,
    SideEffects: row.SideEffects,
    Contraindications: row.Contraindications,
    Dosage: row.Dosage,
    Route: row.Route,
    References: row.References,
    Notes: row.Notes,
  };

  await query(
    `IF EXISTS (
      SELECT 1 FROM dbo.Medicaments
      WHERE Nom = @Name AND PrincipeActif = @GenericName
    )
    BEGIN
      UPDATE dbo.Medicaments
      SET Indications = @Indications,
          Posologie = @Dosage,
          EffetsSecondaires = @SideEffects,
          ContreIndications = @Contraindications,
          Route = @Route,
          ReferencesText = @References,
          Notes = @Notes
      WHERE Nom = @Name AND PrincipeActif = @GenericName;
    END
    ELSE
    BEGIN
      INSERT INTO dbo.Medicaments
        (Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications, Route, ReferencesText, Notes)
      VALUES
        (@Name, @GenericName, @Indications, @Dosage, @SideEffects, @Contraindications, @Route, @References, @Notes);
    END`,
    params,
  );
}

async function main() {
  const absoluteInput = path.isAbsolute(inputFile)
    ? inputFile
    : path.join(process.cwd(), inputFile);

  if (!fs.existsSync(absoluteInput)) {
    console.error(`Fichier introuvable: ${absoluteInput}`);
    process.exit(1);
  }

  const rows = readInput(absoluteInput).map(mapRow).flat().filter(Boolean);

  if (!rows.length) {
    console.error("Aucune ligne de médicament valide trouvée dans le fichier.");
    process.exit(1);
  }

  await ensureMedicamentsTable();

  const unique = new Map();
  rows.forEach((row) => {
    const key = `${normalizeText(row.Name).toLowerCase()}|${normalizeText(
      row.GenericName,
    ).toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, row);
  });

  const values = Array.from(unique.values());
  console.log(
    `Importing ${values.length} medication rows into dbo.Medicaments...`,
  );

  let inserted = 0;
  for (const row of values) {
    await upsertRow(row);
    inserted += 1;
  }

  console.log(`Loaded ${inserted} medication rows into dbo.Medicaments.`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
