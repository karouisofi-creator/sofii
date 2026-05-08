import express from "express";
import { query } from "../db.js";

const router = express.Router();

// ✅ Liste toutes les demandes
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT d.id_demande, d.titre, d.description, d.type_extraction, 
             d.urgence, d.statut, d.date_creation,
             u.email as user_email, u.fullName as user_name
      FROM DemandesReporting d
      LEFT JOIN users u ON d.id_user = u.id
      ORDER BY d.date_creation DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("ERREUR reporting:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Créer une nouvelle demande
router.post("/", async (req, res) => {
  try {
    const { titre, description, type_extraction, urgence, id_user } = req.body;

    await query(`
      INSERT INTO DemandesReporting (id_user, titre, description, type_extraction, urgence, statut)
      VALUES (${id_user}, N'${titre}', N'${description}', N'${type_extraction}', N'${urgence}', N'En attente')
    `);

    res.json({ message: "Demande créée avec succès" });
  } catch (err) {
    console.error("ERREUR create reporting:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mettre à jour le statut (admin)
router.put("/:id/statut", async (req, res) => {
  try {
    const { statut } = req.body;
    await query(`
      UPDATE DemandesReporting SET statut = N'${statut}' WHERE id_demande = ${req.params.id}
    `);
    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
