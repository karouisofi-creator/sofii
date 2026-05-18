import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  HERO_GRADIENT,
  INFO_CARD,
  INPUT_CLASS,
  KPI_CARD,
  METRIC_BADGE,
  PAGE_CONTAINER,
  PAGE_WRAPPER,
  PANEL_DESC,
  PANEL_HEADER,
  PANEL_TITLE,
  PANEL_WRAPPER,
  PRIMARY_BUTTON,
  SECTION_SURFACE,
  SELECT_CLASS,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_SHELL,
} from "../components/adminUi";
import DonutChart from "../components/Charts/DonutChart";
import CenterBarChart from "../components/Charts/CenterBarChart";
// Chart components removed due to Node version constraints
// Simple HTML/CSS visualizations used instead

// Minimal helper stubs and defaults (restore real implementations if needed)
const API_BASE = "";
const fetchJson = async (url, fallback = null) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json();
  } catch (e) {
    return fallback;
  }
};

const DEFAULT_DASHBOARD_FILTERS = {
  centresSelectionnes: ["Sélectionner tout"],
  dateDebut: "",
  dateFin: "",
  marque: "Tout",
  nomAssureur: "Tout",
  team: "Tout",
  nameAgent: "Tout",
};

const TEAM_FALLBACK = [];
const filterClaimsByDashboard = (rows /*, state */) =>
  Array.isArray(rows) ? rows : [];
const buildAgingSummary = (rows /* array */) => ({ over10: 0 });
const getRowField = (row, keys) => {
  for (const k of keys) if (row && row[k] != null) return row[k];
  return "";
};

const KPI_META = [
  {
    key: "total",
    label: "Sinistres totaux",
    tone: "text-slate-900",
    badge: "",
    badgeClass: "",
  },
  {
    key: "enCours",
    label: "Sinistres en cours",
    tone: "text-orange-500",
    badge: "",
    badgeClass: "",
  },
  {
    key: "termines",
    label: "Sinistres terminés",
    tone: "text-emerald-600",
    badge: "",
    badgeClass: "",
  },
  {
    key: "validation",
    label: "Taux de Validation",
    tone: "text-blue-600",
    badge: "",
    badgeClass: "",
  },
];

export default function Dashboard() {
  const { authSyncing } = useAuth();

  // basic local state placeholders (will be updated by fetches)
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [rawSinistres, setRawSinistres] = useState([]);
  const [rawSinistresTermines, setRawSinistresTermines] = useState([]);
  const [centresSelectionnes, setCentresSelectionnes] = useState(
    DEFAULT_DASHBOARD_FILTERS.centresSelectionnes,
  );
  const [dateDebut, setDateDebut] = useState(
    DEFAULT_DASHBOARD_FILTERS.dateDebut,
  );
  const [dateFin, setDateFin] = useState(DEFAULT_DASHBOARD_FILTERS.dateFin);
  const [marque, setMarque] = useState(DEFAULT_DASHBOARD_FILTERS.marque);
  const [nomAssureur, setNomAssureur] = useState(
    DEFAULT_DASHBOARD_FILTERS.nomAssureur,
  );
  const [team, setTeam] = useState(DEFAULT_DASHBOARD_FILTERS.team);
  const [nameAgent, setNameAgent] = useState(
    DEFAULT_DASHBOARD_FILTERS.nameAgent,
  );
  const [filters, setFilters] = useState({
    marques: [],
    assureurs: [],
    centres: [],
    teams: [],
    agents: [],
  });
  const [ecReasons, setEcReasons] = useState([]);
  const [adjustmentReasons, setAdjustmentReasons] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [providerCenters, setProviderCenters] = useState([]);
  const [insuredCenters, setInsuredCenters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const CENTRES = useMemo(() => {
    const source =
      Array.isArray(filters.centres) && filters.centres.length > 0
        ? filters.centres
        : filters.teams;
    const normalized = Array.from(new Set((source || []).filter(Boolean)));
    return ["Sélectionner tout", ...normalized];
  }, [filters.centres, filters.teams]);

  const paramsForFilters = () => {
    const p = new URLSearchParams();
    const selectedCentres = centresSelectionnes.filter(
      (value) => value !== "Sélectionner tout",
    );
    if (selectedCentres.length === 1) {
      p.append("centre", selectedCentres[0]);
    } else if (selectedCentres.length > 1) {
      p.append("centres", selectedCentres.join(","));
    }
    if (dateDebut) p.append("date_debut", dateDebut);
    if (dateFin) p.append("date_fin", dateFin);
    if (marque && marque !== "Tout") p.append("marque", marque);
    if (nomAssureur && nomAssureur !== "Tout") {
      p.append("nom_assureur", nomAssureur);
    }
    if (team && team !== "Tout") p.append("team", team);
    if (nameAgent && nameAgent !== "Tout") p.append("agent", nameAgent);
    return p;
  };

  const teamParamsForFilters = () => {
    const p = new URLSearchParams();
    if (team && team !== "Tout") p.append("team", team);
    if (nameAgent && nameAgent !== "Tout") p.append("agent", nameAgent);
    return p;
  };

  const fetchDashboard = async () => {
    try {
      const params = paramsForFilters();
      const teamParams = teamParamsForFilters();
      const dashboardData = await fetchJson(
        `${API_BASE}/api/data/dashboard?${params.toString()}`,
        null,
      );

      if (!dashboardData || !dashboardData.sinistres) {
        setApiError("API indisponible ou réponse invalide pour les KPI.");
        setStats(null);
      } else {
        setApiError("");
        setStats(dashboardData);
      }

      void Promise.all([
        fetchJson(`${API_BASE}/api/data/teams?${teamParams.toString()}`, []),
        fetchJson(`${API_BASE}/api/data/sinistres`, []),
        fetchJson(`${API_BASE}/api/data/sinistres-termines`, []),
        fetchJson(`${API_BASE}/api/data/filters`, {
          marques: [],
          assureurs: [],
          centres: [],
          teams: [],
          agents: [],
        }),
      ])
        .then(([teamsData, sinistresData, terminesData, filtersData]) => {
          setTeams(Array.isArray(teamsData) ? teamsData : []);
          setRawSinistres(Array.isArray(sinistresData) ? sinistresData : []);
          setRawSinistresTermines(
            Array.isArray(terminesData) ? terminesData : [],
          );
          setFilters({
            marques: Array.isArray(filtersData?.marques)
              ? filtersData.marques
              : [],
            assureurs: Array.isArray(filtersData?.assureurs)
              ? filtersData.assureurs
              : [],
            centres: Array.isArray(filtersData?.centres)
              ? filtersData.centres
              : Array.isArray(filtersData?.teams)
                ? filtersData.teams
                : [],
            teams: Array.isArray(filtersData?.teams) ? filtersData.teams : [],
            agents: Array.isArray(filtersData?.agents)
              ? filtersData.agents
              : [],
          });
        })
        .catch((error) => {
          console.error("[Dashboard] supplementary fetch failed", error);
          setTeams([]);
          setRawSinistres([]);
          setRawSinistresTermines([]);
          setFilters({
            marques: [],
            assureurs: [],
            centres: [],
            teams: [],
            agents: [],
          });
        });
    } catch (error) {
      console.error("[Dashboard] fetchDashboard failed", error);
      setApiError("Erreur de connexion API.");
      setStats(null);
      setTeams([]);
      setRawSinistres([]);
      setRawSinistresTermines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [
    centresSelectionnes,
    dateDebut,
    dateFin,
    marque,
    nomAssureur,
    team,
    nameAgent,
  ]);

  useEffect(() => {
    const params = paramsForFilters().toString();
    void Promise.all([
      fetchJson(`${API_BASE}/api/data/top-ec-reasons?${params}`, []),
      fetchJson(`${API_BASE}/api/data/adjustment-reasons?${params}`, []),
      fetchJson(`${API_BASE}/api/data/top-rejection-reasons?${params}`, []),
      fetchJson(`${API_BASE}/api/data/provider-claims-center?${params}`, []),
      fetchJson(`${API_BASE}/api/data/insured-claims-center?${params}`, []),
    ])
      .then(([ec, adj, rej, prov, ins]) => {
        const toArray = (r) =>
          Array.isArray(r) ? r : Array.isArray(r?.value) ? r.value : [];
        setEcReasons(toArray(ec));
        setAdjustmentReasons(toArray(adj));
        setRejectionReasons(toArray(rej));
        setProviderCenters(toArray(prov));
        setInsuredCenters(toArray(ins));
      })
      .catch((err) => console.error("[Dashboard] charts fetch failed", err));
  }, [
    centresSelectionnes,
    dateDebut,
    dateFin,
    marque,
    nomAssureur,
    team,
    nameAgent,
  ]);

  const resetDashboardFilters = () => {
    setCentresSelectionnes(DEFAULT_DASHBOARD_FILTERS.centresSelectionnes);
    setDateDebut(DEFAULT_DASHBOARD_FILTERS.dateDebut);
    setDateFin(DEFAULT_DASHBOARD_FILTERS.dateFin);
    setMarque(DEFAULT_DASHBOARD_FILTERS.marque);
    setNomAssureur(DEFAULT_DASHBOARD_FILTERS.nomAssureur);
    setTeam(DEFAULT_DASHBOARD_FILTERS.team);
    setNameAgent(DEFAULT_DASHBOARD_FILTERS.nameAgent);
  };

  const toggleCentre = (centre) => {
    if (centre === "Sélectionner tout") {
      setCentresSelectionnes(["Sélectionner tout"]);
    } else {
      const newSelection = centresSelectionnes.includes(centre)
        ? centresSelectionnes.filter(
            (c) => c !== centre && c !== "Sélectionner tout",
          )
        : [
            ...centresSelectionnes.filter((c) => c !== "Sélectionner tout"),
            centre,
          ];
      setCentresSelectionnes(
        newSelection.length === 0 ? ["Sélectionner tout"] : newSelection,
      );
    }
  };

  const tauxValidation = stats?.sinistres
    ? Math.round((stats.sinistres.termines / stats.sinistres.total) * 100)
    : 0;

  const groupedTeams = useMemo(
    () =>
      teams.reduce((acc, row) => {
        if (!acc[row.team]) acc[row.team] = [];
        acc[row.team].push(row);
        return acc;
      }, {}),
    [teams],
  );

  const pieData = useMemo(
    () =>
      stats?.sinistres
        ? [
            {
              name: "En cours",
              value: stats.sinistres.en_cours || 0,
              color: "#f97316",
            },
            {
              name: "Terminés",
              value: stats.sinistres.termines || 0,
              color: "#22c55e",
            },
            {
              name: "Rejetés",
              value: stats.sinistres.rejetes || 0,
              color: "#ef4444",
            },
          ]
        : [],
    [stats],
  );

  const barData = useMemo(
    () =>
      stats?.parCentre?.map((c) => ({
        centre: c.centre,
        total: c.total,
      })) || [],
    [stats],
  );

  // Monthly trends: fetched from API with a mock fallback so the dashboard
  // works even without a backend dataset provided by the supervisor.
  const [monthlyTrends, setMonthlyTrends] = useState([
    { mois: "Jan", sinistres: 2 },
    { mois: "Fév", sinistres: 4 },
    { mois: "Mar", sinistres: 3 },
    { mois: "Avr", sinistres: 5 },
    { mois: "Mai", sinistres: 2 },
  ]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/data/monthly-trends`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setMonthlyTrends(
            data.map((d) => ({
              mois: d.mois || d.month || d.label,
              sinistres: Number(d.sinistres || d.value || d.count) || 0,
            })),
          );
          setLastUpdated(new Date().toISOString());
        }
      })
      .catch(() => {
        // keep fallback mock data
      });
    return () => {
      mounted = false;
    };
  }, []);

  const dashboardFilterState = {
    centresSelectionnes,
    dateDebut,
    dateFin,
    marque,
    nomAssureur,
  };

  const filteredRawSinistres = useMemo(
    () => filterClaimsByDashboard(rawSinistres, dashboardFilterState),
    [
      rawSinistres,
      centresSelectionnes,
      dateDebut,
      dateFin,
      marque,
      nomAssureur,
    ],
  );

  const filteredRawSinistresTermines = useMemo(
    () => filterClaimsByDashboard(rawSinistresTermines, dashboardFilterState),
    [
      rawSinistresTermines,
      centresSelectionnes,
      dateDebut,
      dateFin,
      marque,
      nomAssureur,
    ],
  );

  const stockEnCoursSummary = useMemo(
    () => buildAgingSummary(filteredRawSinistres),
    [filteredRawSinistres],
  );

  const stockTerminesSummary = useMemo(
    () => buildAgingSummary(filteredRawSinistresTermines),
    [filteredRawSinistresTermines],
  );

  const selectedCentreLabel = centresSelectionnes.includes("Sélectionner tout")
    ? "Tous les centres"
    : centresSelectionnes[0];

  const activeFilterChips = [
    { label: "Centre", value: selectedCentreLabel },
    {
      label: "Période",
      value:
        dateDebut || dateFin
          ? `${dateDebut || "..."} → ${dateFin || "..."}`
          : "Toutes",
    },
    { label: "Marque", value: marque === "Tout" ? "Toutes" : marque },
    {
      label: "Assureur",
      value: nomAssureur === "Tout" ? "Tous" : nomAssureur,
    },
    { label: "Team", value: team === "Tout" ? "Toutes" : team },
    {
      label: "Agent",
      value: nameAgent === "Tout" ? "Tous" : nameAgent,
    },
  ];

  const sinistres = stats?.sinistres || {};
  const totalSinistres = sinistres.total || 0;
  const termines = sinistres.termines || 0;
  const enCours = sinistres.en_cours || 0;
  const totalSoumis = sinistres.total_soumis || 0;
  const totalRembourse = sinistres.total_rembourse || 0;
  const totalRejetes = sinistres.rejetes || 0;
  const rateCloture =
    totalSinistres > 0 ? Math.round((termines / totalSinistres) * 100) : 0;
  const rateRembourse =
    totalSoumis > 0 ? Math.round((totalRembourse / totalSoumis) * 100) : 0;

  const kpiCards = KPI_META.map((item) => {
    if (item.key === "total") {
      return {
        ...item,
        value: totalSinistres.toLocaleString(),
        meta: `dont ${totalRejetes.toLocaleString()} rejetés`,
      };
    }
    if (item.key === "termines") {
      return {
        ...item,
        value: `${termines.toLocaleString()}`,
        meta: `Taux de clôture ${rateCloture}%`,
      };
    }
    if (item.key === "enCours") {
      return {
        ...item,
        value: enCours.toLocaleString(),
        meta: `${stockEnCoursSummary.over10} dossiers >10 jours`,
      };
    }
    return {
      ...item,
      value: `${rateCloture}%`,
      meta: `Remboursé ${rateRembourse}% des montants soumis`,
    };
  });

  const teamRows = teams.length > 0 ? teams : TEAM_FALLBACK;

  const handleImport = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        if (!rows || rows.length === 0) return;
        const first = rows[0];
        const keys = Object.keys(first).map((k) => k.toLowerCase());
        if (
          keys.includes("mois") ||
          keys.includes("month") ||
          keys.includes("label")
        ) {
          setMonthlyTrends(
            rows.map((r) => ({
              mois: r.mois || r.month || r.label,
              sinistres: Number(r.sinistres || r.value || r.count) || 0,
            })),
          );
          setLastUpdated(new Date().toISOString());
        } else {
          setRawSinistres(Array.isArray(rows) ? rows : []);
        }
      } catch (err) {
        console.error("Import parse error", err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Exports and rendering from your partner's code...
  // Updated to avoid recharts dependency; using simple HTML/CSS visualizations instead
  return (
    <div className={`${PAGE_WRAPPER} px-2 sm:px-4`}>
      <div className={`${PAGE_CONTAINER} max-w-[1700px] space-y-8`}>
        {/* Header with Export Buttons */}
        <div className={PANEL_WRAPPER}>
          <div className={HERO_GRADIENT}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                  Dashboard Analytique
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                  ANALYSE DES SINISTRES
                </h1>
                <p className="mt-4 text-base leading-7 text-white/85 sm:text-lg">
                  Vue consolidée des sinistres, des stocks par ancienneté et
                  performance des équipes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {authSyncing && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/90">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                    Synchronisation…
                  </div>
                )}
                <button
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(filteredRawSinistres);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Sinistres");
                    XLSX.writeFile(
                      wb,
                      `export_sinistres_${new Date().getTime()}.xlsx`,
                    );
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/20"
                >
                  📥 Excel
                </button>
                <button
                  onClick={() => {
                    const doc = new jsPDF();
                    const data = filteredRawSinistres
                      .slice(0, 100)
                      .map((row) => [
                        getRowField(row, ["date_sinistre", "dateSinistre"]),
                        getRowField(row, ["centre", "Centre"]),
                        getRowField(row, ["MARQUE", "Marque", "marque"]),
                        getRowField(row, [
                          "Nom_Assureur",
                          "nom_assureur",
                          "NomAssureur",
                        ]),
                      ]);
                    autoTable(doc, {
                      head: [["Date", "Centre", "Marque", "Assureur"]],
                      body: data,
                      startY: 10,
                    });
                    doc.save(`export_pdf_${new Date().getTime()}.pdf`);
                  }}
                  className={PRIMARY_BUTTON}
                >
                  📄 PDF
                </button>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}
        </div>

        {/* Collapsible Filter Section - Top */}
        <div
          className={
            PANEL_WRAPPER + " bg-gradient-to-r from-blue-50 to-indigo-50"
          }
        >
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <div className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                🔍
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3">
                  <h2 className={`${PANEL_TITLE} text-xl`}>Filtres Avancés</h2>
                  <div className="inline-block px-3 py-1.5 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                    {(() => {
                      let count = centresSelectionnes.includes(
                        "Sélectionner tout",
                      )
                        ? 0
                        : centresSelectionnes.length;
                      if (dateDebut) count++;
                      if (dateFin) count++;
                      if (marque !== "Tout") count++;
                      if (nomAssureur !== "Tout") count++;
                      if (team !== "Tout") count++;
                      if (nameAgent !== "Tout") count++;
                      return count > 0
                        ? `${count} filtre${count > 1 ? "s" : ""} actif${count > 1 ? "s" : ""}`
                        : "Aucun filtre";
                    })()}
                  </div>
                </div>
                <p className={`${PANEL_DESC} text-sm`}>
                  Affinez l'analyse par centre, période et critères métier
                </p>
              </div>
              <div
                className={`text-2xl text-blue-600 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
              >
                ▼
              </div>
            </div>
          </button>

          {/* Expanded Filter Content */}
          {showFilters && (
            <div className="border-t border-blue-100 p-8 space-y-8">
              {/* Active Filters Display */}
              {(() => {
                const activeFilters = [];
                if (!centresSelectionnes.includes("Sélectionner tout")) {
                  centresSelectionnes.forEach((c) =>
                    activeFilters.push({
                      type: "centre",
                      label: "📍 " + c,
                      value: c,
                    }),
                  );
                }
                if (dateDebut)
                  activeFilters.push({
                    type: "dateDebut",
                    label: "📅 De: " + dateDebut,
                    value: dateDebut,
                  });
                if (dateFin)
                  activeFilters.push({
                    type: "dateFin",
                    label: "📅 Au: " + dateFin,
                    value: dateFin,
                  });
                if (marque !== "Tout")
                  activeFilters.push({
                    type: "marque",
                    label: "🏷️ " + marque,
                    value: marque,
                  });
                if (nomAssureur !== "Tout")
                  activeFilters.push({
                    type: "nomAssureur",
                    label: "🛡️ " + nomAssureur,
                    value: nomAssureur,
                  });
                if (team !== "Tout")
                  activeFilters.push({
                    type: "team",
                    label: "👥 " + team,
                    value: team,
                  });
                if (nameAgent !== "Tout")
                  activeFilters.push({
                    type: "nameAgent",
                    label: "👤 " + nameAgent,
                    value: nameAgent,
                  });

                return activeFilters.length > 0 ? (
                  <div className="bg-white border border-blue-200 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase mb-3">
                      Filtres appliqués
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map((filter, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {filter.label}
                          </span>
                          <button
                            onClick={() => {
                              if (filter.type === "centre")
                                setCentresSelectionnes((c) =>
                                  c.filter((x) => x !== filter.value),
                                );
                              else if (filter.type === "dateDebut")
                                setDateDebut("");
                              else if (filter.type === "dateFin")
                                setDateFin("");
                              else if (filter.type === "marque")
                                setMarque("Tout");
                              else if (filter.type === "nomAssureur")
                                setNomAssureur("Tout");
                              else if (filter.type === "team") setTeam("Tout");
                              else if (filter.type === "nameAgent")
                                setNameAgent("Tout");
                            }}
                            className="text-slate-400 hover:text-red-500 font-bold transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Centres - Visual Button Grid */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📍</span>
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Centres Opérationnels
                  </label>
                  <div className="ml-auto inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold">
                    {centresSelectionnes.filter(
                      (c) => c !== "Sélectionner tout",
                    ).length > 0
                      ? `${centresSelectionnes.filter((c) => c !== "Sélectionner tout").length} sélectionné${centresSelectionnes.filter((c) => c !== "Sélectionner tout").length > 1 ? "s" : ""}`
                      : "Tous"}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {CENTRES.map((centre) => (
                    <button
                      key={centre}
                      onClick={() => toggleCentre(centre)}
                      className={`px-4 py-3.5 rounded-xl font-semibold text-sm transition-all border-2 duration-200 ${
                        centresSelectionnes.includes(centre)
                          ? centre === "Sélectionner tout"
                            ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg"
                            : "border-green-500 bg-gradient-to-r from-green-50 to-teal-50 text-green-700 shadow-md hover:shadow-lg"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {centresSelectionnes.includes(centre) && (
                        <span className="font-bold">✓ </span>
                      )}
                      {centre === "Sélectionner tout" ? "Tous" : centre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range - Card Style */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📅</span>
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Période d'Analyse
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Depuis le
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className={INPUT_CLASS + " bg-white"}
                      />
                    </div>
                    {dateDebut && (
                      <div className="mt-2 inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        ✓ À partir du{" "}
                        {new Date(dateDebut).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Jusqu'au
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className={INPUT_CLASS + " bg-white"}
                      />
                    </div>
                    {dateFin && (
                      <div className="mt-2 inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        ✓ Jusqu'au{" "}
                        {new Date(dateFin).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Marque & Assureur - Card Style */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏷️</span>
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Critères Métier
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Marque
                    </label>
                    <div className="relative">
                      <select
                        value={marque}
                        onChange={(e) => setMarque(e.target.value)}
                        className={
                          SELECT_CLASS + " bg-white appearance-none pr-10"
                        }
                      >
                        <option>Tout</option>
                        {filters.marques?.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-purple-600 font-bold">
                        ▼
                      </div>
                    </div>
                    {marque !== "Tout" && (
                      <div className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        ✓ {marque}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Assureur
                    </label>
                    <div className="relative">
                      <select
                        value={nomAssureur}
                        onChange={(e) => setNomAssureur(e.target.value)}
                        className={
                          SELECT_CLASS + " bg-white appearance-none pr-10"
                        }
                      >
                        <option>Tout</option>
                        {filters.assureurs?.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-purple-600 font-bold">
                        ▼
                      </div>
                    </div>
                    {nomAssureur !== "Tout" && (
                      <div className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        ✓ {nomAssureur}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team & Agent - Card Style */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">👥</span>
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Équipe & Agent
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Équipe
                    </label>
                    <div className="relative">
                      <select
                        value={team}
                        onChange={(e) => setTeam(e.target.value)}
                        className={
                          SELECT_CLASS + " bg-white appearance-none pr-10"
                        }
                      >
                        <option>Tout</option>
                        {filters.teams?.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-green-600 font-bold">
                        ▼
                      </div>
                    </div>
                    {team !== "Tout" && (
                      <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        ✓ {team}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Agent
                    </label>
                    <div className="relative">
                      <select
                        value={nameAgent}
                        onChange={(e) => setNameAgent(e.target.value)}
                        className={
                          SELECT_CLASS + " bg-white appearance-none pr-10"
                        }
                      >
                        <option>Tout</option>
                        {filters.agents?.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-green-600 font-bold">
                        ▼
                      </div>
                    </div>
                    {nameAgent !== "Tout" && (
                      <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        ✓ {nameAgent}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-blue-100">
                <button
                  onClick={resetDashboardFilters}
                  className="px-6 py-2.5 rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 font-semibold text-sm hover:from-red-100 hover:to-orange-100 hover:shadow-md transition-all duration-200"
                >
                  🔄 Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* KPI Cards Section */}
        <div className="grid gap-6 bg-slate-50 p-8 sm:grid-cols-2 xl:grid-cols-4 rounded-2xl">
          {loading
            ? KPI_META.map((item) => (
                <div
                  key={item.label}
                  className={`${KPI_CARD} min-h-[190px] animate-pulse`}
                >
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="h-10 w-24 rounded bg-slate-200" />
                    <div className="h-6 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                </div>
              ))
            : kpiCards.map((item) => (
                <div
                  key={item.label}
                  className={`${KPI_CARD} min-h-[190px] p-6`}
                >
                  <p className="text-base font-semibold text-slate-500">
                    {item.label}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p
                      className={`text-4xl font-bold tracking-tight ${item.tone}`}
                    >
                      {item.value}
                    </p>
                    <span className={`${METRIC_BADGE} ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-4 text-base leading-7 text-slate-500">
                    {item.meta}
                  </p>
                </div>
              ))}
        </div>

        {/* Stock Tables Section */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Stock En Cours */}
          <div className={PANEL_WRAPPER}>
            <div className={PANEL_HEADER}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={PANEL_TITLE}>Stock des Sinistres en Cours</h2>
                  <p className={PANEL_DESC}>
                    Répartition par ancienneté depuis la date de sinistre
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredRawSinistres.length} lignes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section with Metrics */}

        {/* Analysis Section with Metrics */}
        <div className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>Analyse</h2>
            <p className={PANEL_DESC}>
              Visualisations et métriques clés pour l'aide à la décision
            </p>
          </div>

          <div className="space-y-8 p-8">
            {/* Financial Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Montant Soumis
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {totalSoumis.toLocaleString()} DT
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Montant Remboursé
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {totalRembourse.toLocaleString()} DT
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Taux de Validation
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {tauxValidation}%
                </p>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid gap-6 xl:grid-cols-3">
              {/* Status Distribution */}
              <div className={INFO_CARD}>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Distribution des Statuts
                  </p>
                  <p className="text-xs text-slate-500">
                    Répartition par cycle de traitement
                  </p>
                </div>
                <div className="space-y-3">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(item.value / (pieData.reduce((a, b) => a + (b.value || 0), 0) || 1)) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Centre Distribution */}
              <div className={INFO_CARD}>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Sinistres par Centre
                  </p>
                  <p className="text-xs text-slate-500">
                    Comparaison consolidée par site
                  </p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {barData.length > 0 ? (
                    barData.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.centre}</span>
                          <span className="font-bold">{item.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded h-5">
                          <div
                            className="h-5 bg-blue-500 rounded flex items-center pl-2 text-white text-xs font-bold"
                            style={{
                              width: `${(item.total / (Math.max(...barData.map((b) => b.total)) || 1)) * 100}%`,
                            }}
                          >
                            {item.total > 50 && item.total}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">Aucune donnée</p>
                  )}
                </div>
              </div>

              {/* Monthly Trends */}
              <div className={INFO_CARD}>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Tendances Mensuelles
                  </p>
                  <p className="text-xs text-slate-500">Évolution par mois</p>
                </div>
                <div className="space-y-2">
                  {monthlyTrends.map((row, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{row.mois}</span>
                        <span className="font-bold">{row.sinistres}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded h-3">
                        <div
                          className="h-3 bg-green-500 rounded"
                          style={{
                            width: `${(row.sinistres / (Math.max(...monthlyTrends.map((m) => m.sinistres)) || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts: Reasons & Center Metrics */}
        <div className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>
              Analyse détaillée des raisons & centres
            </h2>
            <p className={PANEL_DESC}>
              Top raisons de cloture / ajustement / rejet et performance par
              centre
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className={INFO_CARD}>
                <DonutChart
                  data={ecReasons.map((r) => ({
                    name: r.name,
                    value: r.value,
                  }))}
                  title="TOP 10 EC_reasons"
                />
              </div>
              <div className={INFO_CARD}>
                <DonutChart
                  data={adjustmentReasons.map((r) => ({
                    name: r.name,
                    value: r.value,
                  }))}
                  title="adjustment reasons"
                />
              </div>
              <div className={INFO_CARD}>
                <DonutChart
                  data={rejectionReasons.map((r) => ({
                    name: r.name,
                    value: r.value,
                  }))}
                  title="TOP 10 rejection reasons"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className={INFO_CARD}>
                <CenterBarChart
                  data={insuredCenters}
                  title="Insured claims : Center"
                  valueKey={"nb_claims_treated"}
                  labelKey={"centre"}
                />
              </div>
              <div className={INFO_CARD}>
                <CenterBarChart
                  data={providerCenters}
                  title="Provider claims : Center"
                  valueKey={"nb_claims_treated"}
                  labelKey={"centre"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance Section */}
        <div className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>Performance des Équipes</h2>
            <p className={PANEL_DESC}>
              Comparaison par équipe et par agent avec les KPIs clés
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className={TABLE_SHELL + " w-full"}>
              <thead>
                <tr>
                  <th className={TABLE_HEAD}>Équipe</th>
                  <th className={TABLE_HEAD + " text-center"}>Agent</th>
                  <th className={TABLE_HEAD + " text-center"}>Centre</th>
                  <th className={TABLE_HEAD + " text-center"}>
                    Sinistres Traités
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>Score</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map((row, idx) => (
                  <tr key={idx} className={TABLE_ROW}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {row.team}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {row.agent || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {row.centre || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-800">
                      {row.nb_claims_treated || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                        ✓ Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div className="bg-slate-50 p-6 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Équipes
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {[...new Set(teamRows.map((t) => t.team))].length}
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Agents
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {
                    [
                      ...new Set(
                        teamRows.filter((t) => t.agent).map((t) => t.agent),
                      ),
                    ].length
                  }
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Centres
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {[...new Set(teamRows.map((t) => t.centre))].length}
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Traité
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {teamRows.reduce(
                    (sum, t) => sum + (t.nb_claims_treated || 0),
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
