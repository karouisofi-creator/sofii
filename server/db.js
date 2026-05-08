import odbc from "odbc";

const connectionString =
  "DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MyInstance;DATABASE=DataFlow;Trusted_Connection=yes;";

export async function getPool() {
  return await odbc.connect(connectionString);
}

const serializeValue = (value) => {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, serializeValue(entryValue)]),
    );
  }
  return value;
};

export async function query(sqlQuery, params = {}) {
  const conn = await odbc.connect(connectionString);

  try {
    let finalQuery = sqlQuery;
    const values = [];

    for (const [key, value] of Object.entries(params)) {
      finalQuery = finalQuery.replace(new RegExp("@" + key, "g"), "?");
      values.push(value);
    }

    const result = await conn.query(finalQuery, values);
    return { recordset: serializeValue(result) };
  } finally {
    await conn.close();
  }
}
