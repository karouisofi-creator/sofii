import { useEffect, useState } from "react";

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
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center gap-4 border border-slate-200">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
        >
          ⚙️
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Batch Processing</h1>
          <p className="text-slate-500 text-sm">
            Catalogue des requêtes Claims — {batches.length} requêtes
            disponibles
          </p>
        </div>
      </div>

      {/* Batches groupés par catégorie */}
      {Object.entries(groupedBatches).map(([categorie, items]) => (
        <div key={categorie} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">
              {CATEGORIE_ICONS[categorie] || "📁"}
            </span>
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
              {categorie}
            </h2>
            <div className="flex-1 h-px bg-slate-200"></div>
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
                className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === batch.id
                    ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-800 text-sm">
                    {batch.nom}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORIE_COLORS[categorie] || "bg-slate-100 text-slate-600"}`}
                  >
                    {batch.categorie}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{batch.description}</p>
                {selected?.id === batch.id && (
                  <div className="mt-3 flex items-center gap-1 text-blue-600 text-xs font-medium">
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
              📋
            </div>
            <h2 className="text-lg font-bold text-slate-700">{selected.nom}</h2>
          </div>

          {getParamsList(selected).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {getParamsList(selected).map((param) => (
                <div key={param}>
                  <label className="block text-sm font-semibold text-slate-600 mb-1 capitalize">
                    {param.replace(/_/g, " ")}
                  </label>
                  <input
                    type={param.includes("date") ? "date" : "text"}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 bg-slate-50 p-3 rounded-lg">
              <span>ℹ️</span> Aucun paramètre requis pour cette requête
            </div>
          )}

          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)" }}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="font-bold text-slate-700">Résultats</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                {results.total} ligne{results.total > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {results.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr
                    style={{
                      background: "linear-gradient(135deg, #1a237e, #1565c0)",
                    }}
                  >
                    {Object.keys(results.data[0]).map((col) => (
                      <th
                        key={col}
                        className="text-left px-3 py-3 text-white font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b hover:bg-blue-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 text-slate-700">
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
  );
}
