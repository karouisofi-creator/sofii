import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  HERO_GRADIENT,
  PAGE_CONTAINER,
  PAGE_WRAPPER,
  PANEL_DESC,
  PANEL_HEADER,
  PANEL_TITLE,
  PANEL_WRAPPER,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SECTION_SURFACE,
} from "../../components/adminUi";

const INITIAL_SETTINGS = {
  maintenanceMode: false,
  emailNotifications: true,
  securityAlerts: true,
  autoSaveReports: true,
  aiAssistant: true,
};

const settingsGroups = [
  {
    title: "Général",
    description: "Paramètres visibles par toute l'organisation.",
    items: [
      {
        key: "maintenanceMode",
        label: "Mode maintenance",
        description: "Bloque temporairement l'accès aux utilisateurs non admin.",
      },
      {
        key: "autoSaveReports",
        label: "Sauvegarde automatique",
        description: "Enregistre automatiquement les rapports et filtres.",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Contrôle des alertes et des retours utilisateurs.",
    items: [
      {
        key: "emailNotifications",
        label: "Notifications e-mail",
        description: "Reçoit un résumé quotidien des activités clés.",
      },
      {
        key: "securityAlerts",
        label: "Alertes de sécurité",
        description: "Avertit en cas de tentative de connexion suspecte.",
      },
    ],
  },
  {
    title: "Assistant",
    description: "Réglages de l'aide intelligente dans le dashboard.",
    items: [
      {
        key: "aiAssistant",
        label: "Assistant IA",
        description: "Active les suggestions et réponses rapides dans le chat.",
      },
    ],
  },
];

function ToggleRow({ label, description, enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`${SECTION_SURFACE} flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:border-primary-200`}
    >
      <div>
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <span
        className={`flex h-8 w-14 items-center rounded-full p-1 transition-all duration-200 ease-out ${
          enabled ? "bg-primary-600 justify-end" : "bg-slate-300 justify-start"
        }`}
        aria-hidden="true"
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}

function buildOverview(settings) {
  return [
    {
      label: "Sécurité",
      value: settings.securityAlerts ? "Active" : "Réduite",
      tone: "from-blue-600 to-cyan-500",
    },
    {
      label: "Notifications",
      value: settings.emailNotifications ? "Envoi actif" : "En pause",
      tone: "from-emerald-600 to-green-500",
    },
    {
      label: "Assistant",
      value: settings.aiAssistant ? "Disponible" : "Désactivé",
      tone: "from-orange-600 to-amber-500",
    },
  ];
}

export default function AdminSettings() {
  const { apiFetch } = useAuth();
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch("/admin/settings");
        if (!res.ok) throw new Error("Impossible de charger les paramètres");
        const data = await res.json();
        setSettings({ ...INITIAL_SETTINGS, ...(data || {}) });
      } catch (err) {
        setError(err.message || "Erreur serveur");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [apiFetch]);

  const toggleSetting = (key) => {
    setMessage("");
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const overviewCards = useMemo(() => buildOverview(settings), [settings]);

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur de sauvegarde");
      setSettings({ ...INITIAL_SETTINGS, ...(data || {}) });
      setMessage("Paramètres sauvegardés avec succès.");
    } catch (err) {
      setError(err.message || "Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(INITIAL_SETTINGS);
    setMessage("Valeurs réinitialisées localement. Pense à sauvegarder.");
  };

  return (
    <div className={PAGE_WRAPPER}>
      <div className={`${PAGE_CONTAINER} max-w-[1400px]`}>
        <div className={PANEL_WRAPPER}>
          <div className={HERO_GRADIENT}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                  Administration
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Paramètres du dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80">
                  Centralisez les règles globales, les alertes et l'assistance
                  utilisateur dans une interface claire et rapide à parcourir.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetSettings}
                  className={SECONDARY_BUTTON}
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving || loading}
                  className={PRIMARY_BUTTON}
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder les changements"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
              >
                <div
                  className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${card.tone}`}
                />
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              {settingsGroups.map((group) => (
                <section
                  key={group.title}
                  className={PANEL_WRAPPER + " p-6 transition-all duration-200 ease-out hover:-translate-y-0.5"}
                >
                  <div className="mb-5">
                    <h2 className={PANEL_TITLE}>
                      {group.title}
                    </h2>
                    <p className={PANEL_DESC}>
                      {group.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <ToggleRow
                        key={item.key}
                        label={item.label}
                        description={item.description}
                        enabled={settings[item.key]}
                        onChange={() => toggleSetting(item.key)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5">
                <h2 className="text-xl font-bold text-slate-800">Accès rapide</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Quelques actions d'administration courantes.
                </p>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
                  >
                    <span className="block font-semibold text-slate-800">
                      Réinitialiser les filtres
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Revenir aux valeurs par défaut du dashboard.
                    </span>
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
                  >
                    <span className="block font-semibold text-slate-800">
                      Vérifier les logs
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Contrôler les dernières actions utilisateurs.
                    </span>
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
                  >
                    <span className="block font-semibold text-slate-800">
                      Gérer les utilisateurs
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Ouvrir la section d'administration des comptes.
                    </span>
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-[#1a237e] p-6 text-white shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                  Statut
                </p>
                <h2 className="mt-2 text-xl font-bold">Configuration actuelle</h2>
                <div className="mt-5 space-y-3 text-sm text-white/85">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span>Maintenance</span>
                    <span
                      className={
                        settings.maintenanceMode
                          ? "font-semibold text-amber-300"
                          : "font-semibold text-emerald-300"
                      }
                    >
                      {settings.maintenanceMode ? "Activée" : "Désactivée"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span>Alertes e-mail</span>
                    <span className="font-semibold text-emerald-300">
                      {settings.emailNotifications ? "Actives" : "Désactivées"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assistant IA</span>
                    <span className="font-semibold text-emerald-300">
                      {settings.aiAssistant ? "Disponible" : "Désactivé"}
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
