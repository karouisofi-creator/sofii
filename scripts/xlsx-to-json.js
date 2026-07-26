const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

function main() {
  const src = path.resolve(__dirname, "..", "server", "sof.xlsx");
  const outDir = path.resolve(__dirname, "..", "server", "data");
  if (!fs.existsSync(src)) {
    console.error("Source xlsx not found:", src);
    process.exit(1);
  }
  const wb = XLSX.readFile(src, { cellDates: true });
  // merge sheets into rows array
  let allRows = [];
  let columnsSet = new Set();
  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    rows.forEach((r) => {
      // annotate sheet
      r.Sheet = sheetName;
      Object.keys(r).forEach((k) => columnsSet.add(k));
      allRows.push(r);
    });
  });
  const out = {
    name: path.basename(src),
    columns: Array.from(columnsSet),
    rows: allRows,
  };
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "knowledge.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", outPath, "rows=", allRows.length);
}

main();
