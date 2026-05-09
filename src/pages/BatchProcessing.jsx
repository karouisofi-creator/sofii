import { useEffect, useState } from "react";
import {
  HERO_GRADIENT,
  PAGE_CONTAINER,
  PAGE_WRAPPER,
  PANEL_DESC,
  PANEL_HEADER,
  PANEL_TITLE,
  PANEL_WRAPPER,
  PRIMARY_BUTTON,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SHELL,
  INPUT_CLASS,
  METRIC_BADGE,
} from "../components/adminUi";

const CATEGORIE_COLORS = {
  Sinistres: "bg-blue-100 text-blue-700",
  Adhérents: "bg-green-100 text-green-700",
  Clients: "bg-purple-100 text-purple-700",
};

const CATEGORIE_ICONS = {
  Sinistres: "🏥",
  Adhérents: "👥",
  Clients: "🏢",
};

export default function BatchProcessing() {
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [params, setParams] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/batch")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error(err));
  }, []);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/batch/${selected.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getParamsList = (batch) => {
    if (!batch.parametres) return [];
    return batch.parametres.split(",").filter((p) => p.trim() !== "");
  };

  const groupedBatches = batches.reduce((acc, batch) => {
    const cat = batch.categorie || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(batch);
    return acc;
  }, {});

  return (
    <div className={PAGE_WRAPPER}>
      <div className={PAGE_CONTAINER}>

        {/* Header */}
        <div className={HERO_GRADIENT + " mb-8"}>
          <h1 className="text-4xl font-bold text-white mb-2">
            Batch Processing
          </h1>
          <p className="text-white/80">
            Catalogue des requêtes Claims — {batches.length} requêtes disponibles
          </p>
        </div>

        {/* Batches groupés par catégorie */}
        {Object.entries(groupedBatches).map(([categorie, items]) => (
          <div key={categorie} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">
                {CATEGORIE_ICONS[categorie] || "📁"}
              </span>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                {categorie}
              </h2>
              <div className="flex-1 h-px bg-slate-300"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => {
                    setSelected(batch);
                    setResults(null);
                    setParams({});
                  }}
                  className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selected?.id === batch.id
                      ? "border-blue-500 shadow-md bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-slate-800">
                      {batch.nom}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORIE_COLORS[categorie] || "bg-slate-100 text-slate-600"}`}>
                      {batch.categorie}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{batch.description}</p>
                  {selected?.id === batch.id && (
                    <div className="mt-3 flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <span>✓</span> Sélectionné
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Formulaire paramètres */}
        {selected && (
          <div className={PANEL_WRAPPER + " mb-8"}>
            <div className={PANEL_HEADER}>
              <h2 className={PANEL_TITLE}>{selected.nom}</h2>
              <p className={PANEL_DESC}>{selected.description}</p>
            </div>

            {getParamsList(selected).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {getParamsList(selected).map((param) => (
                  <div key={param}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                      {param.replace(/_/g, " ")}
                    </label>
                    <input
                      type={param.includes("date") ? "date" : "text"}
                      className={INPUT_CLASS}
                      onChange={(e) =>
                        setParams((prev) => ({
                          ...prev,
                          [param]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 bg-slate-100 p-3 rounded-lg">
                <span>ℹ️</span> Aucun paramètre requis pour cette requête
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={loading}
              className={PRIMARY_BUTTON + " disabled:opacity-50"}
            >
              {loading ? (
                <>
                  <span>⏳</span> Exécution en cours...
                </>
              ) : (
                <>
                  <span>▶</span> Exécuter la requête
                </>
              )}
            </button>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div className={PANEL_WRAPPER}>
            <div className={PANEL_HEADER}>
              <h2 className={PANEL_TITLE}>Résultats</h2>
              <span className={METRIC_BADGE + " ml-auto"}>
                {results.total} ligne{results.total > 1 ? "s" : ""}
              </span>
            </div>
            {results.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className={TABLE_SHELL}>
                  <thead>
                    <tr className={TABLE_HEAD}>
                      {Object.keys(results.data[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.map((row, i) => (
                      <tr key={i} className={TABLE_ROW}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-2">
                            {val?.toString() || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="text-4xl mb-2">🔍</p>
                <p>Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
