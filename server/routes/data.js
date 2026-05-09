import express from 'express';
import { query } from '../db.js';
const router = express.Router();
const PY_API_BASE = process.env.PY_API_BASE || 'http://127.0.0.1:5001';

// Helpers
const safeRecordset = (result) => (result && result.recordset) ? result.recordset : [];

// Helper: run a query and return recordset or fallback on error
async function tryQuerySafe(sqlQuery, params = {}, fallback = []) {
  try {
    const result = await query(sqlQuery, params);
    return safeRecordset(result);
  } catch (err) {
    console.error('[data] query failed:', sqlQuery, err && err.message ? err.message : err);
    return fallback;
  }
}

async function proxyToPython(req, res) {
  try {
    const fetchImpl = globalThis.fetch || (await import('node-fetch')).default;
    const upstreamUrl = `${PY_API_BASE}${req.originalUrl}`;
    const upstreamRes = await fetchImpl(upstreamUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream ${upstreamRes.status}`);
    }

    const payload = await upstreamRes.json();
    res.json(payload);
    return true;
  } catch (err) {
    console.warn('[data] python proxy unavailable, fallback to Node SQL route:', err && err.message ? err.message : err);
    return false;
  }
}

// Filters for dashboard (marques, assureurs, centres)
router.get('/filters', async (req, res) => {
  if (await proxyToPython(req, res)) return;

  // Attempt to fetch filters; if DB unavailable return empty lists so frontend can work
  const [marquesR, assureursR, centresR] = await Promise.all([
    tryQuerySafe("SELECT DISTINCT ISNULL(LTRIM(RTRIM(marque)),'') AS marque FROM dbo.claims_closed WHERE marque IS NOT NULL ORDER BY marque"),
    tryQuerySafe("SELECT DISTINCT ISNULL(LTRIM(RTRIM(nom_assureur)),'') AS nom_assureur FROM dbo.claims_closed WHERE nom_assureur IS NOT NULL ORDER BY nom_assureur"),
    tryQuerySafe("SELECT DISTINCT ISNULL(LTRIM(RTRIM(site_gestion_theo)),'') AS centre FROM dbo.claims_closed WHERE site_gestion_theo IS NOT NULL ORDER BY site_gestion_theo"),
  ]);
  res.json({
    marques: (marquesR || []).map(r => r.marque).filter(Boolean),
    assureurs: (assureursR || []).map(r => r.nom_assureur).filter(Boolean),
    centres: (centresR || []).map(r => r.centre).filter(Boolean),
  });
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  if (await proxyToPython(req, res)) return;

  // Try to query DB for KPI; if DB unavailable return default empty KPI payload
  try {
    const totalR = await tryQuerySafe('SELECT COUNT(*) AS total FROM dbo.claims_closed', {}, [{ total: 0 }]);
    const terminesR = await tryQuerySafe("SELECT COUNT(*) AS termines FROM dbo.claims_closed WHERE Code_Etat = 'TE' OR source_file LIKE '%termines%'", {}, [{ termines: 0 }]);
    const byCentreR = await tryQuerySafe("SELECT ISNULL(site_gestion_theo, 'UNKNOWN') AS centre, COUNT(*) AS total FROM dbo.claims_closed GROUP BY ISNULL(site_gestion_theo, 'UNKNOWN') ORDER BY total DESC", {}, []);

    const total = (totalR && totalR[0] && totalR[0].total) || 0;
    const termines = (terminesR && terminesR[0] && terminesR[0].termines) || 0;

    res.json({
      sinistres: {
        total,
        termines,
        en_cours: Math.max(0, total - termines),
      },
      parCentre: byCentreR || [],
    });
  } catch (err) {
    console.error('[data] unexpected dashboard error', err);
    // Fallback safe response
    res.json({ sinistres: { total: 0, termines: 0, en_cours: 0 }, parCentre: [] });
  }
});

// Teams (derive from utilisateur grouped by centre)
router.get('/teams', async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const centre = req.query.centre;
    const where = centre ? "WHERE site_gestion_theo = @centre" : '';
    const sql = `SELECT TOP 100 utilisateur AS agent, ISNULL(site_gestion_theo,'') AS centre, COUNT(*) AS nb FROM dbo.claims_closed ${where} GROUP BY utilisateur, ISNULL(site_gestion_theo,'') ORDER BY nb DESC`;
    const params = centre ? { centre } : {};
    const result = await query(sql, params);
    res.json(safeRecordset(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Recent claims
router.get('/sinistres', async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const limit = Number(req.query.limit) || 200;
    const result = await query(`SELECT TOP(${limit}) * FROM dbo.claims_closed ORDER BY date_cloture DESC`);
    res.json(safeRecordset(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Sinistres termines
router.get('/sinistres-termines', async (req, res) => {
  if (await proxyToPython(req, res)) return;

  try {
    const limit = Number(req.query.limit) || 200;
    const result = await query(`SELECT TOP(${limit}) * FROM dbo.claims_closed WHERE Code_Etat = 'TE' OR source_file LIKE '%termines%' ORDER BY date_cloture DESC`);
    res.json(safeRecordset(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Monthly trends
router.get('/monthly-trends', async (req, res) => {
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
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
