import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const file = path.join(process.cwd(), "sof.xlsx");
if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}
const wb = xlsx.readFile(file);
console.log("sheets", wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
  console.log("sheet", name, "rows", rows.length);
  if (rows.length) console.log("first row", JSON.stringify(rows[0]));
  console.log("---");
}
