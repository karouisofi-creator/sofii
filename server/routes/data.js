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
  }
});

export default router;
