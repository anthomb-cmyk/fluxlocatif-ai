const DEFAULT_LISTING_CACHE_TTL_MS = 10 * 60 * 1000;

const STEP_LABELS = {
  move_in_date: "la date d'emménagement souhaitée",
  occupants_total: "le nombre de personnes qui habiteraient le logement",
  has_animals: "s'il y a des animaux",
  animal_type: "le type d'animal",
  employment_status: "la situation d'emploi ou source de revenu",
  employer: "le nom de l'employeur ou type d'emploi",
  employment_duration: "l'ancienneté en emploi",
  income: "le revenu approximatif",
  credit: "la situation de crédit",
  tal: "s'il y a eu des problèmes au TAL ou avec un propriétaire précédent",
  full_name: "le nom complet",
  phone: "le numéro de téléphone",
  email: "l'adresse courriel"
};

function normalizeQuestionKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildListingFallback(listing) {
  return [
    `Voici les informations disponibles pour L-${listing.ref}.`,
    "",
    listing.adresse ? `Adresse : ${listing.adresse}` : "",
    listing.ville ? `Ville : ${listing.ville}` : "",
    listing.type_logement ? `Type : ${listing.type_logement}` : "",
    listing.chambres ? `Chambres : ${listing.chambres}` : "",
    listing.superficie ? `Superficie : ${listing.superficie}` : "",
    listing.loyer ? `Loyer : ${listing.loyer}` : "",
    listing.disponibilite ? `Disponibilité : ${listing.disponibilite}` : "",
    listing.statut ? `Statut : ${listing.statut}` : "",
    listing.notes ? `Notes : ${listing.notes}` : ""
  ].filter(Boolean).join("\n");
}

export function truncateConversationHistory(history = [], maxMessages = 10) {
  if (!Array.isArray(history)) return [];

  return history.slice(-maxMessages).map((entry) => {
    if (entry?.role && entry?.content) {
      return { role: String(entry.role).trim(), content: String(entry.content).trim() };
    }

    const sections = Array.isArray(entry?.sections)
      ? entry.sections.slice(0, 4).map((s) => ({
          title: String(s?.title || "").trim(),
          text: String(s?.text || "").trim()
        }))
      : [];

    const content = [
      String(entry?.text || "").trim(),
      ...sections.map((s) => `${s.title ? `${s.title} : ` : ""}${s.text}`.trim())
    ].filter(Boolean).join("\n");

    return {
      role: String(entry?.sender || "").trim().toLowerCase() === "assistant" ? "assistant" : "user",
      content
    };
  }).filter((e) => e.role && e.content);
}

function buildTranslatorKnownFieldsSummary(threadState) {
  const knownFields = Object.entries(threadState?.qualification || {})
    .filter(([, v]) => v?.known)
    .map(([k, v]) => `${k}: ${String(v?.value ?? "").trim()}`)
    .filter(Boolean);
  return knownFields.length ? knownFields.join("\n") : "Aucune information connue pour le moment.";
}

function buildTranslatorListingSummary(listing) {
  if (!listing) return "Aucun logement sélectionné";
  return JSON.stringify({
    ref: String(listing.ref || "").trim(),
    adresse: String(listing.adresse || listing.address || "").trim(),
    ville: String(listing.ville || listing.city || "").trim(),
    loyer: listing.loyer ?? listing.rent ?? null,
    disponibilite: String(listing.disponibilite || listing.availability || "").trim(),
    inclusions: String(listing.inclusions || "").trim(),
    animaux_acceptes: String(listing.animaux_acceptes || "").trim(),
    stationnement: String(listing.stationnement || "").trim(),
    electricite: String(listing.electricite || "").trim(),
    notes: String(listing.notes || "").trim(),
    description: String(listing.description || "").trim()
  }, null, 2);
}

function normalizeExtractedFields(raw = {}) {
  return {
    move_in_date: raw.move_in_date ?? null,
    occupants_total: raw.occupants_total ?? null,
    has_animals: raw.has_animals ?? null,
    animal_type: raw.animal_type ?? null,
    employment_status: raw.employment_status ?? null,
    employer: raw.employer ?? null,
    employment_duration: raw.employment_duration ?? null,
    income: raw.income ?? null,
    credit: raw.credit ?? null,
    tal: raw.tal ?? null,
    full_name: raw.full_name ?? null,
    phone: raw.phone ?? null,
    email: raw.email ?? null
  };
}

export function createOpenAIService({
  openaiClient,
  assistantModel = process.env.OPENAI_MODEL || "gpt-4.1-mini",
  translatorModel = process.env.OPENAI_TRANSLATOR_MODEL || "gpt-4o-mini",
  listingCacheTtlMs = DEFAULT_LISTING_CACHE_TTL_MS
} = {}) {
  const listingReplyCache = new Map();

  function cleanupExpiredCacheEntries() {
    const now = Date.now();
    for (const [key, value] of listingReplyCache.entries()) {
      if (!value || value.expiresAt <= now) listingReplyCache.delete(key);
    }
  }

  function getListingCacheKey(message, listing) {
    return [String(listing?.ref || "").trim(), normalizeQuestionKey(message)].join("::");
  }

  function getCachedListingReply(message, listing) {
    cleanupExpiredCacheEntries();
    const entry = listingReplyCache.get(getListingCacheKey(message, listing));
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return entry.reply;
  }

  function setCachedListingReply(message, listing, reply) {
    listingReplyCache.set(getListingCacheKey(message, listing), {
      reply,
      expiresAt: Date.now() + listingCacheTtlMs
    });
  }

  // ─────────────────────────────────────────────────────────
  // APPEL 1 — Extraction + traduction uniquement
  // Pas de réponse générée ici. Juste lire ce que le locataire a dit.
  // ─────────────────────────────────────────────────────────
  async function extractTranslatorFields({ message, conversationHistory, threadState, listing } = {}) {
    if (!openaiClient) return null;

    const lastAskedStep = String(threadState?.last_asked_step || "").trim();
    const lastAskedLabel = lastAskedStep ? (STEP_LABELS[lastAskedStep] || lastAskedStep) : "aucune";
    const listingSummary = buildTranslatorListingSummary(listing);

    const systemPrompt = [
      "Tu es un extracteur de données pour un système de qualification de locataires.",
      "Tu analyses le message d'un locataire et retournes UNIQUEMENT un objet JSON.",
      "Tu ne génères PAS de réponse — seulement l'extraction et la traduction.",
      "",
      "FORMAT DE SORTIE JSON STRICT :",
      JSON.stringify({
        translation: "reformulation en français international clair",
        extracted_fields: {
          move_in_date: null, occupants_total: null, has_animals: null,
          animal_type: null, employment_status: null, employer: null,
          employment_duration: null, income: null, credit: null,
          tal: null, full_name: null, phone: null, email: null
        },
        listing_question: "none",
        visit_requested: false
      }),
      "",
      "RÈGLES D'EXTRACTION :",
      "- Extraire TOUS les champs présents dans le message",
      "- null = absent du message",
      "- has_animals: true si animaux mentionnés, false si explicitement aucun animal",
      "- move_in_date: SEULEMENT si date précise (1er mai, 15 juin, début juillet)",
      "- move_in_date: JAMAIS extraire 'demain', 'asap', 'bientôt', 'le plus vite possible'",
      "- Si message contient question logement + mot temporel vague: NE PAS extraire move_in_date",
      "- occupants_total: extraire si chiffre ou mention du nombre de personnes",
      "- listing_question: availability | electricity | heating | inclusions | appliances | pets | parking | price | location | deposit | visit | none",
      `- Dernière question posée au locataire : "${lastAskedLabel}" — contexte pour interpréter les réponses courtes`,
      "",
      "LOGEMENT SÉLECTIONNÉ :",
      listingSummary
    ].join("\n");

    try {
      const response = await openaiClient.chat.completions.create({
        model: translatorModel,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          ...truncateConversationHistory(conversationHistory, 8),
          { role: "user", content: String(message || "").trim() }
        ]
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) return null;

      const parsed = JSON.parse(content);
      return {
        translation: String(parsed?.translation || "").trim(),
        extracted_fields: normalizeExtractedFields(parsed?.extracted_fields || {}),
        listing_question: String(parsed?.listing_question || "none").trim(),
        visit_requested: Boolean(parsed?.visit_requested)
      };
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // APPEL 2 — Génération de réponse uniquement
  // L'AI reçoit des instructions directes : quoi dire + quelle question poser.
  // Elle ne sait pas ce qui vient d'être extrait.
  // ─────────────────────────────────────────────────────────
  async function generateTranslatorReplyFromInstructions({
    translation,
    listingAnswer,
    nextQuestion,
    listing,
    conversationHistory
  } = {}) {
    if (!openaiClient) return null;

    const listingSummary = buildTranslatorListingSummary(listing);

    const systemPrompt = [
      "Tu es un employé en location immobilière qui répond brièvement à un locataire.",
      "",
      "RÈGLES ABSOLUES :",
      "- Maximum 2 phrases au total",
      "- Ton direct et naturel, jamais formel",
      "- Si une réponse logement est fournie : commence par cette information",
      "- Si une question est fournie : termine TOUJOURS par cette question, mot pour mot",
      "- Ne JAMAIS confirmer ou répéter ce que le locataire a dit dans son message",
      "- Ne JAMAIS ajouter : 'Avez-vous d'autres questions', 'N'hésitez pas', 'Merci', 'Parfait'",
      "- Ne JAMAIS inventer d'informations sur le logement",
      "- Ne pas déduire ou reformuler la question — la poser telle quelle",
      "",
      "LOGEMENT :",
      listingSummary
    ].join("\n");

    const userContent = [
      `Message du locataire (traduit) : ${translation || "message reçu"}`,
      listingAnswer
        ? `Information à communiquer sur le logement : ${listingAnswer}`
        : "Pas de question sur le logement dans ce message.",
      nextQuestion
        ? `Question OBLIGATOIRE à poser à la fin, mot pour mot : "${nextQuestion}"`
        : "Dossier complet — pas de question à poser."
    ].join("\n");

    try {
      const response = await openaiClient.chat.completions.create({
        model: translatorModel,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          ...truncateConversationHistory(conversationHistory, 6),
          { role: "user", content: userContent }
        ]
      });

      return response.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // POINT D'ENTRÉE PRINCIPAL
  // Appelé par generateTranslatorPayload dans server.js
  // Reçoit nextQuestion et listingAnswer calculés côté serveur
  // ─────────────────────────────────────────────────────────
  async function generateTranslatorResponse({
    message,
    conversationHistory,
    threadState,
    listing,
    nextQuestion,
    listingAnswer
  } = {}) {
    if (!openaiClient) return null;

    // Appel 1 : extraction pure
    const extraction = await extractTranslatorFields({
      message,
      conversationHistory,
      threadState,
      listing
    });

    if (!extraction) return null;

    // Appel 2 : réponse avec instructions directes venant du serveur
    const reply = await generateTranslatorReplyFromInstructions({
      translation: extraction.translation,
      listingAnswer: listingAnswer || null,
      nextQuestion: nextQuestion || null,
      listing,
      conversationHistory
    });

    return {
      translation: extraction.translation,
      reply: reply || "",
      extracted_fields: extraction.extracted_fields,
      next_step: null,
      visit_requested: extraction.visit_requested,
      listing_question: extraction.listing_question
    };
  }

  // Alias pour compatibilité avec les anciens appels
  async function generateTranslatorExtraction(message, options = {}) {
    return extractTranslatorFields({
      message,
      conversationHistory: [],
      threadState: options?.threadState || null,
      listing: options?.listing || null
    });
  }

  async function generateTranslatorReply(options = {}) {
    return generateTranslatorReplyFromInstructions(options);
  }

  async function streamListingReply(message, listing, { signal, onToken } = {}) {
    const cachedReply = getCachedListingReply(message, listing);
    if (cachedReply) {
      if (typeof onToken === "function") onToken(cachedReply);
      return cachedReply;
    }

    if (!openaiClient) {
      const fallback = buildListingFallback(listing);
      setCachedListingReply(message, listing, fallback);
      if (typeof onToken === "function") onToken(fallback);
      return fallback;
    }

    const stream = await openaiClient.chat.completions.create({
      model: assistantModel,
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: "system",
          content: "Tu es un assistant interne pour une equipe de location. Reponds seulement avec les informations fournies sur l'appartement. Si l'information manque, dis-le clairement sans inventer."
        },
        {
          role: "user",
          content: `Appartement : ${JSON.stringify(listing, null, 2)}\n\nQuestion : ${message}`
        }
      ],
      signal
    });

    let reply = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (!delta) continue;
      reply += delta;
      if (typeof onToken === "function") onToken(delta);
    }

    const finalReply = reply.trim() || "Aucune réponse disponible.";
    setCachedListingReply(message, listing, finalReply);
    return finalReply;
  }

  return {
    assistantModel,
    translatorModel,
    truncateConversationHistory,
    generateTranslatorExtraction,
    generateTranslatorResponse,
    generateTranslatorReply,
    streamListingReply
  };
}
