import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { query, getPool } from "../db.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

const router = express.Router();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeSqlString(value) {
  if (typeof value !== "string") return value;
  if (!/[ÃÂâ]/.test(value)) return value;
  const decoded = Buffer.from(value, "latin1").toString("utf8");
  return decoded.includes("�") ? value : decoded;
}

function normalizeSqlRow(row) {
  if (!row || typeof row !== "object") return row;
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, decodeSqlString(value)]),
  );
}

// ─────────────────────────────────────────────
//  BASE DE DONNÉES ICD (Soins + Maladies chroniques)
// ─────────────────────────────────────────────
const SOINS = [
  { cat: "Gastro-entérologie", soin: "Coloscopie", codes: "K635 / R197" },
  {
    cat: "Gastro-entérologie",
    soin: "Échographie abdominale",
    codes: "R104 / R102",
  },
  {
    cat: "Gynécologie",
    soin: "Consultation gynécologique",
    codes: "N94 / N95",
  },
  { cat: "Gynécologie", soin: "Échographie pelvienne", codes: "R102 / N832" },
  { cat: "Gynécologie", soin: "Frottis", codes: "R867" },
  { cat: "Gynécologie", soin: "Mammographie", codes: "N649 / C509" },
  { cat: "Urologie", soin: "Consultation urologue", codes: "N390 / R31" },
  { cat: "Urologie", soin: "ECBU / analyse urinaire", codes: "N390 / N30" },
  { cat: "Urologie", soin: "Scanner rénal", codes: "N200 / N23" },
  { cat: "Urologie", soin: "Échographie prostatique", codes: "N40 / C61" },
  {
    cat: "Endocrinologie",
    soin: "Consultation endocrinologue",
    codes: "E119 / E039 / E785",
  },
  { cat: "Endocrinologie", soin: "Bilan hormonal", codes: "E349" },
  { cat: "Endocrinologie", soin: "Bilan diabète / HbA1c", codes: "E119" },
  { cat: "Endocrinologie", soin: "Bilan thyroïdien", codes: "E039" },
  {
    cat: "Rhumatologie",
    soin: "Consultation rhumatologue",
    codes: "M199 / M545 / M542",
  },
  { cat: "Rhumatologie", soin: "Infiltration articulaire", codes: "M255" },
  {
    cat: "Rhumatologie",
    soin: "IRM rachis / articulations",
    codes: "M545 / M542 / M255",
  },
  {
    cat: "Dermatologie",
    soin: "Consultation dermatologue",
    codes: "L709 / L309 / L409",
  },
  { cat: "Dermatologie", soin: "Biopsie cutanée", codes: "L989" },
  {
    cat: "Dermatologie",
    soin: "Traitement dermatologique",
    codes: "L50 / T784",
  },
  {
    cat: "Allergologie",
    soin: "Consultation allergologue",
    codes: "J309 / T784",
  },
  { cat: "Allergologie", soin: "Tests allergiques", codes: "T784 / L50" },
  {
    cat: "Pneumologie",
    soin: "Consultation pneumologue",
    codes: "J459 / J40 / R05",
  },
  { cat: "Pneumologie", soin: "Radio thorax", codes: "R079 / J18" },
  {
    cat: "Pneumologie",
    soin: "Exploration fonctionnelle respiratoire",
    codes: "J459 / J46",
  },
  { cat: "Pneumologie", soin: "Test sommeil / apnée", codes: "G473 / G479" },
  {
    cat: "Neurologie",
    soin: "Consultation neurologue",
    codes: "G439 / G409 / R51",
  },
  { cat: "Neurologie", soin: "EEG", codes: "G409 / R56" },
  { cat: "Neurologie", soin: "IRM cérébrale", codes: "R51 / G43" },
  { cat: "Psychiatrie", soin: "Consultation psychiatre", codes: "F419 / F329" },
  { cat: "Psychiatrie", soin: "Consultation psychologue", codes: "F419 / F51" },
  {
    cat: "Psychiatrie",
    soin: "Thérapie comportementale",
    codes: "F329 / F339",
  },
  { cat: "Paramédical", soin: "Physiothérapie", codes: "M545 / M542" },
  {
    cat: "Paramédical",
    soin: "Chiropractie / ostéopathie",
    codes: "M542 / M509",
  },
  { cat: "Paramédical", soin: "Kinésithérapie", codes: "M255 / M190" },
  { cat: "Paramédical", soin: "Orthophonie", codes: "F809" },
  {
    cat: "Paramédical",
    soin: "Podologie / pédicurie médicale",
    codes: "L600 / B351",
  },
  { cat: "Imagerie médicale", soin: "Imagerie thorax", codes: "R079 / I20" },
  { cat: "Imagerie médicale", soin: "Imagerie cérébrale", codes: "R51 / G43" },
  {
    cat: "Imagerie médicale",
    soin: "Imagerie rachis cervical / lombaire",
    codes: "M542 / M545",
  },
  {
    cat: "Imagerie médicale",
    soin: "Imagerie abdominale / pelvienne",
    codes: "R109 / R102",
  },
  {
    cat: "Imagerie médicale",
    soin: "Imagerie Doppler / vasculaire",
    codes: "I809 / I289",
  },
  {
    cat: "Imagerie médicale",
    soin: "IRM membre supérieur / inférieur",
    codes: "M255 / M19",
  },
  {
    cat: "Examens laboratoire",
    soin: "Bilan sanguin général",
    codes: "R53 / D649",
  },
  { cat: "Examens laboratoire", soin: "Glycémie / HbA1c", codes: "E119" },
  { cat: "Examens laboratoire", soin: "Bilan lipidique", codes: "E785" },
  { cat: "Examens laboratoire", soin: "Bilan thyroïdien", codes: "E039" },
  { cat: "Examens laboratoire", soin: "Analyse d'urines", codes: "N390" },
  { cat: "Prévention", soin: "Vaccination", codes: "Z23 / B349" },
  { cat: "Pédiatrie", soin: "Consultation pédiatrique", codes: "R509 / B349" },
  { cat: "Pédiatrie", soin: "Bilan pédiatrique", codes: "J06 / R509" },
  { cat: "Oncologie", soin: "Consultation oncologue", codes: "C801" },
  { cat: "Oncologie", soin: "Chimiothérapie", codes: "C801" },
  { cat: "Oncologie", soin: "Mammographie oncologique", codes: "C509" },
  { cat: "Oncologie", soin: "Biopsie / suivi cancer", codes: "C801" },
  { cat: "Néphrologie", soin: "Consultation néphrologue", codes: "N189 / N19" },
  { cat: "Néphrologie", soin: "Dialyse", codes: "N189 / N19" },
  {
    cat: "Hématologie",
    soin: "Numération formule sanguine",
    codes: "D64 / D72",
  },
  {
    cat: "Médecine générale",
    soin: "Consultation médecin généraliste",
    codes: "R53 / R50 / R52",
  },
  {
    cat: "Chirurgie générale",
    soin: "Petite chirurgie / exérèse",
    codes: "T149 / L98",
  },
  {
    cat: "Soins à domicile",
    soin: "Soins infirmiers à domicile",
    codes: "R53 / N390",
  },
  { cat: "Gériatrie", soin: "Consultation gériatrique", codes: "R54 / F03" },
  {
    cat: "Radiothérapie",
    soin: "Séance radiothérapie",
    codes: "C509 / C61 / C801",
  },
];

const MALADIES = [
  {
    maladie: "Diabète type 2",
    medicaments: "Metformine, Gliclazide, Glucophage",
    icd: "E119",
  },
  {
    maladie: "Diabète type 1",
    medicaments: "Insuline rapide, Insuline basale",
    icd: "E109",
  },
  {
    maladie: "Hypertension artérielle",
    medicaments: "Amlodipine, Ramipril, Losartan",
    icd: "I10",
  },
  {
    maladie: "Dyslipidémie",
    medicaments: "Atorvastatine, Rosuvastatine, Simvastatine",
    icd: "E785",
  },
  {
    maladie: "Asthme chronique",
    medicaments: "Salbutamol, Budésonide, Formotérol",
    icd: "J45",
  },
  {
    maladie: "BPCO",
    medicaments: "Tiotropium, Salbutamol, Budésonide",
    icd: "J44",
  },
  {
    maladie: "Insuffisance cardiaque chronique",
    medicaments: "Bisoprolol, Ramipril, Furosémide",
    icd: "I50",
  },
  {
    maladie: "Cardiopathie ischémique",
    medicaments: "Aspirine, Clopidogrel, Atorvastatine",
    icd: "I25",
  },
  {
    maladie: "Fibrillation auriculaire",
    medicaments: "Apixaban, Warfarine, Bisoprolol",
    icd: "I48",
  },
  {
    maladie: "Maladie rénale chronique",
    medicaments: "Époétine alfa, Sevelamer, Furosémide",
    icd: "N18",
  },
  {
    maladie: "Arthrose",
    medicaments: "Paracétamol, Ibuprofène, Diclofénac",
    icd: "M19",
  },
  {
    maladie: "Polyarthrite rhumatoïde",
    medicaments: "Méthotrexate, Adalimumab, Prednisone",
    icd: "M06",
  },
  {
    maladie: "Ostéoporose",
    medicaments: "Alendronate, Calcium + Vitamine D",
    icd: "M81",
  },
  { maladie: "Hypothyroïdie", medicaments: "Lévothyroxine", icd: "E03" },
  {
    maladie: "Hyperthyroïdie",
    medicaments: "Carbimazole, Propylthiouracile",
    icd: "E05",
  },
  {
    maladie: "Épilepsie",
    medicaments: "Valproate, Levetiracétam, Carbamazépine",
    icd: "G40",
  },
  {
    maladie: "Migraine chronique",
    medicaments: "Sumatriptan, Propranolol, Topiramate",
    icd: "G43",
  },
  {
    maladie: "Hépatite chronique B",
    medicaments: "Tenofovir, Entecavir, Lamivudine",
    icd: "B18",
  },
  {
    maladie: "Dépression chronique",
    medicaments: "Sertraline, Fluoxétine, Escitalopram",
    icd: "F33",
  },
  {
    maladie: "Trouble bipolaire",
    medicaments: "Lithium, Quétiapine, Valproate",
    icd: "F31",
  },
  {
    maladie: "Schizophrénie",
    medicaments: "Olanzapine, Rispéridone, Clozapine",
    icd: "F20",
  },
  {
    maladie: "Maladie de Parkinson",
    medicaments: "Lévodopa, Pramipexole, Rasagiline",
    icd: "G20",
  },
  {
    maladie: "Alzheimer",
    medicaments: "Donepezil, Mémantine, Rivastigmine",
    icd: "G30",
  },
  {
    maladie: "Sclérose en plaques",
    medicaments: "Interféron bêta, Fingolimod, Ocrelizumab",
    icd: "G35",
  },
  {
    maladie: "Lupus érythémateux systémique",
    medicaments: "Hydroxychloroquine, Prednisone",
    icd: "M32",
  },
  {
    maladie: "Goutte chronique",
    medicaments: "Allopurinol, Colchicine, Fébuxostat",
    icd: "M10",
  },
  {
    maladie: "Psoriasis chronique",
    medicaments: "Méthotrexate, Ustékinumab, Acitrétine",
    icd: "L40",
  },
];

// ─────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────
function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchAll(question) {
  const nq = norm(question);
  const codes = question.toUpperCase().match(/[A-Z]\d{2,4}/g) || [];

  const soins = SOINS.filter((r) => {
    if (codes.some((c) => r.codes.toUpperCase().includes(c))) return true;
    return norm(r.cat).includes(nq) || norm(r.soin).includes(nq);
  });

  const maladies = MALADIES.filter((r) => {
    if (codes.some((c) => r.icd.toUpperCase().includes(c))) return true;
    return norm(r.maladie).includes(nq) || norm(r.medicaments).includes(nq);
  });

  return { soins, maladies };
}

function buildReply(question) {
  const q = String(question ?? "").trim();
  if (!q) return "Veuillez saisir une question.";

  const { soins, maladies } = searchAll(q);

  if (!soins.length && !maladies.length) {
    return (
      `❌ Aucun résultat pour <strong>${escapeHtml(q)}</strong>.<br/><br/>` +
      `Essayez :<br/>` +
      `• Code ICD : <em>K029</em>, <em>I10</em>, <em>M255</em>…<br/>` +
      `• Spécialité : <em>Cardiologie</em>, <em>Neurologie</em>…<br/>` +
      `• Soin : <em>ECG</em>, <em>Mammographie</em>, <em>Dialyse</em>…`
    );
  }

  let html = `✅ Résultats pour <strong>${escapeHtml(q)}</strong> :<br/><br/>`;

  if (soins.length) {
    html += `<strong>📋 Soins / Actes (${soins.length})</strong><br/>`;
    soins.slice(0, 6).forEach((r) => {
      html += `• [${escapeHtml(r.cat)}] ${escapeHtml(r.soin)} → <code>${escapeHtml(r.codes)}</code><br/>`;
    });
    if (soins.length > 6)
      html += `<em>… et ${soins.length - 6} autre(s)</em><br/>`;
    html += "<br/>";
  }

  if (maladies.length) {
    html += `<strong>🏥 Maladies chroniques (${maladies.length})</strong><br/>`;
    maladies.slice(0, 4).forEach((r) => {
      html += `• ${escapeHtml(r.maladie)} → <code>${escapeHtml(r.icd)}</code><br/>`;
      html += `&nbsp;&nbsp;💊 ${escapeHtml(r.medicaments)}<br/>`;
    });
  }

  return html;
}

// ─────────────────────────────────────────────
//  FONCTION GROQ API
// ─────────────────────────────────────────────
async function callGroqAPI(userMessage, allowNonMedical = false) {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    console.log("⚠️ GROQ_API_KEY non trouvée dans .env");
    return null;
  }

  const requestedModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const modelsToTry = [
    requestedModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  console.log(
    "📡 Appel à Groq API pour:",
    userMessage.substring(0, 50),
    "allowNonMedical:",
    allowNonMedical,
  );

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          messages: [
            {
              role: "system",
              content: allowNonMedical
                ? "You are a helpful assistant. Answer concisely in French. If the user asks for medical advice, give general informational guidance and recommend consulting a professional."
                : "You are a medical-only assistant. Answer only about medications, treatments, and medical references. If the user asks anything outside medical topics, politely refuse and say you only handle medical queries. Always be cautious: do not provide prescriptions, only general informational guidance and references. Answer in French unless the user explicitly asks otherwise.",
            },
            { role: "user", content: userMessage },
          ],
          model,
          temperature: 0.2,
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        },
      );

      const reply = response.data.choices[0].message.content;
      console.log("✅ Réponse Groq reçue (model:", model + ")");
      return reply;
    } catch (error) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Unknown Groq error";
      const status = error.response?.status;
      const modelIssue =
        status === 404 ||
        /decommissioned|no longer supported|model.*not found/i.test(msg);

      // On timeout or transient network errors, try the next model instead of bailing out.
      const isTimeout = error.code === "ETIMEDOUT" || /timeout/i.test(msg);
      if (modelIssue) {
        console.warn(
          `⚠️ Modèle Groq indisponible (${model}), tentative suivante...`,
        );
        continue;
      }

      if (isTimeout) {
        console.warn(
          `⚠️ Groq request timed out for model ${model}, trying next model...`,
        );
        continue;
      }

      console.error("❌ Erreur Groq:", msg);
      try {
        console.error(
          "❌ Erreur (full):",
          JSON.stringify(error, Object.getOwnPropertyNames(error)),
        );
      } catch (e) {
        console.error("❌ Erreur (string):", String(error));
      }
      return null;
    }
  }

  console.error("❌ Aucun modèle Groq disponible.");
  return null;
}

// -----------------------
// Local KB loader + search
// -----------------------
let LOCAL_KB_CACHE = null;

function loadLocalKB() {
  if (LOCAL_KB_CACHE) return LOCAL_KB_CACHE;

  let dataDir;
  try {
    dataDir = path.resolve(new URL("..", import.meta.url).pathname, "../data");
  } catch (e) {
    dataDir = path.join(process.cwd(), "data");
  }
  const kb = { name: null, columns: [], rows: [], medications: [] };

  try {
    const jsonPath = path.join(process.cwd(), "data", "knowledge.json");
    const csvPath = path.join(process.cwd(), "data", "knowledge.csv");
    const xlsxPath = path.join(process.cwd(), "data", "knowledge.xlsx");

    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rows)) {
        kb.name = parsed.name || "knowledge.json";
        kb.columns = parsed.columns || [];
        kb.rows = parsed.rows;
        if (
          kb.rows.length &&
          (kb.columns.includes("Name") ||
            kb.columns.includes("GenericName") ||
            Object.keys(kb.rows[0] || {}).some((k) =>
              ["Name", "GenericName"].includes(k),
            ))
        ) {
          kb.medications = kb.rows;
        }
      }
    }

    if (fs.existsSync(csvPath)) {
      const workbook = xlsx.readFile(csvPath, { raw: false });
      const sheetName = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: null,
      });
      const headers = rows.length ? Object.keys(rows[0]) : [];
      kb.name = "knowledge.csv";
      kb.columns = headers;
      kb.rows = rows;
      if (headers.includes("Name") || headers.includes("GenericName")) {
        kb.medications = rows;
      }
    }

    if (fs.existsSync(xlsxPath)) {
      const wb = xlsx.readFile(xlsxPath);
      const rows = [];
      wb.SheetNames.forEach((sn) => {
        const sheet = xlsx.utils.sheet_to_json(wb.Sheets[sn], { defval: null });
        sheet.forEach((r) => {
          r.__sheet = sn;
          rows.push(r);
        });
      });
      kb.name = "knowledge.xlsx";
      kb.columns = rows.length ? Object.keys(rows[0]) : [];
      kb.rows = rows;
      if (
        kb.columns.includes("Name") ||
        kb.columns.includes("GenericName") ||
        (rows[0] && ("Name" in rows[0] || "GenericName" in rows[0]))
      ) {
        kb.medications = rows;
      }
    }

    // Medications CSV/XLSX loading removed (CSV import disabled).
  } catch (e) {
    console.error("Erreur chargement KB local:", e.message);
  }

  LOCAL_KB_CACHE = kb;
  return kb;
}

function normText(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const SQL_MED_TABLE = "dbo.Medicaments";
const SQL_ICD_TABLE = "dbo.ICD10";
const SQL_DISEASE_TABLE = "dbo.MaladieChronique";

function sqlSearchPattern(question) {
  const text = String(question ?? "").trim();
  if (!text) return "%";
  return `%${text.replace(/%/g, "[%]").replace(/_/g, "[_]")}%`;
}

async function searchSqlMedicaments(question, limit = 5) {
  const search = sqlSearchPattern(question);
  const exact = search;
  const sql = `SELECT TOP (${limit}) Id, Nom, PrincipeActif, Indications, Posologie, EffetsSecondaires, ContreIndications FROM ${SQL_MED_TABLE} WHERE Nom LIKE @search OR PrincipeActif LIKE @search OR Indications LIKE @search OR Posologie LIKE @search OR EffetsSecondaires LIKE @search OR ContreIndications LIKE @search ORDER BY CASE WHEN Nom LIKE @exact THEN 0 ELSE 1 END, Nom`;
  try {
    const result = await query(sql, { search, exact });
    return (result.recordset || []).map((row) => ({
      type: "medication",
      data: row,
      score: 0,
    }));
  } catch (error) {
    console.warn("⚠ SQL medication search failed:", error.message || error);
    return [];
  }
}

async function searchSqlKnowledge(question, limit = 8) {
  const search = sqlSearchPattern(question);
  const exact = search;
  // fallback token: use first 3 letters from original question (keep accents)
  const raw = String(question || "").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  const tokenFrag = raw.slice(0, 3) || raw;
  const token = tokenFrag ? `%${tokenFrag}%` : search;
  // Use minimal column sets to avoid ODBC driver descriptor issues
  const medSql = `SELECT TOP (${limit}) Id, Nom, PrincipeActif FROM ${SQL_MED_TABLE} WHERE Nom LIKE @search OR PrincipeActif LIKE @search OR Indications LIKE @search OR Posologie LIKE @search OR EffetsSecondaires LIKE @search OR ContreIndications LIKE @search OR Nom LIKE @token OR PrincipeActif LIKE @token ORDER BY Nom`;
  const icdSql = `SELECT TOP (${limit}) Id, Category, Care, ICDCode FROM ${SQL_ICD_TABLE} WHERE Category LIKE @search OR Care LIKE @search OR ICDCode LIKE @search OR Category LIKE @token OR Care LIKE @token ORDER BY Category`;
  const diseaseSql = `SELECT TOP (${limit}) Id, Maladie, Medicaments, ICD10 FROM ${SQL_DISEASE_TABLE} WHERE Maladie LIKE @search OR Medicaments LIKE @search OR ICD10 LIKE @search OR Maladie LIKE @token OR Medicaments LIKE @token ORDER BY Maladie`;

  try {
    // Use escaped literals for LIKE to avoid ODBC bind issues on some drivers
    function esc(v) {
      return String(v || "").replace(/'/g, "''");
    }
    const safeSearch = esc(search);
    const safeExact = esc(exact);
    const safeToken = esc(token);

    const medSqlLit = medSql
      .replace(/@search/g, `'${safeSearch}'`)
      .replace(/@exact/g, `'${safeExact}'`)
      .replace(/@token/g, `'${safeToken}'`);
    const icdSqlLit = icdSql
      .replace(/@search/g, `'${safeSearch}'`)
      .replace(/@exact/g, `'${safeExact}'`)
      .replace(/@token/g, `'${safeToken}'`);
    const diseaseSqlLit = diseaseSql
      .replace(/@search/g, `'${safeSearch}'`)
      .replace(/@exact/g, `'${safeExact}'`)
      .replace(/@token/g, `'${safeToken}'`);

    function normalizeSqlRow(row) {
      if (!row || typeof row !== "object") return row;
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          if (typeof value !== "string") return [key, value];
          const decoded = Buffer.from(value, "latin1").toString("utf8");
          return [key, decoded.includes("�") ? value : decoded];
        }),
      );
    }

    async function runLitQuery(sqlLit, label) {
      const conn = await getPool();
      try {
        const rows = await conn.query(sqlLit);
        return { recordset: (rows || []).map(normalizeSqlRow) };
      } catch (error) {
        console.warn(
          `⚠ Direct ODBC query failed for ${label}:`,
          error.message || error,
        );
        return { recordset: [] };
      } finally {
        try {
          await conn.close();
        } catch (ee) {
          /* ignore */
        }
      }
    }

    const [medResult, icdResult, diseaseResult] = await Promise.all([
      runLitQuery(medSqlLit, "med"),
      runLitQuery(icdSqlLit, "icd"),
      runLitQuery(diseaseSqlLit, "disease"),
    ]);

    const medRows = (medResult.recordset || []).map((r) => ({
      ...r,
      SourceType: "medication",
      SourceTable: SQL_MED_TABLE,
    }));
    const icdRows = (icdResult.recordset || []).map((r) => ({
      ...r,
      SourceType: "icd",
      SourceTable: SQL_ICD_TABLE,
    }));
    const diseaseRows = (diseaseResult.recordset || []).map((r) => ({
      ...r,
      SourceType: "disease",
      SourceTable: SQL_DISEASE_TABLE,
    }));

    const combined = [...medRows, ...icdRows, ...diseaseRows];

    return combined.map((row) => ({
      type: row.SourceType === "medication" ? "medication" : "kb",
      data: row,
      score: 0,
    }));
  } catch (error) {
    console.warn("⚠ SQL knowledge search failed:", error.message || error);
    return [];
  }
}

const MEDICATION_ALIASES = {
  panadole: "paracetamol",
  panadol: "paracetamol",
  doliprane: "paracetamol",
  dafalgan: "paracetamol",
  acetaminophene: "paracetamol",
  brufen: "ibuprofen",
  advil: "ibuprofen",
  depakine: "valproate",
  depakin: "valproate",
};

function canonicalMedicationToken(token) {
  const t = normText(token).trim();
  return MEDICATION_ALIASES[t] || t;
}

function searchLocalKB(question, limit = 5) {
  const kb = loadLocalKB();
  const q = normText(question);
  const tokens = q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const canonicalTokens = tokens.map(canonicalMedicationToken);
  const results = [];

  // search generic KB rows and classify medication rows when possible
  if (kb.rows && kb.rows.length) {
    const scored = kb.rows.map((r) => {
      const hay = Object.values(r).join(" ");
      const text = normText(hay);
      const score = q
        .split(" ")
        .reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
      const itemType = r.Name || r.GenericName ? "medication" : "kb";
      return { item: r, score, type: itemType };
    });
    scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .forEach((s) =>
        results.push({ type: s.type, data: s.item, score: s.score }),
      );
  }

  // search medications
  if (kb.medications && kb.medications.length) {
    const mscored = kb.medications.map((m) => {
      const hay = [
        m.Name,
        m.GenericName,
        m.Indications,
        m.SideEffects,
        m.Notes,
        m.Contraindications,
        m.Dosage,
        m.Route,
      ]
        .filter(Boolean)
        .join(" ");
      const text = normText(hay);
      const name = normText(m.Name);
      const generic = normText(m.GenericName);
      let score = 0;

      canonicalTokens.forEach((t) => {
        if (!t) return;
        if (t === name || t === generic) score += 4;
        else if (name.includes(t) || generic.includes(t)) score += 3;
        else if (text.includes(t)) score += 1;
      });

      // extra boost for exact medication queries
      if (canonicalTokens.length === 1) {
        const t = canonicalTokens[0];
        if (name.includes(t) || generic.includes(t)) score += 2;
      }

      return { med: m, score };
    });
    mscored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .forEach((s) =>
        results.push({ type: "medication", data: s.med, score: s.score }),
      );
  }

  const uniqueResults = [];
  const seenKeys = new Set();
  results.forEach((result) => {
    const data = result.data || {};
    const name = normText(
      data.Name ||
        data.GenericName ||
        data["Soin / Acte"] ||
        data.Soins ||
        JSON.stringify(data),
    );
    const key = `${result.type}:${name}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueResults.push(result);
    }
  });

  return uniqueResults.slice(0, limit);
}

// -----------------------
// Templates loader
// -----------------------
let TEMPLATES_CACHE = null;
function loadTemplates() {
  if (TEMPLATES_CACHE) return TEMPLATES_CACHE;
  const tplPath = path.join(
    process.cwd(),
    "server",
    "templates",
    "response_templates.json",
  );
  let tpl = {
    system:
      "You are a medical-only assistant. Answer only about medications, treatments, and medical references. If the user asks anything outside medical topics, politely refuse and say you only handle medical queries. Always be cautious: do not provide prescriptions, only general informational guidance and references. Answer in French unless the user explicitly asks otherwise.",
    groqUserTemplate:
      "Context:\n{context}\n\nQuestion:\n{question}\n\nProvide a concise answer in French and cite the numbered references when relevant. If you cannot find a matching reference, say you have no reference.",
    medReplyTemplate:
      "Médicament: {name}\nPrincipe actif: {activeIngredient}\nIndications: {indications}\nPosologie: {dosage}\nEffets indésirables: {sideEffects}\nContre-indications: {contraindications}\nAutres: {notes}\n",
  };

  try {
    if (fs.existsSync(tplPath)) {
      const raw = fs.readFileSync(tplPath, "utf8");
      const parsed = JSON.parse(raw);
      tpl = { ...tpl, ...parsed };
    }
  } catch (e) {
    console.error("Erreur chargement templates:", e.message);
  }

  TEMPLATES_CACHE = tpl;
  return tpl;
}

// Build combined HTML and sources list from local matches and Groq reply
function buildCombinedResponse({
  matches = [],
  groqReply = null,
  medHtml = null,
  sourceLabel = "Base Vidal intégrée",
  sourceType = "vidal",
}) {
  const sources = [];
  let html = "";

  if (matches && matches.length) {
    const kbItems = matches.map((m, i) => {
      const d = m.data || {};
      const title =
        m.type === "medication"
          ? d.Nom || d.Name || d.GenericName || d.PrincipeActif || "(unknown)"
          : d["Soin / Acte"] ||
            d.Soins ||
            d.maladie ||
            Object.values(d)[0] ||
            "résultat";
      const snippet =
        m.type === "medication"
          ? d.Indications ||
            d.Posologie ||
            d.EffetsSecondaires ||
            d.ContreIndications ||
            ""
          : Object.values(d).slice(0, 2).join(" | ");
      return { id: i + 1, type: m.type, title, snippet, raw: d };
    });

    sources.push({
      type: sourceType,
      label: sourceLabel,
      items: kbItems,
    });
  }

  if (groqReply) {
    sources.push({
      type: "groq",
      label: "Connaissance médicale externe (Groq)",
      items: [
        {
          title: "Réponse Groq",
          snippet: String(groqReply || ""),
        },
      ],
    });
  }

  if (medHtml) html += medHtml + "<br/>";

  if (groqReply) {
    html +=
      `<div class="groq-card" style="border:1px solid #cfe9ff;padding:12px;border-radius:10px;background:#f6fbff;max-width:640px;font-family:Arial,Helvetica,sans-serif;margin-top:8px;">` +
      `<div style="font-size:13px;color:#065f46;margin-bottom:6px"><strong>Source: Connaissance médicale externe (Groq)</strong></div>` +
      `<div style="font-size:14px;color:#0b1220">${escapeHtml(String(groqReply)).replace(/\n/g, "<br/>")}</div>` +
      `</div>`;
  }

  if (matches && matches.length) {
    html += `<div style="margin-top:8px;font-size:13px;color:#6b7280"><strong>Références locales:</strong><ul>`;
    matches.slice(0, 6).forEach((m, i) => {
      const d = m.data || {};
      const title =
        m.type === "medication"
          ? d.Nom || d.Name || d.GenericName || d.PrincipeActif || "(unknown)"
          : d["Soin / Acte"] ||
            d.Soins ||
            d.maladie ||
            Object.values(d)[0] ||
            "résultat";
      const snippet =
        m.type === "medication"
          ? d.Indications ||
            d.Posologie ||
            d.EffetsSecondaires ||
            d.ContreIndications ||
            ""
          : Object.values(d).slice(0, 2).join(" | ");
      html += `<li>[${i + 1}] ${escapeHtml(String(title))}${snippet ? " — " + escapeHtml(String(snippet)) : ""}</li>`;
    });
    html += `</ul></div>`;
  }

  return { combinedHtml: html, sources };
}

function formatDatasetLabel(key) {
  const labels = {
    Nom: "Nom",
    Name: "Nom",
    GenericName: "Principe actif",
    PrincipeActif: "Principe actif",
    Indications: "Indications",
    Posologie: "Posologie",
    EffetsSecondaires: "Effets indésirables",
    ContreIndications: "Contre-indications",
    ContreIndications: "Contre-indications",
    Category: "Catégorie",
    Care: "Soin / Acte",
    ICDCode: "Code ICD",
    Maladie: "Maladie",
    Medicaments: "Médicaments",
    ICD10: "Code ICD-10",
    "Soin / Acte": "Soin / Acte",
    "ICD à utiliser": "Code ICD",
  };
  return (
    labels[key] ||
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .replace(/_/g, " ")
  );
}

function buildMedicationHtml(data) {
  if (!data || typeof data !== "object") return null;
  const hiddenFields = new Set(["Id", "SourceType", "SourceTable"]);
  const rows = Object.entries(data)
    .filter(
      ([key, value]) =>
        !hiddenFields.has(key) &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== "",
    )
    .map(
      ([key, value]) =>
        `<div style="font-size:13px;margin-bottom:6px"><strong style="display:inline-block;width:140px;color:#0b1220">${escapeHtml(
          formatDatasetLabel(key),
        )}:</strong> ${escapeHtml(String(value))}</div>`,
    )
    .join("");

  if (!rows) return null;

  return (
    `<div class="med-card" style="border:1px solid #e6e9ee;padding:12px;border-radius:10px;background:#ffffff;max-width:520px;font-family:Arial,Helvetica,sans-serif;">` +
    rows +
    `</div>`
  );
}

function buildGenericSqlResponse({ matches, sourceLabel, sourceType }) {
  const first = matches?.[0]?.data || {};
  const replyText =
    Object.entries(first)
      .filter(
        ([, value]) =>
          value !== null && value !== undefined && String(value).trim() !== "",
      )
      .map(
        ([key, value]) => `${formatDatasetLabel(key)}: ${String(value).trim()}`,
      )
      .join(" | ") || "Résultat trouvé dans la base SQL interne.";

  const combined = buildCombinedResponse({
    matches,
    groqReply: null,
    medHtml: null,
    sourceLabel,
    sourceType,
  });

  return {
    reply: replyText,
    source: sourceType,
    refs: matches,
    med: null,
    medHtml: null,
    combinedHtml: combined.combinedHtml,
    sources: combined.sources,
  };
}

function isMedicationRequest(question, matches = []) {
  const text = normText(question);
  if (!text) return false;
  if (matches.some((m) => m.type === "medication")) return true;

  return (
    /\b(medic|medicament|médicament|traitement|dose|dosage|posologie|prescription|ordonnance|effet|effets|contre-indication|indication|drug|tablet|capsule|pill|sirop|antibiot|analges|aspirin|aspirine|paracetamol|panadol|panadole|doliprane|dafalgan|ibuprofene|ibuprofen|omeprazole|amoxicilline|metformine|valproate|depakine|depakin)\b/.test(
      text,
    ) ||
    /\b[a-z]{4,}(azole|cillin|mycin|pril|sartan|fen|amol|oxine|statin)s?\b/.test(
      text,
    ) ||
    /\b(icd|icd-10|maladie|chronique|soin|acte|consultation|cardio|pneumo|gyn|urologie|dermato|diab|hypertension|asthme|cancer|infection|pathologie)\b/.test(
      text,
    )
  );
}

async function buildMedicationResponse({
  question,
  matches,
  templates,
  sourceLabel = "Base médicale interne",
  sourceType = "sql",
}) {
  if (!isMedicationRequest(question, matches) && !(matches || []).length)
    return null;

  let medMatches = (matches || []).filter((m) => m.type === "medication");
  if (!medMatches.length) {
    medMatches = (matches || []).filter(
      (m) =>
        m.data &&
        (m.data.Name ||
          m.data.GenericName ||
          m.data.Nom ||
          m.data.PrincipeActif),
    );
  }

  const topMed = medMatches[0]?.data || matches?.[0]?.data || null;
  if (!topMed || typeof topMed !== "object") {
    return buildGenericSqlResponse({
      matches,
      sourceLabel,
      sourceType,
    });
  }

  const medHtml = buildMedicationHtml(topMed);
  const replyText = Object.entries(topMed)
    .filter(
      ([, value]) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    )
    .map(
      ([key, value]) => `${formatDatasetLabel(key)}: ${String(value).trim()}`,
    )
    .join(" | ");

  const combined = buildCombinedResponse({
    matches: medMatches.length ? medMatches : matches,
    groqReply: null,
    medHtml,
    sourceLabel,
    sourceType,
  });

  return {
    reply: replyText || "⚠️ Pas de réponse disponible.",
    source: sourceType,
    refs: medMatches.length ? medMatches : matches,
    med: topMed,
    medHtml,
    combinedHtml: combined.combinedHtml,
    sources: combined.sources,
  };
}

function isMedicalQuestion(question) {
  const text = normText(question);
  if (!text) return false;

  // If local KB can match, accept as medical (covers brand names / aliases)
  const quickMatches = searchLocalKB(question, 3);
  if (quickMatches.length > 0) return true;

  const medicalHints = [
    "medic",
    "medicament",
    "médicament",
    "traitement",
    "douleur",
    "sympt",
    "effet",
    "dose",
    "dosage",
    "prescription",
    "ordonnance",
    "aspirin",
    "aspirine",
    "panadol",
    "panadole",
    "doliprane",
    "dafalgan",
    "paracetamol",
    "ibuprofene",
    "amoxicilline",
    "cardio",
    "cardiologie",
    "pneumo",
    "pneumologie",
    "dentaire",
    "orl",
    "imagerie",
    "radiologie",
    "gastro",
    "dermato",
    "gyn",
    "urologie",
    "nephro",
    "diab",
    "hypertension",
    "asthme",
    "bilan",
    "icd",
  ];

  if (medicalHints.some((hint) => text.includes(hint))) return true;

  // Accept likely medication names not yet present in local KB.
  if (
    /\b[a-z]{4,}(azole|cillin|mycin|pril|sartan|fen|amol|oxine|statin)s?\b/.test(
      text,
    )
  ) {
    return true;
  }

  // Accept broader medical intent (French/English keywords).
  if (
    /\b(medecin|medicine|drug|pharma|tablet|capsule|antibiot|analges|side effect|contre-indication|indication|symptom|diagnos|dose|dosage|mg|ml|infection|virus|bacteria|fever|fievre|headache|cough|diabetes|hypertension|asthma|cholesterol|renal|kidney|liver|heart|cancer)\b/.test(
      text,
    )
  ) {
    return true;
  }

  return false;
}

function buildMedicalOnlyReply(question) {
  const q = String(question ?? "").trim();
  if (!q) return "Veuillez saisir une question médicale.";

  if (!isMedicalQuestion(q)) {
    return (
      `❌ Je réponds seulement aux questions médicales, aux médicaments et aux soins présents dans la base intégrée.` +
      `<br/><br/>Essayez par exemple : ` +
      `<em>Cardiologie</em>, <em>Dentaire</em>, <em>Pneumologie</em>, <em>Aspirine</em>, <em>Imagerie médicale</em>.`
    );
  }

  const matches = searchLocalKB(q, 6);
  if (!matches.length) {
    return (
      `❌ Aucun résultat dans la base intégrée pour <strong>${escapeHtml(q)}</strong>.` +
      `<br/><br/>Essayez un autre terme médical ou un nom de médicament présent dans le fichier Excel / KB.`
    );
  }

  let html = `✅ Résultats pour <strong>${escapeHtml(q)}</strong> :<br/><br/>`;
  const seenSections = new Set();

  matches.forEach((match) => {
    const data = match.data || {};
    if (match.type === "medication") {
      const name = data.Name || data.GenericName || "(unknown)";
      if (!seenSections.has("medication")) {
        html += `<strong>💊 Médicaments (${matches.filter((m) => m.type === "medication").length})</strong><br/>`;
        seenSections.add("medication");
      }
      html += `• ${escapeHtml(name)}`;
      if (data.GenericName) html += ` — ${escapeHtml(data.GenericName)}`;
      if (data.Indications)
        html += ` — Indications: ${escapeHtml(data.Indications)}`;
      if (data.SideEffects)
        html += ` — Effets: ${escapeHtml(data.SideEffects)}`;
      html += `<br/>`;
      return;
    }

    if (!seenSections.has("kb")) {
      html += `<strong>📋 Soins / Actes (${matches.filter((m) => m.type === "kb").length})</strong><br/>`;
      seenSections.add("kb");
    }

    const title =
      data["Soin / Acte"] ||
      data.Soins ||
      data["Maladie chronique"] ||
      data.maladie ||
      data["Catégorie"] ||
      data["Spécialité"] ||
      "Résultat";
    const codes =
      data["ICD à utiliser"] || data["ICD-10"] || data.codes || data.icd || "";
    html += `• ${escapeHtml(title)}`;
    if (codes) html += ` → <code>${escapeHtml(codes)}</code>`;
    html += `<br/>`;
  });

  return html;
}

// ─────────────────────────────────────────────
//  ROUTES AVEC AUTHENTIFICATION
// ─────────────────────────────────────────────

// GET /api/chat/knowledge-base
router.get("/knowledge-base", authMiddleware, (_req, res) => {
  res.json({
    loaded: true,
    name: "Base ICD MSH",
    soinsCount: SOINS.length,
    maladiesCount: MALADIES.length,
  });
});

// GET /api/chat/knowledge-base/categories (public)
router.get("/knowledge-base/categories", (req, res) => {
  try {
    const kb = loadLocalKB();
    const rows = kb.rows || [];
    const seen = new Set();
    const categories = [];

    function extractCategoryAt(i) {
      for (let j = i; j >= 0; j--) {
        const r = rows[j] || {};
        for (const key of Object.keys(r)) {
          const kn = String(key || "").toLowerCase();
          if (
            ["categorie", "category", "cat", "specialite", "spécialité"].some(
              (k) => kn.includes(k),
            )
          ) {
            const val = String(r[key] || "").trim();
            if (val) return val;
          }
        }
      }
      return null;
    }

    rows.forEach((r, idx) => {
      const cat = extractCategoryAt(idx);
      if (cat && !seen.has(cat)) {
        seen.add(cat);
        categories.push(cat);
      }
    });

    res.json({ categories });
  } catch (e) {
    res.json({
      categories: ["Cardiologie", "Dentaire", "Pneumologie", "Optique"],
    });
  }
});

// POST /api/chat/knowledge-base
router.post("/knowledge-base", authMiddleware, (_req, res) => {
  res.json({
    success: true,
    soinsCount: SOINS.length,
    maladiesCount: MALADIES.length,
  });
});

// POST /api/chat (version avec Groq + auth)
router.post("/", authMiddleware, async (req, res) => {
  const body = req.body || {};

  const messages = Array.isArray(body.messages)
    ? body.messages
    : Array.isArray(body.history)
      ? body.history
      : body.message
        ? [{ role: "user", content: body.message }]
        : [];

  if (!messages.length) {
    return res.status(400).json({ error: "Messages manquants." });
  }

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") {
    return res.status(400).json({ error: "Dernier message invalide." });
  }

  const userQuestion = last.content;

  // Charge seulement les templates, puis recherche en base SQL.
  const templates = loadTemplates();
  const sqlMatches = await searchSqlKnowledge(userQuestion, 8);
  if (sqlMatches.length) {
    const medicationResponse = await buildMedicationResponse({
      question: userQuestion,
      matches: sqlMatches,
      templates,
      sourceLabel: "Base Médicaments SQL interne",
      sourceType: "sql",
    });
    return res.json({
      ...medicationResponse,
      source: "sql",
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    reply:
      `❌ Aucune donnée médicale trouvée dans la base SQL interne pour <strong>${escapeHtml(userQuestion)}</strong>. ` +
      `Je réponds uniquement à partir des données disponibles dans SQL Server.`,
    source: "sql",
    refs: [],
    combinedHtml: "",
    sources: [],
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
//  ROUTES DE TEST PUBLIC (SANS AUTHENTIFICATION)
// ─────────────────────────────────────────────

// Route de test local (sans auth)
router.post("/test-groq", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  console.log("🧪 Test local SQL - Message:", message);
  const templates = loadTemplates();
  const sqlMatches = await searchSqlKnowledge(message, 6);

  if (sqlMatches.length) {
    const medicationResponse = await buildMedicationResponse({
      question: message,
      matches: sqlMatches,
      templates,
      sourceLabel: "Base Médicaments SQL interne",
      sourceType: "sql",
    });
    return res.json({
      success: true,
      ...medicationResponse,
      source: "sql",
    });
  }

  res.json({
    success: true,
    reply:
      `❌ Aucun résultat trouvé dans la base SQL interne pour <strong>${escapeHtml(message)}</strong>. ` +
      `Je ne peux répondre qu'avec les données issues de SQL Server.`,
    source: "sql",
    refs: [],
    combinedHtml: "",
    sources: [],
  });
});

// Route publique de test (sans token)
router.post("/public-test", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  console.log("📩 Question publique reçue:", message);
  const templates = loadTemplates();
  const sqlMatches = await searchSqlKnowledge(message, 8);

  if (sqlMatches.length) {
    const medicationResponse = await buildMedicationResponse({
      question: message,
      matches: sqlMatches,
      templates,
      sourceLabel: "Base Médicaments SQL interne",
      sourceType: "sql",
    });
    return res.json({
      ...medicationResponse,
      source: "sql",
    });
  }

  res.json({
    reply:
      `❌ Aucun résultat trouvé dans la base SQL interne pour <strong>${escapeHtml(message)}</strong>. ` +
      `Je ne peux répondre qu'avec les données issues de SQL Server.`,
    source: "sql",
    refs: [],
    combinedHtml: "",
    sources: [],
  });
});

// CSV import endpoints have been disabled per user request.
// GET /api/chat/medications/template (auth)
router.get("/medications/template", authMiddleware, (_req, res) => {
  res.status(404).json({
    error:
      "CSV import and template endpoints have been disabled by configuration.",
  });
});

// POST /api/chat/medications/import (auth)
router.post("/medications/import", authMiddleware, (_req, res) => {
  res.status(404).json({
    success: false,
    error: "CSV import endpoint has been disabled per user request.",
  });
});

// Route de santé publique
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Chatbot API fonctionne",
    groqConfigured: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

export default router;
