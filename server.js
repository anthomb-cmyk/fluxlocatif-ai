import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const api = express.Router();

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/* =========================
   HELPERS
========================= */

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatListingRef(ref) {
  if (ref === null || ref === undefined || ref === "") return "";
  const clean = String(ref).replace(/^L-/i, "").trim();
  return `L-${clean}`;
}

function extractListingRef(text = "") {
  const direct = String(text).match(/\bL-(\d{1,10})\b/i);
  if (direct) return parseInt(direct[1], 10);

  const loose = String(text).match(/\b(\d{3,10})\b/);
  if (loose) return parseInt(loose[1], 10);

  return null;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Non indiqué";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Non indiqué";
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  return String(value);
}

function buildListingContext(listing) {
  return Object.entries(listing)
    .map(([key, value]) => `${key} : ${formatValue(value)}`)
    .join("\n");
}

function getListingPrompt(listing) {
  const listingContext = buildListingContext(listing);

  return `Tu es l'Assistant des immeubles de FluxLocatif.

Tu réponds uniquement à partir des informations présentes dans la fiche ci-dessous.
Tu peux utiliser TOUTES les colonnes de la fiche.

Règles :
- N'invente rien
- Réponds en français
- Réponds de façon courte, claire et naturelle
- Si l'information n'est pas présente, réponds exactement : "Cette information n'est pas indiquée dans la fiche."
- Tu peux comprendre les variantes comme :
  - électricité / electricite / hydro / courant / lumiere
  - eau chaude / hot water
  - animaux / chien / chat
  - parking / stationnement
  - meublé / meuble
- Utilise aussi balcon, wifi, acces_terrain, electros_inclus, laveuse_secheuse, rangement si présents

FICHE DU LOGEMENT :
${listingContext}`;
}

function safeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function safeInt(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function parseEmploymentLengthMonths(value = "") {
  const txt = normalizeText(value);
  if (!txt) return null;

  const numberMatch = txt.match(/(\d+)/);
  if (!numberMatch) return null;

  const amount = Number(numberMatch[1]);
  if (Number.isNaN(amount)) return null;

  if (txt.includes("an")) return amount * 12;
  if (txt.includes("mois")) return amount;

  return amount;
}

function normalizeArrayText(values = []) {
  if (!Array.isArray(values)) return [];
  return values.map((v) => normalizeText(v)).filter(Boolean);
}

function computeCandidateMatch(candidate, rules) {
  if (!rules) {
    return {
      match_status: "à vérifier",
      match_score: 0,
      match_reason: "Aucun critère client configuré."
    };
  }

  let score = 0;
  const reasons = [];

  if (rules.min_income !== null && rules.min_income !== undefined) {
    if ((candidate.monthly_income || 0) >= rules.min_income) {
      score += 2;
      reasons.push("revenu conforme");
    } else {
      reasons.push("revenu sous le minimum");
    }
  }

  const acceptedCredits = normalizeArrayText(rules.accepted_credit_levels);
  if (acceptedCredits.length) {
    if (acceptedCredits.includes(normalizeText(candidate.credit_level))) {
      score += 2;
      reasons.push("crédit conforme");
    } else {
      reasons.push("crédit hors critères");
    }
  }

  if (rules.accept_tal_record) {
    if (normalizeText(candidate.tal_record) === normalizeText(rules.accept_tal_record)) {
      score += 2;
      reasons.push("TAL conforme");
    } else {
      reasons.push("TAL hors critères");
    }
  }

  if (rules.max_occupants !== null && rules.max_occupants !== undefined) {
    if ((candidate.occupants_total || 0) <= rules.max_occupants) {
      score += 1;
      reasons.push("occupants conformes");
    } else {
      reasons.push("trop d'occupants");
    }
  }

  if (rules.pets_allowed) {
    if (normalizeText(candidate.pets) === normalizeText(rules.pets_allowed)) {
      score += 1;
      reasons.push("animaux conformes");
    } else {
      reasons.push("animaux hors critères");
    }
  }

  const acceptedEmployment = normalizeArrayText(rules.accepted_employment_status);
  if (acceptedEmployment.length) {
    if (acceptedEmployment.includes(normalizeText(candidate.employment_status))) {
      score += 1;
      reasons.push("statut d'emploi conforme");
    } else {
      reasons.push("statut d'emploi hors critères");
    }
  }

  if (
    rules.minimum_employment_length_months !== null &&
    rules.minimum_employment_length_months !== undefined
  ) {
    const candidateMonths = parseEmploymentLengthMonths(candidate.employment_length);
    if (candidateMonths !== null && candidateMonths >= rules.minimum_employment_length_months) {
      score += 1;
      reasons.push("ancienneté emploi conforme");
    } else {
      reasons.push("ancienneté emploi insuffisante");
    }
  }

  let match_status = "à vérifier";
  if (score >= 8) match_status = "match";
  if (score <= 4) match_status = "hors critères";

  return {
    match_status,
    match_score: score,
    match_reason: reasons.join(" | ")
  };
}

async function sendCandidateNotificationEmail(candidate) {
  if (!resend || !process.env.EMAIL_NOTIFY_TO) return;

  const subject = `Nouveau locataire potentiel — L-${candidate.apartment_ref}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Nouveau locataire potentiel</h2>
      <p><strong>Appartement :</strong> L-${candidate.apartment_ref || "-"}</p>
      <p><strong>Nom :</strong> ${candidate.candidate_name || "-"}</p>
      <p><strong>Téléphone :</strong> ${candidate.phone || "-"}</p>
      <p><strong>Email :</strong> ${candidate.email || "-"}</p>
      <p><strong>Emploi :</strong> ${candidate.job_title || "-"}</p>
      <p><strong>Employeur :</strong> ${candidate.employer_name || "-"}</p>
      <p><strong>Depuis :</strong> ${candidate.employment_length || "-"}</p>
      <p><strong>Statut emploi :</strong> ${candidate.employment_status || "-"}</p>
      <p><strong>Revenu :</strong> ${candidate.monthly_income || "-"}</p>
      <p><strong>Crédit :</strong> ${candidate.credit_level || "-"}</p>
      <p><strong>TAL :</strong> ${candidate.tal_record || "-"}</p>
      <p><strong>Occupants :</strong> ${candidate.occupants_total || "-"}</p>
      <p><strong>Animaux :</strong> ${candidate.pets || "-"}</p>
      <p><strong>Match :</strong> ${candidate.match_status || "-"}</p>
      <p><strong>Score :</strong> ${candidate.match_score ?? "-"}</p>
      <p><strong>Raison :</strong> ${candidate.match_reason || "-"}</p>
      <hr />
      <p><a href="https://fluxlocatif.up.railway.app/admin.html">Ouvrir l’admin FluxLocatif</a></p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "FluxLocatif <onboarding@resend.dev>",
    to: [process.env.EMAIL_NOTIFY_TO],
    subject,
    html
  });

  if (error) {
    throw new Error(error.message || "Erreur envoi email");
  }
}

async function getAllListings() {
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .order("ref", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function getListingByRef(ref) {
  const numericRef = Number(ref);

  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("ref", numericRef)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function quickFieldAnswer(listing, question) {
  const q = normalizeText(question);
  const refLabel = formatListingRef(listing.ref);

  if (q.includes("balcon")) {
    if (listing.balcon) return `Pour ${refLabel}, balcon : ${listing.balcon}.`;
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("wifi")) {
    if (listing.wifi) return `Pour ${refLabel}, wifi : ${listing.wifi}.`;
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("terrain")) {
    if (listing.acces_terrain) return `Pour ${refLabel}, accès au terrain : ${listing.acces_terrain}.`;
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("electro") || q.includes("frigidaire") || q.includes("four")) {
    if (listing.electros_inclus) return `Pour ${refLabel}, électros inclus : ${listing.electros_inclus}.`;
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("laveuse") || q.includes("secheuse")) {
    if (listing.laveuse_secheuse) return `Pour ${refLabel}, laveuse/sécheuse : ${listing.laveuse_secheuse}.`;
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("rangement")) {
    if (listing.rangement) return `Pour ${refLabel}, rangement : ${listing.rangement}.`;
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (
    q.includes("stationnement") ||
    q.includes("parking") ||
    q.includes("garage")
  ) {
    if (
      listing.stationnements_gratuits !== null ||
      listing.stationnements_payants !== null ||
      listing.prix_stationnement_payant !== null
    ) {
      return `Pour ${refLabel}, stationnements gratuits : ${listing.stationnements_gratuits ?? 0}, stationnements payants : ${listing.stationnements_payants ?? 0}, prix stationnement payant : ${listing.prix_stationnement_payant ?? 0} $.`;
    }

    if (listing.stationnement) {
      return `Pour ${refLabel}, stationnement : ${listing.stationnement}.`;
    }

    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (
    q.includes("electric") ||
    q.includes("hydro") ||
    q.includes("courant") ||
    q.includes("lumiere")
  ) {
    if (listing.electricite) {
      return `Pour ${refLabel}, l'électricité est : ${listing.electricite}.`;
    }
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("animal") || q.includes("chien") || q.includes("chat")) {
    if (listing.animaux_acceptes) {
      return `Pour ${refLabel}, animaux acceptés : ${listing.animaux_acceptes}.`;
    }
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("disponib") || q.includes("date") || q.includes("quand")) {
    if (listing.disponibilite) {
      return `Pour ${refLabel}, disponibilité : ${listing.disponibilite}.`;
    }
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("prix") || q.includes("loyer") || q.includes("combien")) {
    if (listing.loyer !== null && listing.loyer !== undefined && listing.loyer !== "") {
      return `Le loyer de ${refLabel} est de ${listing.loyer} $.`;
    }
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (
    q.includes("superficie") ||
    q.includes("pi2") ||
    q.includes("sqft") ||
    q.includes("grandeur")
  ) {
    if (listing.superficie) {
      return `La superficie de ${refLabel} est de ${listing.superficie}.`;
    }
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  if (q.includes("chambre")) {
    if (listing.chambres !== null && listing.chambres !== undefined && listing.chambres !== "") {
      return `${refLabel} a ${listing.chambres} chambre${Number(listing.chambres) > 1 ? "s" : ""}.`;
    }
    return "Cette information n'est pas indiquée dans la fiche.";
  }

  return null;
}

/* =========================
   API
========================= */

api.get("/health", async (req, res) => {
  try {
    const { error } = await supabase.from("apartments").select("ref").limit(1);
    if (error) throw error;

    return res.json({
      ok: true,
      message: "Serveur connecté"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Connexion Supabase impossible."
    });
  }
});

api.get("/listings", async (req, res) => {
  try {
    const listings = await getAllListings();
    const map = {};

    for (const listing of listings) {
      if (listing?.ref !== null && listing?.ref !== undefined) {
        map[String(listing.ref)] = {
          ...listing,
          ref: String(listing.ref)
        };
      }
    }

    return res.json({ listings: map });
  } catch (error) {
    return res.status(500).json({ error: "Erreur chargement appartements." });
  }
});

api.get("/admin/user-daily-time", async (req, res) => {
  try {
    const { day, user_id } = req.query;

    let query = supabase
      .from("user_daily_time_from_heartbeat_named")
      .select("*")
      .order("day", { ascending: false });

    if (day) query = query.eq("day", day);
    if (user_id) query = query.eq("user_id", user_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ summary: data || [] });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur chargement temps heartbeat.",
      details: error.message || String(error)
    });
  }
});

api.get("/admin/chat-sessions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) throw error;

    return res.json({ sessions: data || [] });
  } catch (error) {
    return res.status(500).json({ error: "Erreur chargement sessions." });
  }
});

api.get("/admin/chat-messages", async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (user_id) query = query.eq("user_id", user_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ messages: data || [] });
  } catch (error) {
    return res.status(500).json({ error: "Erreur chargement messages." });
  }
});

/* =========================
   CLIENTS
========================= */

api.get("/admin/clients", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("client_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ clients: data || [] });
  } catch (error) {
    return res.status(500).json({ error: "Erreur chargement clients." });
  }
});

api.post("/admin/clients", async (req, res) => {
  try {
    const payload = {
      client_name: req.body.client_name?.trim(),
      email: req.body.email?.trim() || null,
      phone: req.body.phone?.trim() || null,
      company_name: req.body.company_name?.trim() || null,
      is_active: req.body.is_active !== false
    };

    if (!payload.client_name) {
      return res.status(400).json({ error: "client_name requis." });
    }

    const { data, error } = await supabase
      .from("client_accounts")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ ok: true, client: data });
  } catch (error) {
    return res.status(500).json({ error: "Erreur création client." });
  }
});

api.put("/admin/clients/:id", async (req, res) => {
  try {
    const payload = {
      client_name: req.body.client_name?.trim(),
      email: req.body.email?.trim() || null,
      phone: req.body.phone?.trim() || null,
      company_name: req.body.company_name?.trim() || null,
      is_active: req.body.is_active !== false
    };

    const { data, error } = await supabase
      .from("client_accounts")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ ok: true, client: data });
  } catch (error) {
    return res.status(500).json({ error: "Erreur modification client." });
  }
});

/* =========================
   CLIENT RULES
========================= */

api.get("/admin/client-rules", async (req, res) => {
  try {
    const { client_id } = req.query;

    let query = supabase
      .from("client_qualification_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (client_id) query = query.eq("client_id", client_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ rules: data || [] });
  } catch (error) {
    return res.status(500).json({ error: "Erreur chargement critères." });
  }
});

api.post("/admin/client-rules", async (req, res) => {
  try {
    const payload = {
      client_id: req.body.client_id,
      min_income: safeNumber(req.body.min_income),
      accepted_credit_levels: Array.isArray(req.body.accepted_credit_levels)
        ? req.body.accepted_credit_levels
        : [],
      accept_tal_record: req.body.accept_tal_record || null,
      max_occupants: safeInt(req.body.max_occupants),
      pets_allowed: req.body.pets_allowed || null,
      minimum_employment_length_months: safeInt(req.body.minimum_employment_length_months),
      accepted_employment_status: Array.isArray(req.body.accepted_employment_status)
        ? req.body.accepted_employment_status
        : [],
      notes: req.body.notes?.trim() || null
    };

    if (!payload.client_id) {
      return res.status(400).json({ error: "client_id requis." });
    }

    const { data, error } = await supabase
      .from("client_qualification_rules")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ ok: true, rule: data });
  } catch (error) {
    return res.status(500).json({ error: "Erreur création critères." });
  }
});

api.put("/admin/client-rules/:id", async (req, res) => {
  try {
    const payload = {
      min_income: safeNumber(req.body.min_income),
      accepted_credit_levels: Array.isArray(req.body.accepted_credit_levels)
        ? req.body.accepted_credit_levels
        : [],
      accept_tal_record: req.body.accept_tal_record || null,
      max_occupants: safeInt(req.body.max_occupants),
      pets_allowed: req.body.pets_allowed || null,
      minimum_employment_length_months: safeInt(req.body.minimum_employment_length_months),
      accepted_employment_status: Array.isArray(req.body.accepted_employment_status)
        ? req.body.accepted_employment_status
        : [],
      notes: req.body.notes?.trim() || null
    };

    const { data, error } = await supabase
      .from("client_qualification_rules")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ ok: true, rule: data });
  } catch (error) {
    return res.status(500).json({ error: "Erreur modification critères." });
  }
});

/* =========================
   APARTMENTS
========================= */

api.post("/admin/apartments", async (req, res) => {
  try {
    const {
      adresse,
      ville,
      type_logement,
      chambres,
      superficie,
      loyer,
      inclusions,
      statut,
      stationnement,
      animaux_acceptes,
      meuble,
      disponibilite,
      notes,
      electricite,
      balcon,
      wifi,
      acces_terrain,
      stationnements_gratuits,
      stationnements_payants,
      prix_stationnement_payant,
      electros_inclus,
      laveuse_secheuse,
      nombre_logements_batiment,
      rangement,
      client_id
    } = req.body || {};

    if (!adresse || !ville) {
      return res.status(400).json({
        error: "adresse et ville sont requis."
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from("apartments")
      .select("ref")
      .order("ref", { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const lastRef = existing?.[0]?.ref ? Number(existing[0].ref) : 1000;
    const nextRef = lastRef + 1;

    const payload = {
      ref: nextRef,
      adresse,
      ville,
      type_logement: type_logement || null,
      chambres: safeInt(chambres),
      superficie: superficie || null,
      loyer: safeNumber(loyer),
      inclusions: inclusions || null,
      statut: statut || null,
      stationnement: stationnement || null,
      animaux_acceptes: animaux_acceptes || null,
      meuble: meuble || null,
      disponibilite: disponibilite || null,
      notes: notes || null,
      electricite: electricite || null,
      balcon: balcon || null,
      wifi: wifi || null,
      acces_terrain: acces_terrain || null,
      stationnements_gratuits: safeInt(stationnements_gratuits),
      stationnements_payants: safeInt(stationnements_payants),
      prix_stationnement_payant: safeNumber(prix_stationnement_payant),
      electros_inclus: electros_inclus || null,
      laveuse_secheuse: laveuse_secheuse || null,
      nombre_logements_batiment: safeInt(nombre_logements_batiment),
      rangement: rangement || null,
      client_id: client_id || null
    };

    const { data, error } = await supabase
      .from("apartments")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      ok: true,
      apartment: data,
      generated_ref: `L-${nextRef}`
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur création appartement.",
      details: error.message || String(error)
    });
  }
});

api.put("/admin/apartments/:ref", async (req, res) => {
  try {
    const { ref } = req.params;
    const numericRef = Number(String(ref).replace(/^L-/i, "").trim());

    if (!numericRef) {
      return res.status(400).json({ error: "Référence invalide." });
    }

    const updates = {
      ...req.body,
      chambres: safeInt(req.body.chambres),
      loyer: safeNumber(req.body.loyer),
      stationnements_gratuits: safeInt(req.body.stationnements_gratuits),
      stationnements_payants: safeInt(req.body.stationnements_payants),
      prix_stationnement_payant: safeNumber(req.body.prix_stationnement_payant),
      nombre_logements_batiment: safeInt(req.body.nombre_logements_batiment),
      client_id: req.body.client_id || null
    };

    if ("ref" in updates) delete updates.ref;

    const { data, error } = await supabase
      .from("apartments")
      .update(updates)
      .eq("ref", numericRef)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ ok: true, apartment: data });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur modification appartement.",
      details: error.message || String(error)
    });
  }
});

api.delete("/admin/apartments/:ref", async (req, res) => {
  try {
    const { ref } = req.params;
    const numericRef = Number(String(ref).replace(/^L-/i, "").trim());

    if (!numericRef) {
      return res.status(400).json({ error: "Référence invalide." });
    }

    const { error } = await supabase
      .from("apartments")
      .delete()
      .eq("ref", numericRef);

    if (error) throw error;

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur suppression appartement.",
      details: error.message || String(error)
    });
  }
});

/* =========================
   CANDIDATES + MATCHING
========================= */

api.post("/admin/candidates", async (req, res) => {
  try {
    const payload = { ...req.body };

    if (!payload.apartment_ref) {
      return res.status(400).json({ error: "apartment_ref manquant." });
    }

    payload.apartment_ref = Number(payload.apartment_ref);
    payload.monthly_income = safeNumber(payload.monthly_income);
    payload.occupants_total = safeInt(payload.occupants_total);

    const { data: apartment, error: apartmentError } = await supabase
      .from("apartments")
      .select("ref, client_id")
      .eq("ref", payload.apartment_ref)
      .maybeSingle();

    if (apartmentError) throw apartmentError;

    let computedMatch = {
      match_status: "à vérifier",
      match_score: 0,
      match_reason: "Aucun appartement ou client lié trouvé."
    };

    let matchedClientId = null;

    if (apartment?.client_id) {
      matchedClientId = apartment.client_id;

      const { data: rules, error: rulesError } = await supabase
        .from("client_qualification_rules")
        .select("*")
        .eq("client_id", apartment.client_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rulesError) throw rulesError;

      computedMatch = computeCandidateMatch(payload, rules);
    }

    payload.match_status = computedMatch.match_status;
    payload.match_score = computedMatch.match_score;
    payload.match_reason = computedMatch.match_reason;
    payload.matched_client_id = matchedClientId;

    const { data, error } = await supabase
      .from("rental_applications")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    let emailWarning = null;

    try {
      await sendCandidateNotificationEmail(data);
    } catch (mailError) {
      emailWarning = "Candidat enregistré, mais notification email non envoyée.";
    }

    return res.json({
      ok: true,
      candidate: data,
      emailWarning
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur création candidat" });
  }
});

api.get("/admin/candidates", async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from("rental_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ candidates: data || [] });
  } catch (err) {
    return res.status(500).json({ error: "Erreur candidats" });
  }
});

api.put("/admin/candidates/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("rental_applications")
      .update(req.body)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ ok: true, candidate: data });
  } catch (err) {
    return res.status(500).json({ error: "Erreur update candidat" });
  }
});

/* =========================
   CHAT
========================= */

api.post("/chat", async (req, res) => {
  try {
    const { message, mode } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message vide." });
    }

    if (mode === "translator") {
      const response = await openai.responses.create({
        model: MODEL,
        input: [
          {
            role: "system",
            content:
              "Corrige et reformule le texte en français international clair, professionnel et naturel. Ne fais rien d’autre. Répond uniquement avec le texte corrigé."
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      return res.json({
        reply: response.output_text || "Erreur de réponse.",
        label: "Traducteur",
        variant: "success"
      });
    }

    const ref = extractListingRef(message);

    if (!ref) {
      return res.json({
        reply: "Veuillez inclure une référence (ex: L-1001).",
        label: "Assistant des immeubles",
        variant: "error"
      });
    }

    const listing = await getListingByRef(ref);

    if (!listing) {
      return res.json({
        reply: "Référence non trouvée.",
        label: "Assistant des immeubles",
        variant: "error"
      });
    }

    const directAnswer = quickFieldAnswer(listing, message);

    if (directAnswer) {
      return res.json({
        reply: directAnswer,
        label: "Assistant des immeubles",
        variant: "success",
        reference: String(ref)
      });
    }

    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: getListingPrompt(listing)
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    return res.json({
      reply: response.output_text || "Erreur de réponse.",
      label: "Assistant des immeubles",
      variant: "success",
      reference: String(ref)
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message || String(error)
    });
  }
});

app.use("/api", api);

/* =========================
   STATIC + FRONT
========================= */

app.use(express.static(__dirname, { extensions: ["html"] }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route introuvable." });
  }

  return res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
