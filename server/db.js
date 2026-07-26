import odbc from "odbc";

// Try multiple server instances
const servers = [
  "(localdb)\\MyInstance",
  "(localdb)\\MSSQLLocalDB",
  "localhost\\SQLEXPRESS",
  ".\\SQLEXPRESS",
  "127.0.0.1\\SQLEXPRESS",
  "localhost",
  ".",
];

let validConnection = null;

async function findValidConnection() {
  for (const server of servers) {
    try {
      const testConnStr = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=${server};DATABASE=DataFlow;Trusted_Connection=yes;`;
      const testConn = await odbc.connect(testConnStr);
      await testConn.close();
      console.log(`✓ Successfully connected to ${server}`);
      return testConnStr;
    } catch (err) {
      console.log(`✗ Failed to connect to ${server}: ${err.message}`);
    }
  }
  // Fallback to the first one if all fail
  const connectionString = `DRIVER={ODBC Driver 17 for SQL Server};SERVER=${servers[0]};DATABASE=DataFlow;Trusted_Connection=yes;`;
  console.warn(
    `⚠ Could not validate connection, using fallback: ${servers[0]}`,
  );
  return connectionString;
}

let connectionString = null;

function fixSqlStringEncoding(value) {
  if (typeof value !== "string") return value;
  const decoded = Buffer.from(value, "latin1").toString("utf8");
  return decoded.includes("�") ? value : decoded;
}

function normalizeSqlResultRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        fixSqlStringEncoding(value),
      ]),
    );
  });
}

async function initializeConnection() {
  if (!connectionString) {
    connectionString = await findValidConnection();
  }
  return connectionString;
}

export async function getPool() {
  const connStr = await initializeConnection();
  return await odbc.connect(connStr);
}

export async function query(sqlQuery, params = {}) {
  const connStr = await initializeConnection();
  const conn = await odbc.connect(connStr);
  try {
    let finalQuery = sqlQuery;
    let values = [];

    if (Array.isArray(params)) {
      values = params;
    } else {
      const boundValues = [];
      finalQuery = sqlQuery.replace(/@([A-Za-z0-9_]+)/g, (_, key) => {
        boundValues.push(params[key]);
        return "?";
      });
      values = boundValues;
    }

    const result = values.length
      ? await conn.query(finalQuery, values)
      : await conn.query(finalQuery);

    return { recordset: normalizeSqlResultRows(result) };
  } finally {
    await conn.close();
  }
}
