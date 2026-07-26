import fs from "fs";
import path from "path";
import csvParse from "csv-parse/lib/sync";

// Usage: node generate-aliases.js merged.csv ../routes/med_aliases.json
// Example: node generate-aliases.js ../data/knowledge_vidal_merged.csv ../routes/med_aliases.json

const input =
  process.argv[2] ||
  path.join(process.cwd(), "..", "data", "knowledge_vidal_merged.csv");
const output =
  process.argv[3] ||
  path.join(process.cwd(), "..", "routes", "med_aliases.json");

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

if (!fs.existsSync(input)) {
  console.error("Input not found:", input);
  process.exit(1);
}

const raw = fs.readFileSync(input, "utf8");
const rows = csvParse(raw, { columns: true, skip_empty_lines: true });

const aliases = {};
rows.forEach((r) => {
  const name = r.Name || r.name || r.Nom || "";
  const generic = r.GenericName || r.genericName || r.Generic || "";
  const keys = [name, generic].filter(Boolean);
  keys.forEach((k) => {
    const base = norm(k);
    if (!base) return;
    // generate simple variants
    const variant1 = base.replace(/\s+/g, "");
    const variant2 = base.replace(/\s+/g, "-");
    const variant3 = base.split(" ")[0];
    [base, variant1, variant2, variant3].forEach((v) => {
      if (!v) return;
      aliases[v] = generic ? norm(generic) : norm(name);
    });
  });
});

fs.writeFileSync(output, JSON.stringify(aliases, null, 2), "utf8");
console.log("Wrote aliases to", output, "count=", Object.keys(aliases).length);
