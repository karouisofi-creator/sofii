import express from "express";
import { query } from "../db.js";

const router = express.Router();

// ✅ Liste tous les batches disponibles
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, nom, description, categorie, parametres, actif FROM BatchProcesses ORDER BY nom",
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("ERREUR batch:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Exécuter un batch par ID
router.post("/:id/execute", async (req, res) => {
  try {
    const { date_debut, date_fin, centre, numero_adherent } = req.body;

    const batch = await query(
      `SELECT id, nom, requete_sql, parametres FROM BatchProcesses WHERE id = ${req.params.id}`,
    );

    if (!batch.recordset[0]) {
      return res.status(404).json({ error: "Batch non trouvé" });
    }

    const b = batch.recordset[0];
    let sqlQuery = b.requete_sql;

    // Remplace les paramètres dynamiques
    if (date_debut)
      sqlQuery = sqlQuery.replace("{date_debut}", `'${date_debut}'`);
    if (date_fin) sqlQuery = sqlQuery.replace("{date_fin}", `'${date_fin}'`);
    if (centre) sqlQuery = sqlQuery.replace("{centre}", `'${centre}'`);
    if (numero_adherent)
      sqlQuery = sqlQuery.replace("{numero_adherent}", `'${numero_adherent}'`);

    const result = await query(sqlQuery);
    res.json({
      batch: b.nom,
      total: result.recordset.length,
      data: result.recordset,
    });
  } catch (err) {
    console.error("ERREUR execute batch:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
