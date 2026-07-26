const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function main() {
  const p = path.resolve(__dirname, "..", "server", "data", "knowledge.json");
  if (!fs.existsSync(p)) {
    console.error("knowledge.json not found", p);
    process.exit(1);
  }
  const body = fs.readFileSync(p, "utf8");
  const url = "http://127.0.0.1:5001/api/chat/knowledge-base";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  console.log("status", res.status);
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
