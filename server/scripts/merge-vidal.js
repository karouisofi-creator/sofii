import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import csvParse from "csv-parse/lib/sync";

// Usage: node merge-vidal.js [inputFolder] [outputCsv]
// Example: node merge-vidal.js ../data/vidal ./data/knowledge_vidal_merged.csv

const inFolder =
  process.argv[2] || path.join(process.cwd(), "..", "data", "vidal");
const outFile =
  process.argv[3] ||
  path.join(process.cwd(), "..", "data", "knowledge_vidal_merged.csv");

function normKey(k) {
  return String(k || "").trim();
}

function ensureColumns(rows, columns) {
  return rows.map((r) => {
    const out = {};
    columns.forEach((c) => {
      out[c] = r[c] ?? r[c.toLowerCase()] ?? r[c.toUpperCase()] ?? "";
    });
    return out;
  });
}

function readCsv(file) {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = csvParse(raw, { columns: true, skip_empty_lines: true });
  return parsed;
}

function readXlsx(file) {
  const wb = xlsx.readFile(file);
  const rows = [];
  wb.SheetNames.forEach((sn) => {
    const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sn], { defval: "" });
    sheet.forEach((r) => rows.push(r));
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

function collectFiles(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => /\.(csv|xlsx|xls|json)$/i.test(f))
    .map((f) => path.join(folder, f));
}

function writeCsv(file, rows, columns) {
  const header = columns.join(",") + "\n";
  const lines = rows
    .map((r) =>
      columns
        .map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  fs.writeFileSync(file, header + lines, "utf8");
}

function merge() {
  console.log("Collecting files from", inFolder);
  const files = collectFiles(inFolder);
  if (!files.length) {
    console.error("No files found in", inFolder);
    process.exit(1);
  }
  let all = [];
  files.forEach((f) => {
    const ext = path.extname(f).toLowerCase();
    console.log("Reading", f);
    try {
      let rows = [];
      if (ext === ".csv") rows = readCsv(f);
      else if (ext === ".json") rows = readJson(f);
      else if (ext === ".xlsx" || ext === ".xls") rows = readXlsx(f);
      else rows = [];
      all = all.concat(rows);
    } catch (e) {
      console.error("Failed to read", f, e.message);
    }
  });

  if (!all.length) {
    console.error("No rows extracted from input files");
    process.exit(1);
  }

  // Determine superset of columns we care about for medications
  const preferred = [
    "Name",
    "GenericName",
    "Indications",
    "SideEffects",
    "Contraindications",
    "Dosage",
    "Route",
    "References",
    "Notes",
  ];

  const foundCols = new Set();
  all.forEach((r) =>
    Object.keys(r || {}).forEach((k) => foundCols.add(normKey(k))),
  );
  const columns = preferred
    .filter((c) => foundCols.has(c))
    .concat([...foundCols].filter((c) => !preferred.includes(c)));

  // Normalize rows to chosen columns and deduplicate by Name/GenericName
  const uniq = new Map();
  all.forEach((r) => {
    const name = String(r.Name || r.name || r.Name || r["Nom"] || "").trim();
    const generic = String(
      r.GenericName || r.genericName || r.Generic || r["Générique"] || "",
    ).trim();
    const key = (name || generic || JSON.stringify(r)).toLowerCase();
    if (!uniq.has(key)) {
      const out = {};
      columns.forEach((c) => {
        out[c] =
          r[c] ?? r[c.toLowerCase()] ?? r[c.toUpperCase()] ?? r[c.trim()] ?? "";
      });
      uniq.set(key, out);
    }
  });

  const merged = Array.from(uniq.values());
  console.log("Merged rows:", merged.length);
  writeCsv(outFile, merged, columns);
  console.log("Written merged CSV to", outFile);
}

merge();
