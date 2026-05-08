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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CENTRES = [
  "Sélectionner tout",
  "DUBAI",
  "PARIS",
  "TUNIS",
  "CALGARY",
  "KL",
  "SHANGHAI",
];

const DAY_MS = 24 * 60 * 60 * 1000;

const STOCK_BUCKETS = [
  { key: "under4", label: "<4 jours", labelShort: "<4", className: "bg-emerald-500 text-white" },
  { key: "fourTo5", label: "4-5 jours", labelShort: "4-5", className: "bg-amber-400 text-white" },
  { key: "sixTo7", label: "6-7 jours", labelShort: "6-7", className: "bg-orange-500 text-white" },
  {
    key: "eightTo10",
    label: "8-10 jours",
    labelShort: "8-10",
    className: "bg-rose-500 text-white",
  },
  { key: "over10", label: ">10 jours", labelShort: ">10", className: "bg-red-600 text-white" },
];

const STOCK_BUCKET_LIGHT = {
  under4: "bg-emerald-50 text-emerald-800",
  fourTo5: "bg-amber-50 text-amber-700",
  sixTo7: "bg-orange-50 text-orange-700",
  eightTo10: "bg-rose-50 text-rose-700",
  over10: "bg-red-50 text-red-700",
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

const KPI_META = [
  {
    key: "total",
    label: "Sinistres totaux",
    tone: "text-slate-800",
    badge: "Volume",
    badgeClass: "bg-slate-100 text-slate-700",
  },
  {
    key: "termines",
    label: "Sinistres terminés",
    tone: "text-emerald-600",
    badge: "Clôture",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "enCours",
    label: "Sinistres en cours",
    tone: "text-orange-500",
    badge: "Stock",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  {
    key: "tauxValidation",
    label: "Taux de validation",
    tone: "text-blue-600",
    badge: "Performance",
    badgeClass: "bg-blue-100 text-blue-700",
  },
];

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const getAgeDays = (value) => {
  if (!isValidDate(value)) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / DAY_MS),
  );
};

const normalizeText = (value) =>
  value ? String(value).trim().toLowerCase() : "";

const getRowField = (row, keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return undefined;
};

const buildAgingSummary = (rows) => {
  const summary = {
    under4: 0,
    fourTo5: 0,
    sixTo7: 0,
    eightTo10: 0,
    over10: 0,
    total: rows.length,
  };

  rows.forEach((row) => {
    const ageDays = getAgeDays(
      getRowField(row, ["date_sinistre", "dateSinistre"]),
    );
    if (ageDays === null) return;
    if (ageDays < 4) summary.under4 += 1;
    else if (ageDays < 6) summary.fourTo5 += 1;
    else if (ageDays < 8) summary.sixTo7 += 1;
    else if (ageDays < 11) summary.eightTo10 += 1;
    else summary.over10 += 1;
  });

  return summary;
};

const filterClaimsByDashboard = (rows, filters) => {
  const selectedCentre = filters.centresSelectionnes.includes(
    "Sélectionner tout",
  )
    ? "Sélectionner tout"
    : filters.centresSelectionnes[0];
  const startDate = filters.dateDebut ? new Date(filters.dateDebut) : null;
  const endDate = filters.dateFin ? new Date(filters.dateFin) : null;
  const activeMarque = normalizeText(filters.marque);
  const activeAssureur = normalizeText(filters.nomAssureur);

  return rows.filter((row) => {
    const rowCentre = getRowField(row, ["centre", "Centre"]);
    const rowMarque = getRowField(row, ["MARQUE", "Marque", "marque"]);
    const rowAssureur = getRowField(row, [
      "Nom_Assureur",
      "nom_assureur",
      "NomAssureur",
    ]);
    const rowDateValue = getRowField(row, ["date_sinistre", "dateSinistre"]);
    const rowDate = isValidDate(rowDateValue) ? new Date(rowDateValue) : null;

    if (
      selectedCentre !== "Sélectionner tout" &&
      rowCentre !== selectedCentre
    ) {
      return false;
    }
    if (startDate && rowDate && rowDate < startDate) return false;
    if (endDate && rowDate && rowDate > endDate) return false;
    if (filters.marque && filters.marque !== "Tout" && normalizeText(rowMarque) !== activeMarque) return false;
    if (
      filters.nomAssureur &&
      filters.nomAssureur !== "Tout" &&
      normalizeText(rowAssureur) !== activeAssureur
    )
      return false;
    return true;
  });
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [rawSinistres, setRawSinistres] = useState([]);
  const [rawSinistresTermines, setRawSinistresTermines] = useState([]);
  const [filters, setFilters] = useState({
    marques: [],
    assureurs: [],
    teams: [],
    agents: [],
  });

  const [centresSelectionnes, setCentresSelectionnes] = useState(
    DEFAULT_DASHBOARD_FILTERS.centresSelectionnes,
  );
  const [clientCompany, setClientCompany] = useState("Sélectionner tout");
  const [dateDebut, setDateDebut] = useState(DEFAULT_DASHBOARD_FILTERS.dateDebut);
  const [dateFin, setDateFin] = useState(DEFAULT_DASHBOARD_FILTERS.dateFin);
  const [marque, setMarque] = useState(DEFAULT_DASHBOARD_FILTERS.marque);
  const [nomAssureur, setNomAssureur] = useState(DEFAULT_DASHBOARD_FILTERS.nomAssureur);
  const [team, setTeam] = useState(DEFAULT_DASHBOARD_FILTERS.team);
  const [nameAgent, setNameAgent] = useState(DEFAULT_DASHBOARD_FILTERS.nameAgent);

  useEffect(() => {
    fetch("/api/data/filters")
      .then((res) => res.json())
      .then((data) => setFilters(data))
      .catch(() => {});
  }, []);

  const fetchDashboard = async (forceEmpty = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    const centresForQuery = forceEmpty
      ? DEFAULT_DASHBOARD_FILTERS.centresSelectionnes
      : centresSelectionnes;
    const dateDebutForQuery = forceEmpty ? DEFAULT_DASHBOARD_FILTERS.dateDebut : dateDebut;
    const dateFinForQuery = forceEmpty ? DEFAULT_DASHBOARD_FILTERS.dateFin : dateFin;
    const marqueForQuery = forceEmpty ? DEFAULT_DASHBOARD_FILTERS.marque : marque;
    const nomAssureurForQuery = forceEmpty ? DEFAULT_DASHBOARD_FILTERS.nomAssureur : nomAssureur;

    if (
      !centresForQuery.includes("Sélectionner tout") &&
      centresForQuery.length > 0
    ) {
      params.append("centre", centresForQuery[0]);
    }
    if (dateDebutForQuery) params.append("date_debut", dateDebutForQuery);
    if (dateFinForQuery) params.append("date_fin", dateFinForQuery);
    if (marqueForQuery !== "Tout") params.append("marque", marqueForQuery);
    if (nomAssureurForQuery !== "Tout") params.append("nom_assureur", nomAssureurForQuery);

    const teamParams = new URLSearchParams();
    if (team !== "Tout") teamParams.append("team", team);
    if (nameAgent !== "Tout") teamParams.append("agent", nameAgent);
    if (
      !centresSelectionnes.includes("Sélectionner tout") &&
      centresSelectionnes.length > 0
    ) {
      teamParams.append("centre", centresSelectionnes[0]);
    }

    try {
      const [
        dashboardResponse,
        teamsResponse,
        sinistresResponse,
        terminesResponse,
      ] = await Promise.all([
        fetch(`/api/data/dashboard?${params.toString()}`),
        fetch(`/api/data/teams?${teamParams.toString()}`),
        fetch("/api/data/sinistres"),
        fetch("/api/data/sinistres-termines"),
      ]);

      const [dashboardData, teamsData, sinistresData, terminesData] =
        await Promise.all([
          dashboardResponse.json(),
          teamsResponse.json(),
          sinistresResponse.json().catch(() => []),
          terminesResponse.json().catch(() => []),
        ]);

      setStats(dashboardData);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setRawSinistres(Array.isArray(sinistresData) ? sinistresData : []);
      setRawSinistresTermines(Array.isArray(terminesData) ? terminesData : []);
    } catch {
      setStats(null);
      setTeams([]);
      setRawSinistres([]);
      setRawSinistresTermines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // On dependency changes we refetch using current filter state
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

  // Ensure on first mount we load unfiltered data (restore legacy behavior)
  useEffect(() => {
    fetchDashboard(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const groupedTeams = teams.reduce((acc, row) => {
    if (!acc[row.team]) acc[row.team] = [];
    acc[row.team].push(row);
    return acc;
  }, {});

  const pieData = stats
    ? [
        { name: "En cours", value: stats.sinistres.en_cours, color: "#f97316" },
        { name: "Terminés", value: stats.sinistres.termines, color: "#22c55e" },
        {
          name: "Rejetés",
          value: stats.sinistres.rejetes || 0,
          color: "#ef4444",
        },
      ]
    : [];

  const barData =
    stats?.parCentre?.map((c) => ({
      centre: c.centre,
      total: c.total,
    })) || [];

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
    fetch("/api/data/monthly-trends")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setMonthlyTrends(
            data.map((d) => ({ mois: d.mois || d.month || d.label, sinistres: Number(d.sinistres || d.value || d.count) || 0 })),
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
      value: dateDebut || dateFin ? `${dateDebut || "..."} → ${dateFin || "..."}` : "Toutes",
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
  const rateCloture = totalSinistres > 0 ? Math.round((termines / totalSinistres) * 100) : 0;
  const rateRembourse = totalSoumis > 0 ? Math.round((totalRembourse / totalSoumis) * 100) : 0;

  const kpiCards = KPI_META.map((item) => {
    if (item.key === "total") {
      return { ...item, value: totalSinistres.toLocaleString(), meta: `dont ${totalRejetes.toLocaleString()} rejetés` };
    }
    if (item.key === "termines") {
      return { ...item, value: `${termines.toLocaleString()}`, meta: `Taux de clôture ${rateCloture}%` };
    }
    if (item.key === "enCours") {
      return { ...item, value: enCours.toLocaleString(), meta: `${stockEnCoursSummary.over10} dossiers >10 jours` };
    }
    return { ...item, value: `${rateCloture}%`, meta: `Remboursé ${rateRembourse}% des montants soumis` };
  });

  const exportExcel = () => {
    const data = teams.map((t) => ({
      Team: t.team,
      Agent: t.agent || "—",
      Centre: t.centre,
      "Provider claim 20days": t.provider_claim_20days
        ? t.provider_claim_20days.toFixed(2) + "%"
        : "—",
      "Nb_DB_Claim_treated-20d": t.nb_claim_treated_20d,
      "Nb_DB_Claim_treated-30d": t.nb_claim_treated_30d,
      Nb_DB_claims_treated: t.nb_claims_treated,
      Nb_DB_ligne_claims_treated: t.nb_ligne_claims_treated,
      Nb_Claims_SS: t.nb_claims_ss,
      NbligneClaims_SS: t.nb_ligne_claims_ss,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team Performance");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "DataFlow_Report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("CLAIMS ANALYSIS - Team Performance", 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          "Team",
          "Agent",
          "Provider 20d",
          "Treated-20d",
          "Treated-30d",
          "Claims treated",
          "Ligne treated",
          "Claims SS",
        ],
      ],
      body: teams.map((t) => [
        t.team,
        t.agent || "—",
        t.provider_claim_20days
          ? t.provider_claim_20days.toFixed(2) + "%"
          : "—",
        t.nb_claim_treated_20d,
        t.nb_claim_treated_30d,
        t.nb_claims_treated,
        t.nb_ligne_claims_treated,
        t.nb_claims_ss,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] },
    });

    doc.save("DataFlow_Report.pdf");
  };

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
        // If there is a 'mois' or 'month' column, use as monthly trends
        const first = rows[0];
        const keys = Object.keys(first).map((k) => k.toLowerCase());
        if (keys.includes("mois") || keys.includes("month") || keys.includes("label")) {
          setMonthlyTrends(
            rows.map((r) => ({
              mois: r.mois || r.month || r.label,
              sinistres: Number(r.sinistres || r.value || r.count) || 0,
            })),
          );
          setLastUpdated(new Date().toISOString());
        } else {
          // otherwise set as raw sinistres (best-effort)
          setRawSinistres(Array.isArray(rows) ? rows : []);
        }
      } catch (err) {
        console.error("Import parse error", err);
      }
    };
    reader.readAsArrayBuffer(file);
    // reset input
    e.target.value = "";
  };

  return (
    <div className={PAGE_WRAPPER}>
      <div className={`${PAGE_CONTAINER} max-w-[1600px]`}>
        <section className={PANEL_WRAPPER}>
          <div className={HERO_GRADIENT}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                  Dashboard analytique
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  CLAIMS ANALYSIS
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                  Vue consolidée des sinistres, des stocks par ancienneté et de
                  la performance des équipes.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/15 px-3 py-1 font-medium text-white/90">
                    {selectedCentreLabel}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 font-medium text-white/90">
                    {dateDebut || dateFin ? `${dateDebut || "..."} → ${dateFin || "..."}` : "Toutes les périodes"}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 font-medium text-white/90">
                    {marque === "Tout" ? "Toutes les marques" : marque}
                  </span>
                </div>
                <div className="mt-4 hidden flex-wrap gap-2 lg:flex">
                  {activeFilterChips.map((chip) => (
                    <span
                      key={chip.label}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90"
                    >
                      <span className="opacity-70">{chip.label}:</span> {chip.value}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <input id="import-file" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                <button
                  type="button"
                  onClick={() => document.getElementById('import-file').click()}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Importer données
                </button>
                <button
                  onClick={exportExcel}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-600"
                >
                  Export Excel
                </button>
                <button
                  onClick={exportPDF}
                  className={PRIMARY_BUTTON}
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-slate-50 p-6 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((item) => (
              <div key={item.label} className={`${KPI_CARD} min-h-[158px]`}>
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className={`text-3xl font-bold tracking-tight ${item.tone}`}>
                    {item.value}
                  </p>
                  <span className={`${METRIC_BADGE} ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.meta}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>Filtres</h2>
            <p className={PANEL_DESC}>
              Affinez la lecture du dashboard par centre, période et dimensions
              métier.
            </p>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 backdrop-blur sticky top-4 z-20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
                  >
                    <span className="mr-1 text-slate-400">{chip.label}</span>
                    {chip.value}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { resetDashboardFilters(); fetchDashboard(true); }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                >
                  Afficher tout
                </button>
                <button
                  type="button"
                  onClick={resetDashboardFilters}
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[linear-gradient(135deg,rgba(26,35,126,.10)_0%,rgba(244,177,131,.18)_100%)] p-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <div className={SECTION_SURFACE + " border-white/70 bg-white/75 p-4 backdrop-blur hover:bg-white/85"}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    Centres
                  </p>
                  <span className="text-xs text-slate-500">
                    Sélection multiple
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CENTRES.map((centre) => (
                    <button
                      key={centre}
                      onClick={() => toggleCentre(centre)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        centresSelectionnes.includes(centre)
                          ? "border-[#1a237e] bg-[#1a237e] text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {centre}
                    </button>
                  ))}
                </div>
              </div>

              <div className={SECTION_SURFACE + " border-white/70 bg-white/75 p-4 backdrop-blur hover:bg-white/85"}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    Période
                  </p>
                  <span className="text-xs text-slate-500">
                    Date de sinistre
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-xs font-medium text-slate-500">
                      Du
                    </span>
                    <input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className={INPUT_CLASS + " flex-1"}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-xs font-medium text-slate-500">
                      Au
                    </span>
                    <input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className={INPUT_CLASS + " flex-1"}
                    />
                  </div>
                </div>
              </div>

              <div className={SECTION_SURFACE + " border-white/70 bg-white/75 p-4 backdrop-blur hover:bg-white/85"}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    Réglages actifs
                  </p>
                  <span className="text-xs text-slate-500">
                    Lecture instantanée
                  </span>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Centre</span>
                    <span className="font-medium text-slate-800">
                      {selectedCentreLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Marque</span>
                    <span className="font-medium text-slate-800">{marque}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>Assureur</span>
                    <span className="font-medium text-slate-800">
                      {nomAssureur}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Marque
                </p>
                <select
                  value={marque}
                  onChange={(e) => setMarque(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option>Tout</option>
                  {filters.marques.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Nom assureur
                </p>
                <select
                  value={nomAssureur}
                  onChange={(e) => setNomAssureur(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option>Tout</option>
                  {filters.assureurs.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Team
                </p>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option>Tout</option>
                  {filters.teams.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Name_agent
                </p>
                <select
                  value={nameAgent}
                  onChange={(e) => setNameAgent(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option>Tout</option>
                  {filters.agents.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className={PANEL_WRAPPER}>
            <div className={PANEL_HEADER}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={PANEL_TITLE}>Stock des sinistres en cours</h2>
                  <p className={PANEL_DESC}>
                    Répartition par ancienneté, calculée depuis la date de
                    sinistre.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredRawSinistres.length} lignes
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">
                Chargement des données...
              </div>
            ) : filteredRawSinistres.length === 0 ? (
              <div className="p-6">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Aucun sinistre en cours sur ce périmètre
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Ajuste les filtres ou réinitialise la sélection pour revoir
                    les dossiers actifs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="grid gap-3 md:hidden">
                  <div className={INFO_CARD}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Sinistres en cours
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {stockEnCoursSummary.total} total
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {STOCK_BUCKETS.map((bucket) => (
                        <div
                          key={bucket.key}
                          className={`rounded-xl px-3 py-2 text-center text-[11px] font-semibold ${bucket.className}`}
                        >
                          <p>{bucket.label}</p>
                          <p className="mt-1 text-base">{stockEnCoursSummary[bucket.key]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className={TABLE_SHELL + " min-w-full text-xs"}>
                  <thead>
                    <tr>
                      <th className={TABLE_HEAD}>
                        Type
                      </th>
                      {STOCK_BUCKETS.map((bucket) => (
                        <th
                          key={bucket.key}
                          className={`border-l border-slate-200 px-4 py-3 text-center font-semibold min-w-[96px] ${bucket.className}`}
                        >
                          {bucket.labelShort || bucket.label}
                        </th>
                      ))}
                      <th className={TABLE_HEAD + " text-center"}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={TABLE_ROW + " bg-white"}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        Sinistres en cours
                      </td>
                      {STOCK_BUCKETS.map((bucket) => (
                        <td
                          key={bucket.key}
                          className={`border-l border-slate-100 px-4 py-3 text-center text-sm font-semibold min-w-[96px] ${bucket.className}`}
                        >
                          <span className="text-white font-bold text-lg">
                            {stockEnCoursSummary[bucket.key]}
                          </span>
                        </td>
                      ))}
                      <td className="border-l border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {stockEnCoursSummary.total}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-4 py-3 text-slate-700">Total</td>
                      {STOCK_BUCKETS.map((bucket) => (
                        <td
                          key={bucket.key}
                          className="border-l border-slate-100 px-4 py-3 text-center text-slate-800 min-w-[96px]"
                        >
                          {stockEnCoursSummary[bucket.key]}
                        </td>
                      ))}
                      <td className="border-l border-slate-100 px-4 py-3 text-center text-slate-900">
                        {stockEnCoursSummary.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </section>

          <section className={PANEL_WRAPPER}>
            <div className={PANEL_HEADER}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={PANEL_TITLE}>Stock des sinistres terminés</h2>
                  <p className={PANEL_DESC}>
                    Même lecture d'ancienneté pour garder une comparaison
                    homogène.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredRawSinistresTermines.length} lignes
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">
                Chargement des données...
              </div>
            ) : filteredRawSinistresTermines.length === 0 ? (
              <div className="p-6">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Aucun sinistre terminé sur ce périmètre
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Essaie une autre période ou élargis la sélection des centres.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="grid gap-3 md:hidden">
                  <div className={INFO_CARD}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Sinistres terminés
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {stockTerminesSummary.total} total
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {STOCK_BUCKETS.map((bucket) => (
                        <div
                          key={bucket.key}
                          className={`rounded-xl px-3 py-2 text-center text-[11px] font-semibold ${bucket.className}`}
                        >
                          <p>{bucket.label}</p>
                          <p className="mt-1 text-base">{stockTerminesSummary[bucket.key]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className={TABLE_SHELL + " min-w-full text-xs"}>
                  <thead>
                    <tr>
                      <th className={TABLE_HEAD}>
                        Type
                      </th>
                      {STOCK_BUCKETS.map((bucket) => (
                        <th
                          key={bucket.key}
                          className={`border-l border-slate-200 px-4 py-3 text-center font-semibold min-w-[96px] ${bucket.className}`}
                        >
                          {bucket.labelShort || bucket.label}
                        </th>
                      ))}
                      <th className={TABLE_HEAD + " text-center"}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={TABLE_ROW + " bg-white"}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        Sinistres terminés
                      </td>
                      {STOCK_BUCKETS.map((bucket) => (
                        <td
                          key={bucket.key}
                          className={`border-l border-slate-100 px-4 py-3 text-center text-sm font-semibold min-w-[96px] ${bucket.className}`}
                        >
                          <span className="text-white font-bold text-lg">
                            {stockTerminesSummary[bucket.key]}
                          </span>
                        </td>
                      ))}
                      <td className="border-l border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {stockTerminesSummary.total}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-4 py-3 text-slate-700">Total</td>
                      {STOCK_BUCKETS.map((bucket) => (
                        <td
                          key={bucket.key}
                          className="border-l border-slate-100 px-4 py-3 text-center text-slate-800"
                        >
                          {stockTerminesSummary[bucket.key]}
                        </td>
                      ))}
                      <td className="border-l border-slate-100 px-4 py-3 text-center text-slate-900">
                        {stockTerminesSummary.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Combined STOCK table (Insured / Provider / Total) similar to legacy view */}
        <section className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>STOCK</h2>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className={TABLE_SHELL + " min-w-full text-xs"}>
                <thead>
                  <tr>
                    <th className={TABLE_HEAD}>Type</th>
                    {STOCK_BUCKETS.map((bucket) => (
                      <th
                        key={bucket.key}
                        className={`border-l border-slate-200 px-4 py-3 text-center font-semibold min-w-[96px] ${bucket.className}`}
                      >
                        {bucket.labelShort || bucket.label}
                      </th>
                    ))}
                    <th className={TABLE_HEAD + " text-center"}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Insured / En cours */}
                  <tr className={TABLE_ROW}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">Sinistres en cours</td>
                    {STOCK_BUCKETS.map((bucket) => {
                      const v = stockEnCoursSummary[bucket.key];
                      return (
                        <td key={bucket.key} className={`border-l border-slate-100 px-4 py-3 text-center text-sm min-w-[96px] ${STOCK_BUCKET_LIGHT[bucket.key]}`}>
                          <span className="font-semibold text-slate-900">{v ? v : '—'}</span>
                        </td>
                      );
                    })}
                    <td className="border-l border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-900">{stockEnCoursSummary.total || 0}</td>
                  </tr>

                  {/* Provider / Terminés */}
                  <tr className={TABLE_ROW + " bg-slate-50 font-semibold"}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">Sinistres terminés</td>
                    {STOCK_BUCKETS.map((bucket) => {
                      const v = stockTerminesSummary[bucket.key];
                      return (
                        <td key={bucket.key} className={`border-l border-slate-100 px-4 py-3 text-center text-sm min-w-[96px] ${STOCK_BUCKET_LIGHT[bucket.key]}`}>
                          <span className="font-semibold text-slate-900">{v ? v : '—'}</span>
                        </td>
                      );
                    })}
                    <td className="border-l border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-900">{stockTerminesSummary.total || 0}</td>
                  </tr>

                  {/* Combined Total */}
                  <tr className={TABLE_ROW + " bg-white"}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">Total</td>
                    {STOCK_BUCKETS.map((bucket) => {
                      const v = (stockEnCoursSummary[bucket.key] || 0) + (stockTerminesSummary[bucket.key] || 0);
                      return (
                        <td key={bucket.key} className={`border-l border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-900 min-w-[96px] ${STOCK_BUCKET_LIGHT[bucket.key]}`}>
                          {v > 0 ? v : '—'}
                        </td>
                      );
                    })}
                    <td className="border-l border-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-900">{(stockEnCoursSummary.total || 0) + (stockTerminesSummary.total || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>Analyse</h2>
            <p className={PANEL_DESC}>
              Des graphiques plus lisibles, avec des cartes plus aérées et des
              repères visuels cohérents.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Montant soumis
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {totalSoumis.toLocaleString()} DT
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Montant remboursé
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {totalRembourse.toLocaleString()} DT
                </p>
              </div>
              <div className={INFO_CARD}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Taux de validation
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {tauxValidation}%
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className={INFO_CARD}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Répartition des sinistres
                    </p>
                    <p className="text-xs text-slate-500">
                      Lecture immédiate du cycle de traitement.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {totalSinistres} total
                  </span>
                </div>
                {pieData.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Aucun total à afficher
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Les filtres actuels ne renvoient pas encore de données.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString()} sinistres`,
                          name,
                        ]}
                        labelFormatter={(label) => `Segment: ${label}`}
                        cursor={{ fill: "rgba(26,35,126,0.06)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={28} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className={INFO_CARD}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Sinistres par centre
                    </p>
                    <p className="text-xs text-slate-500">
                      Comparaison consolidée par site.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {barData.length} centres
                  </span>
                </div>
                {barData.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Aucun centre à comparer
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Les données disponibles ne couvrent pas ce découpage.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={barData}
                      barSize={24}
                      margin={{ top: 12, right: 12, left: 0, bottom: 12 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="centre"
                        tick={{ fontSize: 11 }}
                        tickMargin={8}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString()} dossiers`,
                          name,
                        ]}
                        labelFormatter={(label) => `Centre: ${label}`}
                        cursor={{ fill: "rgba(26,35,126,0.06)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="#1a237e"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className={INFO_CARD}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Évolution mensuelle
                    </p>
                    <p className="text-xs text-slate-500">
                      Tendance simplifiée pour la lecture directionnelle.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      5 points
                    </span>
                    {lastUpdated && (
                      <span className="text-xs text-slate-400">Dernière mise à jour: {new Date(lastUpdated).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={monthlyTrends}
                    margin={{ top: 12, right: 12, left: 0, bottom: 12 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="mois"
                      tick={{ fontSize: 11 }}
                      tickMargin={8}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} dossiers`,
                        name,
                      ]}
                      labelFormatter={(label) => `Mois: ${label}`}
                      cursor={{ stroke: "rgba(26,35,126,0.15)", strokeWidth: 1 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sinistres"
                      stroke="#1a237e"
                      strokeWidth={3}
                      dot={{ fill: "#1a237e", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className={PANEL_WRAPPER}>
          <div className={PANEL_HEADER}>
            <h2 className={PANEL_TITLE}>Team performance</h2>
            <p className={PANEL_DESC}>
              Comparaison par équipe et par agent, avec une hiérarchie visuelle
              plus claire.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-3 md:hidden">
              {Object.entries(groupedTeams).map(([teamName, agents]) => {
                const validAgents = agents.filter((a) => a.provider_claim_20days);
                const teamTotal = {
                  provider_claim_20days:
                    validAgents.length > 0
                      ? validAgents.reduce((s, a) => s + a.provider_claim_20days, 0) /
                        validAgents.length
                      : null,
                  nb_claim_treated_20d: agents.reduce(
                    (s, a) => s + a.nb_claim_treated_20d,
                    0,
                  ),
                  nb_claim_treated_30d: agents.reduce(
                    (s, a) => s + a.nb_claim_treated_30d,
                    0,
                  ),
                  nb_claims_treated: agents.reduce((s, a) => s + a.nb_claims_treated, 0),
                  nb_ligne_claims_treated: agents.reduce(
                    (s, a) => s + a.nb_ligne_claims_treated,
                    0,
                  ),
                  nb_claims_ss: agents.reduce((s, a) => s + a.nb_claims_ss, 0),
                  nb_ligne_claims_ss: agents.reduce(
                    (s, a) => s + a.nb_ligne_claims_ss,
                    0,
                  ),
                };

                return (
                  <div key={teamName} className={INFO_CARD}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {teamName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {agents.length} agent{agents.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          teamTotal.provider_claim_20days >= 95
                            ? "bg-emerald-100 text-emerald-700"
                            : teamTotal.provider_claim_20days >= 80
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {teamTotal.provider_claim_20days
                          ? `${teamTotal.provider_claim_20days.toFixed(2)}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="text-slate-400">Treated 20d</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {teamTotal.nb_claim_treated_20d}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="text-slate-400">Treated 30d</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {teamTotal.nb_claim_treated_30d}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="text-slate-400">Claims traitées</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {teamTotal.nb_claims_treated}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="text-slate-400">Claims SS</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {teamTotal.nb_claims_ss}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className={TABLE_SHELL + " w-full text-xs"}>
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className={TABLE_HEAD}>
                    Team
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    provider claim_20days
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    Nb_DB_Claim_treated-20d
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    Nb_DB_Claim_treated-30d
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    Nb_DB_claims_treated
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    Nb_DB_ligne_claims_treated
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    Nb_Claims_SS
                  </th>
                  <th className={TABLE_HEAD + " text-center"}>
                    NbligneClaims_SS
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedTeams).map(([teamName, agents]) => {
                  const validAgents = agents.filter(
                    (a) => a.provider_claim_20days,
                  );
                  const teamTotal = {
                    provider_claim_20days:
                      validAgents.length > 0
                        ? validAgents.reduce(
                            (s, a) => s + a.provider_claim_20days,
                            0,
                          ) / validAgents.length
                        : null,
                    nb_claim_treated_20d: agents.reduce(
                      (s, a) => s + a.nb_claim_treated_20d,
                      0,
                    ),
                    nb_claim_treated_30d: agents.reduce(
                      (s, a) => s + a.nb_claim_treated_30d,
                      0,
                    ),
                    nb_claims_treated: agents.reduce(
                      (s, a) => s + a.nb_claims_treated,
                      0,
                    ),
                    nb_ligne_claims_treated: agents.reduce(
                      (s, a) => s + a.nb_ligne_claims_treated,
                      0,
                    ),
                    nb_claims_ss: agents.reduce(
                      (s, a) => s + a.nb_claims_ss,
                      0,
                    ),
                    nb_ligne_claims_ss: agents.reduce(
                      (s, a) => s + a.nb_ligne_claims_ss,
                      0,
                    ),
                  };
                  const hasAgents = agents.some((a) => a.agent);

                  return (
                    <React.Fragment key={teamName}>
                      <tr className="border-b border-slate-200 bg-slate-100 font-semibold transition-colors duration-200 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{teamName}</td>
                        <td
                          className={`px-4 py-3 text-center ${teamTotal.provider_claim_20days >= 95 ? "text-emerald-600" : teamTotal.provider_claim_20days >= 80 ? "text-amber-500" : "text-red-600"}`}
                        >
                          {teamTotal.provider_claim_20days
                            ? teamTotal.provider_claim_20days.toFixed(2) + "%"
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teamTotal.nb_claim_treated_20d}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teamTotal.nb_claim_treated_30d}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teamTotal.nb_claims_treated}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teamTotal.nb_ligne_claims_treated}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teamTotal.nb_claims_ss}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {teamTotal.nb_ligne_claims_ss}
                        </td>
                      </tr>
                      {hasAgents &&
                        agents
                          .filter((a) => a.agent)
                          .map((agent) => (
                            <tr
                              key={agent.agent}
                              className="border-b border-slate-100 bg-white transition-colors duration-200 hover:bg-slate-50"
                            >
                              <td className="px-8 py-2 text-slate-600">
                                {agent.agent}
                              </td>
                              <td
                                className={`px-4 py-2 text-center ${agent.provider_claim_20days >= 95 ? "text-emerald-600" : agent.provider_claim_20days >= 80 ? "text-amber-500" : "text-red-600"}`}
                              >
                                {agent.provider_claim_20days
                                  ? agent.provider_claim_20days.toFixed(2) + "%"
                                  : "—"}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {agent.nb_claim_treated_20d}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {agent.nb_claim_treated_30d}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {agent.nb_claims_treated}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {agent.nb_ligne_claims_treated}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {agent.nb_claims_ss}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {agent.nb_ligne_claims_ss}
                              </td>
                            </tr>
                          ))}
                    </React.Fragment>
                  );
                })}
                {teams.length > 0 && (
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold transition-colors duration-200 hover:bg-slate-50">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-center">
                      {teams.filter((t) => t.provider_claim_20days).length > 0
                        ? (
                            teams
                              .filter((t) => t.provider_claim_20days)
                              .reduce(
                                (s, t) => s + t.provider_claim_20days,
                                0,
                              ) /
                            teams.filter((t) => t.provider_claim_20days).length
                          ).toFixed(2) + "%"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teams.reduce((s, t) => s + t.nb_claim_treated_20d, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teams.reduce((s, t) => s + t.nb_claim_treated_30d, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teams.reduce((s, t) => s + t.nb_claims_treated, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teams.reduce((s, t) => s + t.nb_ligne_claims_treated, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teams.reduce((s, t) => s + t.nb_claims_ss, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {teams.reduce((s, t) => s + t.nb_ligne_claims_ss, 0)}
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
