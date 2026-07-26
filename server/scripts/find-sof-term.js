import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const term = process.argv[2] || "gyn";
const file = path.join(process.cwd(), "sof.xlsx");
if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}
const wb = xlsx.readFile(file);
console.log("Searching for term:", term);
for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
  rows.forEach((row, idx) => {
    const joined = Object.values(row).join(" ").toLowerCase();
    if (joined.includes(term.toLowerCase())) {
      console.log(
        `sheet=${sheetName} row=${idx + 2} data=${JSON.stringify(row)}`,
      );
    }
  });
}
