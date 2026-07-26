import express from "express";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────
//  BASE DE DONNÉES ICD (Soins + Maladies chroniques)
// ─────────────────────────────────────────────
const SOINS = [
  {
    cat: "Dentaire",
    soin: "Consultation dentiste / soins dentaires (extraction, détartrage, carie, endodontie…)",
    codes: "K029 / K088",
  },
  {
    cat: "Optique",
    soin: "Réfraction / achat lunettes",
    codes: "H542 / H526 / H521",
  },
  {
    cat: "Optique",
    soin: "OCT / champ visuel / fond d'œil",
    codes: "H409 / H579",
  },
  {
    cat: "Optique",
    soin: "Collyres / traitement ophtalmique",
    codes: "H109 / H579",
  },
  { cat: "Optique", soin: "Chirurgie cataracte", codes: "H269" },
  {
    cat: "Cardiologie",
    soin: "Consultation cardiologue",
    codes: "I10 / R002 / I509",
  },
  { cat: "Cardiologie", soin: "ECG", codes: "R074 / I20" },
  { cat: "Cardiologie", soin: "Échographie cardiaque", codes: "I509 / I11" },
  { cat: "Cardiologie", soin: "Holter / Stress test", codes: "R002 / I49" },
  { cat: "ORL", soin: "Consultation ORL", codes: "J329 / H609 / J309" },
  { cat: "ORL", soin: "Audiogramme", codes: "H919 / H900" },
  { cat: "ORL", soin: "Nettoyage d'oreille", codes: "H612" },
  { cat: "ORL", soin: "Fibroscopie ORL", codes: "R42 / H819" },
  {
    cat: "Gastro-entérologie",
    soin: "Consultation gastro-entérologue",
    codes: "K219 / K297 / K590 / R197",
  },
  {
    cat: "Gastro-entérologie",
    soin: "Endoscopie digestive",
    codes: "K219 / K297",
  },
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

// ─────────────────────────────────────────────
//  CONSTRUCTION DE LA RÉPONSE (HTML)
// ─────────────────────────────────────────────
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
//  ROUTES
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

// POST /api/chat/knowledge-base  (compatibilité ancien code)
router.post("/knowledge-base", authMiddleware, (_req, res) => {
  res.json({
    success: true,
    soinsCount: SOINS.length,
    maladiesCount: MALADIES.length,
  });
});

// POST /api/chat
router.post("/", authMiddleware, (req, res) => {
  const body = req.body || {};

  // Supporte : { messages:[…] } ou { history:[…] } ou { message:"…" }
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

  const reply = buildReply(last.content);
  res.json({ reply });
});

export default router;
