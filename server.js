import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
console.log("API key loaded:", !!process.env.OPENAI_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const APP_USERNAME = process.env.APP_USERNAME || "admin";
const APP_PASSWORD = process.env.APP_PASSWORD || "1234";

const listingsPath = path.join(__dirname, "listings.json");
let listingsRaw = JSON.parse(fs.readFileSync(listingsPath, "utf8"));

const listings = Array.isArray(listingsRaw)
  ? listingsRaw
  : Array.isArray(listingsRaw.listings)
    ? listingsRaw.listings
    : [];

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const publicRoutes = ["/login.html", "/login.js", "/login.css", "/api/login"];

app.use((req, res, next) => {
  if (
    publicRoutes.includes(req.path) ||
    req.path.startsWith("/api/login") ||
    req.path.startsWith("/favicon")
  ) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const expected = "Basic " + Buffer.from(`${APP_USERNAME}:${APP_PASSWORD}`).toString("base64");

  if (authHeader === expected) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
});

app.use(express.static(__dirname));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function extractListingRef(text = "") {
  const match = text.match(/\bL-\d{4}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function getListingSystemPrompt(listing) {
  return `Tu es l'Assistant des immeubles de FluxLocatif.

Règles absolues :
- Réponds uniquement sur l'immeuble fourni dans le contexte.
- L'employé est en lecture seule. Ne propose jamais de modifier les données.
- Si la question demande une traduction, réponds exactement :
"Pour les traductions ou les questions liées à la langue, veuillez utiliser le mode Traducteur."
- Si la question sort du cadre de l'immeuble, réponds exactement :
"Veuillez poser une question liée à cette référence d'immeuble uniquement."
- Garde les réponses courtes, claires et professionnelles.
- N'invente rien. Base-toi seulement sur les informations ci-dessous.

Immeuble :
Référence : ${listing.ref}
Adresse : ${listing.address}
Ville : ${listing.city}
Loyer : ${listing.rent}
Chambres : ${listing.bedrooms}
Disponibilité : ${listing.availability}
Statut : ${listing.status}
Description : ${listing.description}
Notes : ${listing.notes}`;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username === APP_USERNAME && password === APP_PASSWORD) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    return res.json({ ok: true, token });
  }

  return res.status(401).json({ ok: false, error: "Identifiants invalides." });
});

app.get("/app", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const expected = "Basic " + Buffer.from(`${APP_USERNAME}:${APP_PASSWORD}`).toString("base64");

  if (authHeader !== expected) {
    return res.redirect("/");
  }

  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Serveur connecté",
    apiKey: !!process.env.OPENAI_API_KEY
  });
});

app.get("/api/listings", (req, res) => {
  const listingsMap = {};
  for (const listing of listings) {
    listingsMap[listing.ref] = listing;
  }
  res.json({ listings: listingsMap });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(500).json({ error: "API key missing" });
    }

    const { message, mode } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message vide." });
    }

    if (mode === "translator") {
      const response = await client.responses.create({
        model: MODEL,
        max_output_tokens: 150,
        input: [
          {
            role: "system",
            content: `Tu es le Traducteur de FluxLocatif.

Ton rôle principal :
- Traduire du français québécois, familier, abrégé ou rempli de fautes en français international clair, professionnel et naturel.
- Tu peux aussi expliquer brièvement le sens d'un texte si l'utilisateur le demande clairement.
- Tu peux traduire vers une autre langue seulement si l'utilisateur le demande clairement.

Règles strictes :
- Par défaut, transforme le texte en français international.
- Ne demande jamais le pays ou la région.
- Ne réponds jamais aux questions sur les immeubles, loyers, disponibilités, références ou annonces.
- Si l'utilisateur pose une question liée à un immeuble ou à un logement, réponds exactement :
"Pour toute question liée aux immeubles ou aux logements, veuillez utiliser le mode Assistant des immeubles."

Style :
- court
- clair
- professionnel
- naturel`
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

    const listing = listings.find((l) => l.ref === ref);

    if (!listing) {
      return res.json({
        reply: "Référence non trouvée.",
        label: "Assistant des immeubles",
        variant: "error"
      });
    }

    const systemPrompt = getListingSystemPrompt(listing);

    const response = await client.responses.create({
      model: MODEL,
      max_output_tokens: 150,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    return res.json({
      reply: response.output_text || "Erreur de réponse.",
      label: "Assistant des immeubles",
      variant: "success",
      reference: ref
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`FluxLocatif AI lancé sur http://localhost:${PORT}`);
});
