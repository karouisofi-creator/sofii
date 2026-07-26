import axios from "axios";
import http from "http";
import https from "https";

async function main() {
  const data = { message: "Gynécologie" };
  const url = "http://localhost:3000/api/chat/public-test";
  try {
    const response = await axios.post(url, data, {
      responseType: "arraybuffer",
      transformResponse: [(data) => data],
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    });
    console.log("status", response.status);
    console.log("content-type", response.headers["content-type"]);
    const buf = Buffer.from(response.data);
    console.log("body hex", buf.toString("hex").slice(0, 200));
    const text = buf.toString("utf8");
    console.log("body utf8:", text.slice(0, 300));
    try {
      const parsed = JSON.parse(text);
      console.log("parsed reply:", parsed.reply);
      console.log("parsed first raw:", parsed.refs?.[0]?.data?.Nom);
    } catch (e) {
      console.error("json parse failed", e);
    }
  } catch (err) {
    console.error("request failed", err.message);
  }
}

main();
