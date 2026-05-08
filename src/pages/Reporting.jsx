import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const URGENCES = ["Normale", "Haute", "Urgente"];
const TYPES = ["Ponctuelle", "Récurrente"];
const STATUTS = ["En attente", "En cours", "Résolu", "Rejeté"];

const STATUT_COLORS = {
  "En attente": "bg-yellow-100 text-yellow-700 border border-yellow-200",
  "En cours": "bg-blue-100 text-blue-700 border border-blue-200",
  Résolu: "bg-green-100 text-green-700 border border-green-200",
  Rejeté: "bg-red-100 text-red-700 border border-red-200",
};

const STATUT_ICONS = {
  "En attente": "⏳",
  "En cours": "🔄",
  Résolu: "✅",
  Rejeté: "❌",
};

const URGENCE_COLORS = {
  Normale: "bg-slate-100 text-slate-600",
  Haute: "bg-orange-100 text-orange-600",
  Urgente: "bg-red-100 text-red-600",
};

const URGENCE_ICONS = {
  Normale: "🟢",
  Haute: "🟠",
  Urgente: "🔴",
};

export default function Reporting() {
  const { user, isAdmin } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titre: "",
    description: "",
    type_extraction: "Ponctuelle",
    urgence: "Normale",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filterStatut, setFilterStatut] = useState("Tous");

  const fetchDemandes = () => {
    fetch("/api/reporting")
      .then((res) => res.json())
      .then((data) => {
        setDemandes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleSubmit = async () => {
    if (!form.titre || !form.description) return;
    setSubmitting(true);
    try {
      await fetch("/api/reporting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id_user: user?.id }),
      });
      setSuccess(true);
      setShowForm(false);
      setForm({
        titre: "",
        description: "",
        type_extraction: "Ponctuelle",
        urgence: "Normale",
      });
      fetchDemandes();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleStatut = async (id, statut) => {
    await fetch(`/api/reporting/${id}/statut`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    fetchDemandes();
  };

  const filteredDemandes =
    filterStatut === "Tous"
      ? demandes
      : demandes.filter((d) => d.statut === filterStatut);

  const counts = STATUTS.reduce((acc, s) => {
    acc[s] = demandes.filter((d) => d.statut === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: "linear-gradient(135deg, #1a237e, #1565c0)",
              }}
            >
              📋
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Demandes de Reporting
              </h1>
              <p className="text-slate-500 text-sm">
                Gérez vos demandes d'extraction de données
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow"
              style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
            >
              <span>+</span> Nouvelle demande
            </button>
            <button
              onClick={() => {
                // Export demandes to Excel
                const data = demandes.map((d) => ({
                  id: d.id_demande || d.id || "",
                  titre: d.titre,
                  description: d.description,
                  type_extraction: d.type_extraction,
                  urgence: d.urgence,
                  statut: d.statut,
                  date_creation: d.date_creation,
                  user_email: d.user_email || d.user_name || "",
                }));
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Demandes Reporting");
                const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                saveAs(new Blob([buf]), "Demandes_Reporting.xlsx");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Export Excel
            </button>
            <button
              onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(14);
                doc.text("Demandes de Reporting", 14, 16);
                autoTable(doc, {
                  startY: 22,
                  head: [["ID", "Titre", "Type", "Urgence", "Statut", "Créé par", "Date"]],
                  body: demandes.map((d) => [
                    d.id_demande || d.id || "",
                    d.titre,
                    d.type_extraction,
                    d.urgence,
                    d.statut,
                    d.user_email || d.user_name || "",
                    d.date_creation,
                  ]),
                  styles: { fontSize: 9 },
                });
                doc.save("Demandes_Reporting.pdf");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {STATUTS.map((s) => (
            <div
              key={s}
              className={`p-3 rounded-lg text-center cursor-pointer transition ${filterStatut === s ? "ring-2 ring-blue-500" : ""} ${STATUT_COLORS[s]}`}
              onClick={() => setFilterStatut(filterStatut === s ? "Tous" : s)}
            >
              <p className="text-xs font-medium">
                {STATUT_ICONS[s]} {s}
              </p>
              <p className="text-xl font-bold mt-1">{counts[s] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Message succès */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <span>✅</span> Demande créée avec succès !
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              📝
            </div>
            <h2 className="text-lg font-bold text-slate-700">
              Nouvelle demande
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Titre *
              </label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.titre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, titre: e.target.value }))
                }
                placeholder="Ex: Rapport sinistres Tunis janvier 2026"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Description *
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Décrivez précisément les données souhaitées..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Type d'extraction
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.type_extraction}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type_extraction: e.target.value,
                  }))
                }
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Urgence
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.urgence}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, urgence: e.target.value }))
                }
              >
                {URGENCES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #1a237e, #1565c0)",
              }}
            >
              {submitting ? "⏳ Envoi..." : "📤 Envoyer la demande"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl hover:bg-slate-200 font-semibold transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Filtre statut */}
      {demandes.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilterStatut("Tous")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterStatut === "Tous" ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            Tous ({demandes.length})
          </button>
          {STATUTS.filter((s) => counts[s] > 0).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(filterStatut === s ? "Tous" : s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterStatut === s ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              {STATUT_ICONS[s]} {s} ({counts[s]})
            </button>
          ))}
        </div>
      )}

      {/* Liste des demandes */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-2">⏳</p>
          <p>Chargement...</p>
        </div>
      ) : filteredDemandes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-2">📭</p>
          <p>Aucune demande pour l'instant</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            Créer une nouvelle demande
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDemandes.map((d) => (
            <div
              key={d.id_demande}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-slate-800">{d.titre}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCE_COLORS[d.urgence]}`}
                    >
                      {URGENCE_ICONS[d.urgence]} {d.urgence}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{d.description}</p>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      👤 {d.user_name || "Utilisateur"}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {new Date(d.date_creation).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      🔄 {d.type_extraction}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold ${STATUT_COLORS[d.statut]}`}
                  >
                    {STATUT_ICONS[d.statut]} {d.statut}
                  </span>
                  {isAdmin() && (
                    <select
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={d.statut}
                      onChange={(e) =>
                        handleStatut(d.id_demande, e.target.value)
                      }
                    >
                      {STATUTS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
