import express from "express";
import { query } from "../db.js";
const router = express.Router();
const PY_API_BASE = process.env.PY_API_BASE || "http://127.0.0.1:5001";
const claimColumnCache = new Map();

// Helpers
const safeRecordset = (result) =>
  result && result.recordset ? result.recordset : [];

// Helper: run a query and return recordset or fallback on error
async function tryQuerySafe(sqlQuery, params = {}, fallback = []) {
  try {
    const result = await query(sqlQuery, params);
    return safeRecordset(result);
  } catch (err) {
    console.error(
      "[data] query failed:",
      sqlQuery,
      err && err.message ? err.message : err,
    );
    return fallback;
  }
}

function normalizeMultiValue(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildClaimFilters(args) {
  const clauses = [];
  const params = {};

  const centre = args.centre;
  const centres = args.centres;
  const dateDebut = args.date_debut || args.dateDebut;
  const dateFin = args.date_fin || args.dateFin;
  const marque = args.marque;
  const nomAssureur = args.nom_assureur || args.nomAssureur;
  const team = args.team;
  const agent = args.agent || args.nameAgent;

  if (centre) {
    clauses.push("c.site_gestion_theo = @centre");
    params.centre = centre;
  } else {
    const centreList = normalizeMultiValue(centres);
    if (centreList.length > 0) {
      const centreParams = centreList.map((value, index) => {
        const key = `centre${index}`;
        params[key] = value;
        return `@${key}`;
      });
      clauses.push(`c.site_gestion_theo IN (${centreParams.join(", ")})`);
    }
  }

  if (dateDebut) {
    clauses.push("CAST(c.date_survenance AS DATE) >= CAST(@dateDebut AS DATE)");
    params.dateDebut = dateDebut;
  }
  if (dateFin) {
    clauses.push("CAST(c.date_survenance AS DATE) <= CAST(@dateFin AS DATE)");
    params.dateFin = dateFin;
  }
  if (marque) {
    clauses.push("c.marque = @marque");
    params.marque = marque;
  }
  if (nomAssureur) {
    clauses.push("c.nom_assureur = @nomAssureur");
    params.nomAssureur = nomAssureur;
  }
  if (team) {
    clauses.push("c.site_gestion_theo = @team");
    params.team = team;
  }
  if (agent) {
    clauses.push("c.utilisateur = @agent");
    params.agent = agent;
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

async function hasColumn(tableName, columnName) {
  const cacheKey = `${tableName}.${columnName}`;
  if (claimColumnCache.has(cacheKey)) {
    return claimColumnCache.get(cacheKey);
  }

  try {
    const result = await query(
      `SELECT 1 AS found
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'dbo'
         AND TABLE_NAME = @tableName
         AND COLUMN_NAME = @columnName`,
      { tableName, columnName },
    );
    const exists = safeRecordset(result).length > 0;
    claimColumnCache.set(cacheKey, exists);
    return exists;
  } catch (err) {
    console.warn(
      "[data] column lookup failed:",
      tableName,
      columnName,
      err && err.message ? err.message : err,
    );
    claimColumnCache.set(cacheKey, false);
    return false;
  }
}

async function getRejectionReasonExpression() {
  if (await hasColumn("claims_closed", "rejection_reason")) {
    return "NULLIF(LTRIM(RTRIM(c.rejection_reason)), '')";
  }

  return "CASE WHEN UPPER(ISNULL(c.code_etat, '')) IN ('REJETE', 'RJ', 'REJECTED') THEN 'Rejeté' ELSE NULL END";
}

async function getCenterAggRows(req, options = {}) {
  const { whereSql, params } = buildClaimFilters(req.query);
  const centreSql = options.centreSql || "ISNULL(c.site_gestion_theo, 'N/A')";
  const countAlias = options.countAlias || "value";

  const result = await query(
    `
    SELECT TOP 50
      ${centreSql} AS centre,
      COUNT(DISTINCT c.id_sinistre) AS ${countAlias},
      SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= ${options.slaDays || 0} THEN 1 ELSE 0 END) AS sla_count,
      AVG(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL THEN DATEDIFF(DAY, c.date_survenance, c.date_cloture) * 1.0 END) AS average_tat,
      COUNT(l.id_ligne) AS line_count
    FROM dbo.claims_closed c
    LEFT JOIN dbo.claims_closed_lines l
      ON l.id_sinistre = c.id_sinistre AND l.num_sinistre = c.num_sinistre
    ${whereSql}
    GROUP BY ${centreSql}
    ORDER BY ${countAlias} DESC, centre ASC
    `,
    params,
  );

  return safeRecordset(result);
}

async function proxyToPython(req, res) {
  try {
    const fetchImpl = globalThis.fetch || (await import("node-fetch")).default;
    const upstreamUrl = `${PY_API_BASE}${req.originalUrl}`;

    // Add a 3-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const upstreamRes = await fetchImpl(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      throw new Error(`Upstream ${upstreamRes.status}`);
    }

    const payload = await upstreamRes.json();
    res.json(payload);
    return true;
  } catch (err) {
    console.warn(
      "[data] python proxy unavailable, fallback to Node SQL route:",
      err && err.message ? err.message : err,
    );
    return false;
  }
}

// Filters for dashboard (marques, assureurs, centres)
router.get("/filters", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  // Attempt to fetch filters; if DB unavailable return empty lists so frontend can work
  const [marquesR, assureursR, centresR] = await Promise.all([
    tryQuerySafe(
      "SELECT DISTINCT ISNULL(LTRIM(RTRIM(marque)),'') AS marque FROM dbo.claims_closed WHERE marque IS NOT NULL ORDER BY marque",
    ),
    tryQuerySafe(
      "SELECT DISTINCT ISNULL(LTRIM(RTRIM(nom_assureur)),'') AS nom_assureur FROM dbo.claims_closed WHERE nom_assureur IS NOT NULL ORDER BY nom_assureur",
    ),
    tryQuerySafe(
      "SELECT DISTINCT ISNULL(LTRIM(RTRIM(site_gestion_theo)),'') AS centre FROM dbo.claims_closed WHERE site_gestion_theo IS NOT NULL ORDER BY site_gestion_theo",
    ),
  ]);
  res.json({
    marques: (marquesR || []).map((r) => r.marque).filter(Boolean),
    assureurs: (assureursR || []).map((r) => r.nom_assureur).filter(Boolean),
    centres: (centresR || []).map((r) => r.centre).filter(Boolean),
  });
});

// Dashboard summary
router.get("/dashboard", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  // Try to query DB for KPI; if DB unavailable return default empty KPI payload
  try {
    const totalTerminesR = await tryQuerySafe(
      "SELECT COUNT(*) AS termines FROM dbo.sinistres_termines_ligne",
      {},
      [{ termines: 0 }],
    );
    const totalNonTeR = await tryQuerySafe(
      "SELECT COUNT(*) AS non_te FROM dbo.sinistre_Ter_Lignes_NO_TE",
      {},
      [{ non_te: 0 }],
    );

    const termines =
      (totalTerminesR && totalTerminesR[0] && totalTerminesR[0].termines) || 0;
    const enCours =
      (totalNonTeR && totalNonTeR[0] && totalNonTeR[0].non_te) || 0;
    const total = termines + enCours;

    res.json({
      sinistres: {
        total,
        termines,
        en_cours: enCours,
      },
      parCentre: [],
    });
  } catch (err) {
    console.error("[data] unexpected dashboard error", err);
    // Fallback safe response
    res.json({
      sinistres: { total: 0, termines: 0, en_cours: 0 },
      parCentre: [],
    });
  }
});

// Teams (derive from utilisateur grouped by centre)
router.get("/teams", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const { whereSql, params } = buildClaimFilters(req.query);
    const result = await query(
      `
      SELECT
        ISNULL(c.site_gestion_theo, 'N/A') AS team,
        ISNULL(c.utilisateur, 'N/A') AS agent,
        ISNULL(c.site_gestion_theo, 'N/A') AS centre,
        CAST(AVG(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 100.0 ELSE 0.0 END) AS DECIMAL(10,2)) AS provider_claim_20days,
        SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 1 ELSE 0 END) AS nb_claim_treated_20d,
        SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 30 THEN 1 ELSE 0 END) AS nb_claim_treated_30d,
        COUNT(DISTINCT c.id_sinistre) AS nb_claims_treated,
        COUNT(l.id_ligne) AS nb_ligne_claims_treated,
        COUNT(DISTINCT CASE WHEN l.id_ligne IS NOT NULL THEN c.id_sinistre END) AS nb_claims_ss,
        COUNT(l.id_ligne) AS nb_ligne_claims_ss
      FROM dbo.claims_closed c
      LEFT JOIN dbo.claims_closed_lines l
        ON l.id_sinistre = c.id_sinistre AND l.num_sinistre = c.num_sinistre
      ${whereSql}
      GROUP BY c.site_gestion_theo, c.utilisateur
      ORDER BY nb_claims_treated DESC, team ASC, agent ASC
      `,
      params,
    );
    res.json(safeRecordset(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// Recent claims
router.get("/sinistres", async (req, res) => {
  // Skip proxy for now - directly use SQL
  // if (await proxyToPython(req, res)) return;

  try {
    const limit = Number(req.query.limit) || 200;
    const result = await query(
      `SELECT TOP(${limit}) * FROM dbo.sinistre_Ter_Lignes_NO_TE ORDER BY ID_Sinistre DESC`,
    );
    const rows = safeRecordset(result);
    console.log(
      `[/sinistres] Returned ${rows.length} rows (non-terminated lines)`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// Sinistres termines
router.get("/sinistres-termines", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const limit = Number(req.query.limit) || 200;
    const result = await query(
      `SELECT TOP(${limit}) * FROM dbo.sinistres_termines_ligne ORDER BY ID_Sinistre DESC`,
    );
    const rows = safeRecordset(result);
    console.log(
      `[/sinistres-termines] Returned ${rows.length} rows (terminated lines)`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// Monthly trends
router.get("/monthly-trends", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const result = await query(`
      SELECT DATENAME(MONTH, date_cloture) AS mois, COUNT(*) AS sinistres
      FROM dbo.claims_closed
      WHERE date_cloture IS NOT NULL
      GROUP BY DATENAME(MONTH, date_cloture), DATEPART(MONTH, date_cloture)
      ORDER BY DATEPART(MONTH, MIN(date_cloture))
    `);
    res.json(safeRecordset(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

router.get("/top-ec-reasons", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const { whereSql, params } = buildClaimFilters(req.query);
    const result = await query(
      `
      SELECT TOP 10
        COALESCE(NULLIF(LTRIM(RTRIM(c.EC_REASON)), ''), 'Autre') AS name,
        COUNT(*) AS value
      FROM dbo.claims_closed c
      ${whereSql}
      GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(c.EC_REASON)), ''), 'Autre')
      ORDER BY value DESC, name ASC
      `,
      params,
    );
    res.json(safeRecordset(result));
  } catch (err) {
    console.error("[data] top-ec-reasons error", err);
    res.json([]);
  }
});

router.get("/adjustment-reasons", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const { whereSql, params } = buildClaimFilters(req.query);
    const result = await query(
      `
      SELECT TOP 10
        COALESCE(NULLIF(LTRIM(RTRIM(c.ADJUSTMENT_REASON)), ''), 'Autre') AS name,
        COUNT(*) AS value
      FROM dbo.claims_closed c
      ${whereSql}
      GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(c.ADJUSTMENT_REASON)), ''), 'Autre')
      ORDER BY value DESC, name ASC
      `,
      params,
    );
    res.json(safeRecordset(result));
  } catch (err) {
    console.error("[data] adjustment-reasons error", err);
    res.json([]);
  }
});

router.get("/top-rejection-reasons", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const { whereSql, params } = buildClaimFilters(req.query);
    const rejectionExpression = await getRejectionReasonExpression();
    const result = await query(
      `
      SELECT TOP 10
        COALESCE(${rejectionExpression}, 'Autre') AS name,
        COUNT(*) AS value
      FROM dbo.claims_closed c
      ${whereSql}
      GROUP BY COALESCE(${rejectionExpression}, 'Autre')
      ORDER BY value DESC, name ASC
      `,
      params,
    );
    res.json(safeRecordset(result));
  } catch (err) {
    console.error("[data] top-rejection-reasons error", err);
    res.json([]);
  }
});

router.get("/insured-claims-center", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const { whereSql, params } = buildClaimFilters(req.query);
    const result = await query(
      `
      SELECT
        ISNULL(c.site_gestion_theo, 'N/A') AS centre,
        COUNT(DISTINCT c.id_sinistre) AS nb_insured_claims_treated,
        SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 5 THEN 1 ELSE 0 END) AS nb_insured_claims_treated_5d,
        AVG(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL THEN DATEDIFF(DAY, c.date_survenance, c.date_cloture) * 1.0 END) AS tat_5_days,
        CAST(5 AS DECIMAL(10,2)) AS target_5days,
        CAST(5.5 AS DECIMAL(10,2)) AS tolerance_5days
      FROM dbo.claims_closed c
      ${whereSql}
      GROUP BY ISNULL(c.site_gestion_theo, 'N/A')
      ORDER BY nb_insured_claims_treated DESC, centre ASC
      `,
      params,
    );
    res.json(safeRecordset(result));
  } catch (err) {
    console.error("[data] insured-claims-center error", err);
    res.json([]);
  }
});

router.get("/provider-claims-center", async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const { whereSql, params } = buildClaimFilters(req.query);
    const result = await query(
      `
      SELECT
        ISNULL(c.site_gestion_theo, 'N/A') AS centre,
        CAST(AVG(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 100.0 ELSE 0.0 END) AS DECIMAL(10,2)) AS provider_claim_20days,
        SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 1 ELSE 0 END) AS nb_claim_treated_20d,
        SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 30 THEN 1 ELSE 0 END) AS nb_claim_treated_30d,
        COUNT(DISTINCT c.id_sinistre) AS nb_claims_treated,
        COUNT(l.id_ligne) AS nb_ligne_claims_treated,
        COUNT(DISTINCT CASE WHEN l.id_ligne IS NOT NULL THEN c.id_sinistre END) AS nb_claims_ss,
        COUNT(l.id_ligne) AS nb_ligne_claims_ss
      FROM dbo.claims_closed c
      LEFT JOIN dbo.claims_closed_lines l
        ON l.id_sinistre = c.id_sinistre AND l.num_sinistre = c.num_sinistre
      ${whereSql}
      GROUP BY ISNULL(c.site_gestion_theo, 'N/A')
      ORDER BY nb_claims_treated DESC, centre ASC
      `,
      params,
    );
    res.json(safeRecordset(result));
  } catch (err) {
    console.error("[data] provider-claims-center error", err);
    res.json([]);
  }
});

export default router;
