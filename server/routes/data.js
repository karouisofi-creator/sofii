<<<<<<< HEAD
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
=======
import express from "express";
import { query } from "../db.js";

const router = express.Router();

// ✅ Tous les sinistres en cours
router.get("/sinistres", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM Sinistres ORDER BY date_sinistre DESC",
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Sinistres terminés
router.get("/sinistres-termines", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM Sinistres_Termines ORDER BY date_sinistre DESC",
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Tous les adhérents
router.get("/adherents", async (req, res) => {
  try {
    const result = await query("SELECT * FROM Adherents ORDER BY NOM");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Tous les clients
router.get("/clients", async (req, res) => {
  try {
    const result = await query("SELECT * FROM Clients ORDER BY NOM1");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Valeurs uniques pour les filtres
router.get("/filters", async (req, res) => {
  try {
    const marques = await query(
      "SELECT DISTINCT MARQUE as valeur FROM Sinistres WHERE MARQUE IS NOT NULL UNION SELECT DISTINCT MARQUE FROM Sinistres_Termines WHERE MARQUE IS NOT NULL",
    );
    const assureurs = await query(
      "SELECT DISTINCT Nom_Assureur as valeur FROM Sinistres WHERE Nom_Assureur IS NOT NULL UNION SELECT DISTINCT Nom_Assureur FROM Sinistres_Termines WHERE Nom_Assureur IS NOT NULL",
    );
    const teamsData = await query(
      "SELECT DISTINCT team as valeur FROM ClaimsTeams WHERE team IS NOT NULL",
    );
    const agents = await query(
      "SELECT DISTINCT agent as valeur FROM ClaimsTeams WHERE agent IS NOT NULL",
    );

    res.json({
      marques: marques.recordset.map((r) => r.valeur),
      assureurs: assureurs.recordset.map((r) => r.valeur),
      teams: teamsData.recordset.map((r) => r.valeur),
      agents: agents.recordset.map((r) => r.valeur),
    });
  } catch (err) {
    console.error("ERREUR filters:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Team Performance avec filtres
router.get("/teams", async (req, res) => {
  try {
    const { team, agent, centre } = req.query;

    let where = "1=1";
    if (team && team !== "Tout") where += ` AND team = '${team}'`;
    if (agent && agent !== "Tout") where += ` AND agent = '${agent}'`;
    if (centre && centre !== "Sélectionner tout")
      where += ` AND centre = '${centre}'`;

    const result = await query(`
      SELECT team, agent, centre,
        provider_claim_20days,
        nb_claim_treated_20d,
        nb_claim_treated_30d,
        nb_claims_treated,
        nb_ligne_claims_treated,
        nb_claims_ss,
        nb_ligne_claims_ss
      FROM ClaimsTeams
      WHERE ${where}
      ORDER BY team, agent
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("ERREUR teams:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Dashboard KPIs avec filtres
router.get("/dashboard", async (req, res) => {
  try {
    const { centre, date_debut, date_fin, marque, nom_assureur } = req.query;

    let whereEnCours = "1=1";
    let whereTermines = "1=1";

    if (centre && centre !== "Sélectionner tout") {
      whereEnCours += ` AND centre = '${centre}'`;
      whereTermines += ` AND centre = '${centre}'`;
    }
    if (date_debut) {
      whereEnCours += ` AND date_sinistre >= '${date_debut}'`;
      whereTermines += ` AND date_sinistre >= '${date_debut}'`;
    }
    if (date_fin) {
      whereEnCours += ` AND date_sinistre <= '${date_fin}'`;
      whereTermines += ` AND date_sinistre <= '${date_fin}'`;
    }
    if (marque && marque !== "Tout") {
      whereEnCours += ` AND MARQUE = '${marque}'`;
      whereTermines += ` AND MARQUE = '${marque}'`;
    }
    if (nom_assureur && nom_assureur !== "Tout") {
      whereEnCours += ` AND Nom_Assureur = '${nom_assureur}'`;
      whereTermines += ` AND Nom_Assureur = '${nom_assureur}'`;
    }

    const sinistresEnCours = await query(`
      SELECT COUNT(*) as total, SUM(montant_soumis) as total_soumis
      FROM Sinistres WHERE ${whereEnCours}
    `);

    const sinistresTermines = await query(`
      SELECT COUNT(*) as total, 
        SUM(montant_soumis) as total_soumis,
        SUM(montant_rembourse) as total_rembourse
      FROM Sinistres_Termines WHERE ${whereTermines}
    `);

    const adherents = await query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN statut = 'Actif' THEN 1 ELSE 0 END) as actifs
      FROM Adherents
    `);

    const parCentre = await query(`
      SELECT centre, COUNT(*) as total FROM Sinistres WHERE ${whereEnCours} GROUP BY centre
      UNION ALL
      SELECT centre, COUNT(*) as total FROM Sinistres_Termines WHERE ${whereTermines} GROUP BY centre
    `);

    res.json({
      sinistres: {
        en_cours: sinistresEnCours.recordset[0].total,
        termines: sinistresTermines.recordset[0].total,
        total:
          sinistresEnCours.recordset[0].total +
          sinistresTermines.recordset[0].total,
        total_soumis:
          (sinistresEnCours.recordset[0].total_soumis || 0) +
          (sinistresTermines.recordset[0].total_soumis || 0),
        total_rembourse: sinistresTermines.recordset[0].total_rembourse || 0,
        rejetes: 0,
      },
      adherents: adherents.recordset[0],
      parCentre: parCentre.recordset,
    });
  } catch (err) {
    console.error("ERREUR dashboard:", err);
    res.status(500).json({ error: err.message });
>>>>>>> sofii/main
  }
});

export default router;
