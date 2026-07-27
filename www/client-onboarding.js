const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY = "sb_publishable_103-rw3MwM7k2xUeMMUodg_fRr9vUD4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  fr: {
    brand_sub: "Activation client",

    // Step nav labels
    nav_1: "Compte", nav_2: "Informations", nav_3: "Portefeuille",
    nav_4: "Logements", nav_5: "Qualification", nav_6: "Processus", nav_7: "Marque",

    // Buttons
    btn_back:       "← Retour",
    btn_continue:   "Continuer →",
    btn_submit:     "Soumettre le profil →",
    btn_submitting: "Envoi en cours…",
    btn_go_portal:  "Accéder à mon portail",
    btn_add_listing:"+ Ajouter un logement",
    btn_remove:     "Retirer",

    opt_select:   "Sélectionner",
    opt_optional: "(facultatif)",

    // Step 1
    s1_eyebrow: "Étape 1 sur 6",
    s1_title:   "Créez votre compte",
    s1_desc:    "Nous allons d'abord activer votre accès FluxLocatif avec vos informations principales.",
    lbl_full_name:          "Nom complet",
    lbl_company_name:       "Nom du client / entreprise",
    lbl_email:              "Courriel",
    lbl_phone:              "Téléphone",
    lbl_password:           "Mot de passe",
    lbl_confirm_password:   "Confirmer le mot de passe",
    lbl_main_city:          "Marché principal / ville",
    ph_full_name:           "Marie Tremblay",
    ph_company_name:        "Gestion Tremblay inc.",
    ph_password:            "Minimum 8 caractères",
    ph_main_city:           "Ex. Montréal",
    chk_email_title: "Recevoir les notifications par courriel",
    chk_email_desc:  "Ces courriels vous informeront sur votre compte, vos candidats et vos logements.",
    chk_mkt_title:   "Communications FluxLocatif",
    chk_mkt_desc:    "Recevez occasionnellement des nouvelles et conseils. Désabonnement en tout temps.",
    s1_invite_hint:  "Votre lien est valide pendant 7 jours.",
    creating_account: "Création du compte…",
    linking_account:  "Liaison du compte…",

    // Step 2
    s2_eyebrow: "Étape 2 sur 6",
    s2_title:   "Informations client",
    s2_desc:    "Confirmez votre contact principal et les détails de facturation afin que nous joignions la bonne personne.",
    lbl_primary_contact: "Contact principal",
    lbl_primary_email:   "Courriel principal",
    lbl_primary_phone:   "Téléphone principal",
    lbl_preferred_comm:  "Méthode de communication préférée",
    sec_billing_title:   "Contact de facturation",
    sec_billing_desc:    "Si différent du contact principal, qui doit recevoir les factures ?",
    lbl_billing_name:    "Nom du contact de facturation",
    lbl_billing_email:   "Courriel de facturation",
    lbl_billing_phone:   "Téléphone de facturation",
    pref_email:   "Courriel",
    pref_phone:   "Appel téléphonique",
    pref_sms:     "SMS / Texto",
    pref_portal:  "Portail client uniquement",

    // Step 3
    s3_eyebrow: "Étape 3 sur 6",
    s3_title:   "Portefeuille et logements",
    s3_desc:    "Donnez-nous une vue d'ensemble de votre portefeuille pour calibrer votre forfait.",
    lbl_units_plan:      "Logements inclus dans ce forfait",
    lbl_total_portfolio: "Taille totale du portefeuille",
    hint_all_units:      "(tous vos logements)",
    lbl_markets:         "Marchés / villes",
    ph_markets:          "Tapez une ville et appuyez sur Entrée…",
    lbl_property_types:  "Types de propriétés",
    ph_units_plan:       "ex. 5",
    ph_total_portfolio:  "ex. 20",
    pt_apartment:  "Appartement",
    pt_condo:      "Condo",
    pt_house:      "Maison",
    pt_studio:     "Studio",
    pt_duplex:     "Duplex / Plex",
    pt_townhouse:  "Maison de ville",
    pt_commercial: "Commercial",
    pt_other:      "Autre",

    // Step 4
    s4_eyebrow: "Étape 4 sur 6",
    s4_title:   "Logements actifs",
    s4_desc:    "Ajoutez les logements que FluxLocatif doit gérer. Vous pourrez en ajouter depuis votre portail.",
    listing_default_title: "Logement #",
    listing_default_sub:   "Remplissez les détails ci-dessous",
    lbl_l_address:      "Adresse",
    lbl_l_unit:         "Numéro d'unité",
    lbl_l_type:         "Type d'unité",
    lbl_l_rent:         "Loyer mensuel ($)",
    lbl_l_availability: "Date de disponibilité",
    lbl_l_lease_start:  "Début de bail souhaité",
    lbl_l_amenities:    "Commodités",
    lbl_l_parking:      "Stationnement",
    lbl_l_pets:         "Animaux acceptés",
    lbl_l_smoking:      "Fumeur accepté",
    lbl_l_link:         "Lien vers l'annonce existante",
    lbl_l_notes:        "Notes",
    ph_l_address:   "123 rue Principale, Montréal, QC",
    ph_l_unit:      "ex. App. 4B",
    ph_l_rent:      "ex. 1 600",
    ph_l_amenities: "ex. Lave-vaisselle, laveuse-sécheuse, balcon, A/C…",
    ph_l_link:      "https://centris.ca/...",
    ph_l_notes:     "Tout détail spécifique sur cette unité…",
    avail_now:        "Disponible maintenant",
    avail_30:         "Dans 30 jours",
    avail_60:         "Dans 60 jours",
    avail_custom:     "Date personnalisée…",
    lbl_l_custom_date: "Date personnalisée",
    parking_included:  "Inclus dans le loyer",
    parking_extra:     "Disponible (frais supplémentaires)",
    parking_street:    "Stationnement de rue seulement",
    parking_none:      "Aucun stationnement",
    pets_yes:          "Oui",
    pets_small:        "Petits animaux seulement",
    pets_nego:         "À négocier",
    pets_no:           "Non",
    smoking_no:        "Non-fumeur",
    smoking_outside:   "Extérieur seulement",
    smoking_yes:       "Oui",
    err_listing_address: "Le logement #{{n}} n'a pas d'adresse.",

    // Step 5
    s5_eyebrow: "Étape 5 sur 6",
    s5_title:   "Critères de qualification",
    s5_desc:    "Ces critères s'appliquent globalement à tous vos logements, sauf indication contraire par unité.",
    lbl_min_income:     "Revenu minimum requis",
    lbl_credit_score:   "Cote de crédit requise",
    lbl_employment:     "Exigences d'emploi",
    lbl_guarantor:      "Politique de garant",
    lbl_pet_policy:     "Politique concernant les animaux",
    lbl_occupancy:      "Nombre maximal d'occupants",
    lbl_disqualifying:  "Facteurs disqualifiants",
    lbl_add_screening:  "Préférences de sélection supplémentaires",
    ph_min_income:      "ex. 3× le loyer mensuel ou 4 500 $/mois",
    ph_disqualifying:   "ex. Expulsions passées, loyers impayés, casier judiciaire pour infractions violentes…",
    ph_add_screening:   "ex. Lettres de référence requises, entrevue avant visite…",
    credit_excellent: "Excellent (700+)",
    credit_good:      "Bon (650–699)",
    credit_fair:      "Acceptable (600–649)",
    credit_flexible:  "Flexible / Sans minimum",
    emp_fulltime:     "Temps plein requis",
    emp_stable:       "Emploi stable requis",
    emp_selfemployed: "Travailleur autonome accepté",
    emp_flexible:     "Flexible",
    guar_accepted:    "Accepté",
    guar_case:        "Cas par cas",
    guar_refused:     "Non accepté",
    pet_allowed:      "Acceptés",
    pet_small:        "Petits animaux seulement",
    pet_case:         "Cas par cas",
    pet_refused:      "Refusés",
    occ_1: "1 personne", occ_2: "2 personnes", occ_3: "3 personnes",
    occ_4: "4 personnes", occ_5: "5 personnes", occ_6plus: "6+ personnes",

    // Step 6
    s6_eyebrow: "Étape 6 sur 6",
    s6_title:   "Préférences de processus",
    s6_desc:    "Aidez-nous à comprendre votre façon de travailler pour s'intégrer parfaitement à votre processus.",
    lbl_escalation:    "Règles d'escalade",
    lbl_approval:      "Processus d'approbation",
    lbl_showing:       "Processus de visites",
    lbl_approval_notes: "Notes sur le processus d'approbation",
    lbl_comm_expect:   "Attentes en matière de communication",
    ph_escalation:     "ex. Escalader au contact principal si aucune réponse dans les 24 h. Urgences : appel direct…",
    ph_approval_notes: "Étapes spécifiques, délais ou conditions particulières…",
    ph_comm_expect:    "ex. Réponse dans les 4 heures ouvrables. Résumé hebdomadaire chaque lundi…",
    appr_owner:     "J'approuve chaque demande",
    appr_flux:      "FluxLocatif sélectionne et approuve",
    appr_shortlist: "FluxLocatif présélectionne, je choisis",
    appr_delegated: "Entièrement délégué à FluxLocatif",
    show_self:    "Locataire prend rendez-vous lui-même",
    show_owner:   "Je dois être présent",
    show_agent:   "Géré par un agent FluxLocatif",
    show_lockbox: "Boîte à clé / sans accompagnement",

    // Step 7
    s7_title:   "Marque et communication",
    s7_desc:    "Nous utiliserons ces paramètres lors de la représentation de vos annonces et des communications avec les locataires.",
    lbl_comm_tone:    "Ton de communication",
    lbl_branding_name:"Nom de marque / entreprise à utiliser",
    lbl_signature:    "Signature / coordonnées pour les messages sortants",
    lbl_brand_notes:  "Notes supplémentaires sur la marque",
    ph_branding_name: "ex. Gestion XYZ ou nom légal",
    ph_signature:     "ex.\nGestion XYZ — Équipe location\ninfo@gestionxyz.com | (514) 555-1234",
    ph_brand_notes:   "Formules, ton ou éléments à éviter lors de la représentation de votre marque…",
    tone_formal:   "Formel et professionnel",
    tone_friendly: "Amical et accessible",
    tone_concise:  "Concis et direct",
    tone_warm:     "Chaleureux et accueillant",

    // Success / Invalid
    success_title: "Profil soumis — vous êtes prêt !",
    success_desc:  "Votre formulaire a été reçu. Notre équipe le vérifiera et activera votre compte sous peu. Vous recevrez un courriel de confirmation.",
    invalid_title:   "Invitation expirée ou invalide",
    invalid_default: "Cette invitation n'est plus disponible. Veuillez contacter votre gestionnaire de compte FluxLocatif pour obtenir un nouveau lien.",

    // Errors / status
    err_token_missing:   "Le jeton d'invitation est manquant.",
    err_passwords:       "Les mots de passe ne correspondent pas.",
    err_generic:         "Une erreur est survenue. Veuillez réessayer.",
    err_submit:          "Impossible de soumettre votre profil. Veuillez réessayer.",
    info_existing_session: "Votre session existante sera utilisée pour continuer l'activation.",
    info_existing_email:   "Ce courriel possède déjà un compte. Connectez-vous pour poursuivre l'activation."
  },

  en: {
    brand_sub: "Client Onboarding",

    nav_1: "Account", nav_2: "Client Info", nav_3: "Portfolio",
    nav_4: "Listings", nav_5: "Qualification", nav_6: "Workflow", nav_7: "Brand",

    btn_back:       "← Back",
    btn_continue:   "Continue →",
    btn_submit:     "Submit Profile →",
    btn_submitting: "Submitting…",
    btn_go_portal:  "Go to Client Portal",
    btn_add_listing:"+ Add another listing",
    btn_remove:     "Remove",

    opt_select:   "Select one",
    opt_optional: "(optional)",

    s1_eyebrow: "Step 1 of 6",
    s1_title:   "Create your account",
    s1_desc:    "Activate your FluxLocatif access with your main contact details.",
    lbl_full_name:        "Full Name",
    lbl_company_name:     "Company / Client Name",
    lbl_email:            "Email",
    lbl_phone:            "Phone",
    lbl_password:         "Password",
    lbl_confirm_password: "Confirm Password",
    lbl_main_city:        "Primary Market / City",
    ph_full_name:         "Jane Doe",
    ph_company_name:      "Acme Properties Inc.",
    ph_password:          "Minimum 8 characters",
    ph_main_city:         "e.g. Montréal",
    chk_email_title: "Email notifications",
    chk_email_desc:  "Receive updates about your account, candidates, and listings.",
    chk_mkt_title:   "FluxLocatif communications",
    chk_mkt_desc:    "Occasional news, tips, and feature updates. Unsubscribe anytime.",
    s1_invite_hint:  "Your invite link is valid for 7 days.",
    creating_account: "Creating account…",
    linking_account:  "Linking…",

    s2_eyebrow: "Step 2 of 6",
    s2_title:   "Client information",
    s2_desc:    "Confirm your primary contact and billing details so we reach the right person.",
    lbl_primary_contact: "Primary Contact",
    lbl_primary_email:   "Primary Email",
    lbl_primary_phone:   "Primary Phone",
    lbl_preferred_comm:  "Preferred Communication",
    sec_billing_title:   "Billing Contact",
    sec_billing_desc:    "If different from your primary contact, who should receive invoices?",
    lbl_billing_name:    "Billing Contact Name",
    lbl_billing_email:   "Billing Email",
    lbl_billing_phone:   "Billing Phone",
    pref_email:   "Email",
    pref_phone:   "Phone call",
    pref_sms:     "SMS / Text",
    pref_portal:  "Client portal only",

    s3_eyebrow: "Step 3 of 6",
    s3_title:   "Portfolio & units",
    s3_desc:    "Tell us about the scope of your rental portfolio so we can calibrate your plan.",
    lbl_units_plan:      "Units Included in This Plan",
    lbl_total_portfolio: "Total Portfolio Size",
    hint_all_units:      "(all units you own)",
    lbl_markets:         "Markets / Cities",
    ph_markets:          "Type a city and press Enter…",
    lbl_property_types:  "Property Types",
    ph_units_plan:       "e.g. 5",
    ph_total_portfolio:  "e.g. 20",
    pt_apartment:  "Apartment",
    pt_condo:      "Condo",
    pt_house:      "House",
    pt_studio:     "Studio",
    pt_duplex:     "Duplex / Plex",
    pt_townhouse:  "Townhouse",
    pt_commercial: "Commercial",
    pt_other:      "Other",

    s4_eyebrow: "Step 4 of 6",
    s4_title:   "Active listings",
    s4_desc:    "Add the units you want FluxLocatif to manage. You can add more from your portal later.",
    listing_default_title: "Listing #",
    listing_default_sub:   "Fill in the property details below",
    lbl_l_address:      "Property Address",
    lbl_l_unit:         "Unit Number",
    lbl_l_type:         "Unit Type",
    lbl_l_rent:         "Monthly Rent ($)",
    lbl_l_availability: "Availability Date",
    lbl_l_lease_start:  "Desired Lease Start",
    lbl_l_amenities:    "Amenities",
    lbl_l_parking:      "Parking Details",
    lbl_l_pets:         "Pets Allowed",
    lbl_l_smoking:      "Smoking Allowed",
    lbl_l_link:         "Existing Listing Link",
    lbl_l_notes:        "Notes",
    ph_l_address:   "123 Main St, Montréal, QC",
    ph_l_unit:      "e.g. Apt 4B",
    ph_l_rent:      "e.g. 1,600",
    ph_l_amenities: "e.g. Dishwasher, in-unit laundry, balcony, A/C…",
    ph_l_link:      "https://centris.ca/...",
    ph_l_notes:     "Any details about this specific unit…",
    avail_now:        "Available Now",
    avail_30:         "Within 30 days",
    avail_60:         "Within 60 days",
    avail_custom:     "Custom date…",
    lbl_l_custom_date: "Custom Date",
    parking_included:  "Included in rent",
    parking_extra:     "Available (extra cost)",
    parking_street:    "Street parking only",
    parking_none:      "No parking",
    pets_yes:          "Yes",
    pets_small:        "Small pets only",
    pets_nego:         "Negotiable",
    pets_no:           "No",
    smoking_no:        "No smoking",
    smoking_outside:   "Outside only",
    smoking_yes:       "Yes",
    err_listing_address: "Listing #{{n}} is missing a property address.",

    s5_eyebrow: "Step 5 of 6",
    s5_title:   "Tenant qualification criteria",
    s5_desc:    "These criteria apply globally to all your listings unless overridden per unit.",
    lbl_min_income:    "Minimum Income Requirement",
    lbl_credit_score:  "Credit Score Requirement",
    lbl_employment:    "Employment Requirements",
    lbl_guarantor:     "Guarantor Policy",
    lbl_pet_policy:    "Pet Policy",
    lbl_occupancy:     "Max Occupants per Unit",
    lbl_disqualifying: "Disqualifying Factors",
    lbl_add_screening: "Additional Screening Preferences",
    ph_min_income:     "e.g. 3× monthly rent or $4,500/mo",
    ph_disqualifying:  "e.g. Prior evictions, unpaid rent, criminal record for violent offences…",
    ph_add_screening:  "e.g. Reference letters required, interview before showing…",
    credit_excellent: "Excellent (700+)",
    credit_good:      "Good (650–699)",
    credit_fair:      "Fair (600–649)",
    credit_flexible:  "Flexible / No minimum",
    emp_fulltime:     "Full-time required",
    emp_stable:       "Stable employment required",
    emp_selfemployed: "Self-employed accepted",
    emp_flexible:     "Flexible",
    guar_accepted:    "Accepted",
    guar_case:        "Case by case",
    guar_refused:     "Not accepted",
    pet_allowed:      "Allowed",
    pet_small:        "Small pets only",
    pet_case:         "Case by case",
    pet_refused:      "Not allowed",
    occ_1: "1 person", occ_2: "2 people", occ_3: "3 people",
    occ_4: "4 people", occ_5: "5 people", occ_6plus: "6+ people",

    s6_eyebrow: "Step 6 of 6",
    s6_title:   "Workflow preferences",
    s6_desc:    "Help us understand how you like to operate so we can work seamlessly with your process.",
    lbl_escalation:     "Escalation Rules",
    lbl_approval:       "Approval Process",
    lbl_showing:        "Showing Process",
    lbl_approval_notes: "Approval Process Notes",
    lbl_comm_expect:    "Communication Expectations",
    ph_escalation:      "e.g. Escalate to primary contact if no response within 24 hours. Urgent issues: call directly…",
    ph_approval_notes:  "Any specific steps, deadlines, or conditions for approvals…",
    ph_comm_expect:     "e.g. Respond within 4 business hours. Send a weekly summary every Monday…",
    appr_owner:     "I approve every application",
    appr_flux:      "FluxLocatif screens and approves",
    appr_shortlist: "FluxLocatif shortlists, I choose",
    appr_delegated: "Fully delegated to FluxLocatif",
    show_self:    "Tenant self-schedules",
    show_owner:   "I must be present",
    show_agent:   "Managed by FluxLocatif agent",
    show_lockbox: "Lockbox / unaccompanied",

    s7_title:   "Brand & communication style",
    s7_desc:    "We'll use these settings when representing your listings and communicating with tenants on your behalf.",
    lbl_comm_tone:     "Communication Tone",
    lbl_branding_name: "Brand / Company Name to Use",
    lbl_signature:     "Signature / Contact Details for Outgoing Messages",
    lbl_brand_notes:   "Additional Branding Notes",
    ph_branding_name:  "e.g. Gestion XYZ or your legal company name",
    ph_signature:      "e.g.\nGestion XYZ — Leasing Team\ninfo@gestionxyz.com | (514) 555-1234",
    ph_brand_notes:    "Any specific phrases, language, or things to avoid when representing your brand…",
    tone_formal:   "Formal & professional",
    tone_friendly: "Friendly & approachable",
    tone_concise:  "Concise & to the point",
    tone_warm:     "Warm & welcoming",

    success_title: "Profile submitted — you're all set!",
    success_desc:  "Your intake form has been received. Our team will review it and activate your account shortly. You'll get a confirmation email once everything is ready.",
    invalid_title:   "Invitation expired or invalid",
    invalid_default: "This invitation is no longer available. Please contact your FluxLocatif account manager for a new link.",

    err_token_missing:   "Invitation token is missing.",
    err_passwords:       "Passwords do not match.",
    err_generic:         "Something went wrong. Please try again.",
    err_submit:          "Could not submit your profile. Please try again.",
    info_existing_session: "Your existing session will be used to continue activation.",
    info_existing_email:   "This email already has an account. Sign in with this address to continue."
  }
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  token: new URLSearchParams(window.location.search).get("token") || "",
  invitation: null,
  currentStep: 1,
  lang: localStorage.getItem("fl_lang") || "fr",
  locations: [],
  sessionUser: null,
  listings: [],
  markets: [],
  propertyTypes: [],
  listingCount: 0
};

const TOTAL_STEPS = 6;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const onboardingContent   = document.getElementById("onboardingContent");
const successState        = document.getElementById("successState");
const invalidState        = document.getElementById("invalidState");
const invalidStateMsg     = document.getElementById("invalidStateMessage");
const progressFill        = document.getElementById("progressFill");
const stepNavEl           = document.getElementById("stepNav");
const listingCardsEl      = document.getElementById("listingCards");
const addListingBtn       = document.getElementById("addListingBtn");
const submitIntakeBtn     = document.getElementById("submitIntakeBtn");
const goToClientPortalBtn = document.getElementById("goToClientPortalBtn");

// ─── Translation helpers ──────────────────────────────────────────────────────

function t(key, vars = {}) {
  let str = T[state.lang][key] || T.fr[key] || key;
  Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{{${k}}}`, v); });
  return str;
}

function applyTranslations() {
  const lang = state.lang;
  document.documentElement.lang = lang;

  // Text content
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const val = T[lang][key];
    if (val !== undefined) el.textContent = val;
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const val = T[lang][key];
    if (val !== undefined) el.placeholder = val;
  });

  // Lang toggle buttons
  document.getElementById("langBtnFr")?.classList.toggle("active", lang === "fr");
  document.getElementById("langBtnEn")?.classList.toggle("active", lang === "en");

  // Rebuild step nav with translated labels
  buildStepNav();
  updateStepNav(state.currentStep);
}

// ─── Language toggle ──────────────────────────────────────────────────────────

function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("fl_lang", lang);
  applyTranslations();
  // Re-render listing cards to update their internal labels
  rebuildListingCards();
}

document.getElementById("langBtnFr")?.addEventListener("click", () => setLanguage("fr"));
document.getElementById("langBtnEn")?.addEventListener("click", () => setLanguage("en"));

// ─── Utilities ────────────────────────────────────────────────────────────────

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || t("err_generic"));
  return data;
}

function setStatus(id, message = "", type = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = "status";
  if (message) el.classList.add("show");
  if (type)    el.classList.add(type);
}

function clearStatus(id) { setStatus(id, "", ""); }

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function showInvalid(message) {
  onboardingContent.style.display = "none";
  successState.classList.remove("show");
  invalidState.classList.add("show");
  if (invalidStateMsg) invalidStateMsg.textContent = message || t("invalid_default");
}

function showSuccess() {
  onboardingContent.style.display = "none";
  invalidState.classList.remove("show");
  successState.classList.add("show");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Step navigation ─────────────────────────────────────────────────────────

function buildStepNav() {
  if (!stepNavEl) return;
  const navKeys = ["nav_1","nav_2","nav_3","nav_4","nav_5","nav_6"];
  stepNavEl.innerHTML = navKeys.map((key, i) => {
    const n = i + 1;
    return `
      <div class="step-nav-item" id="stepNavItem${n}">
        <div class="step-dot" id="stepDot${n}">
          <span class="step-dot-num">${n}</span>
        </div>
        <div class="step-nav-label">${t(key)}</div>
      </div>`;
  }).join("");
}

function updateStepNav(current) {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const item = document.getElementById(`stepNavItem${i}`);
    const dot  = document.getElementById(`stepDot${i}`);
    if (!item || !dot) continue;
    item.classList.toggle("active", i === current);
    item.classList.toggle("done",   i < current);
    dot.innerHTML = i < current ? "" : `<span class="step-dot-num">${i}</span>`;
  }
}

function goToStep(n) {
  state.currentStep = n;
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    document.getElementById(`step${i}Panel`)?.classList.toggle("active", i === n);
  }
  const pct = Math.round((n / TOTAL_STEPS) * 100);
  if (progressFill) progressFill.style.width = pct + "%";
  updateStepNav(n);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.goToStep = goToStep;

// ─── Brouillon local ────────────────────────────────────────────────────────
// Rien n'etait persiste entre l'etape 1 et la soumission finale. Fermer
// l'onglet a l'etape 5 faisait tout recommencer: contact, facturation,
// portefeuille, TOUS les logements et leurs 13 champs, criteres et processus.
// Le brouillon est garde localement, par jeton d'invitation, et efface une fois
// le profil soumis.

function cleBrouillon() {
  return `fl_onboarding_draft_${state.token || "sans-jeton"}`;
}

const CHAMPS_BROUILLON = [
  "primaryContact", "primaryEmail", "primaryPhone", "preferredComm",
  "billingName", "billingEmail", "billingPhone",
  "unitsInPlan", "totalPortfolioSize",
  "minIncomeReq", "creditScoreReq", "employmentReq", "guarantorPolicy",
  "petPolicy", "occupancyRules", "disqualifyingFactors", "additionalScreening",
  "escalationRules", "approvalProcess", "showingProcess", "approvalNotes",
  "commExpectations"
];

function sauvegarderBrouillon() {
  try {
    const champs = {};
    CHAMPS_BROUILLON.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.value) champs[id] = el.value;
    });

    localStorage.setItem(cleBrouillon(), JSON.stringify({
      etape: state.currentStep,
      champs,
      markets: state.markets,
      propertyTypes: state.propertyTypes,
      listings: collectListings(),
      enregistre_le: new Date().toISOString()
    }));
  } catch {
    // quota plein ou stockage refuse: le brouillon est un confort, pas un du
  }
}

function effacerBrouillon() {
  try { localStorage.removeItem(cleBrouillon()); } catch {}
}

function restaurerBrouillon() {
  let brouillon = null;
  try {
    brouillon = JSON.parse(localStorage.getItem(cleBrouillon()) || "null");
  } catch { return false; }

  if (!brouillon || !brouillon.champs) return false;

  Object.entries(brouillon.champs).forEach(([id, valeur]) => {
    const el = document.getElementById(id);
    if (el) el.value = valeur;
  });

  if (Array.isArray(brouillon.markets)) {
    state.markets = brouillon.markets;
    renderMarketTags();
  }

  if (Array.isArray(brouillon.propertyTypes)) {
    state.propertyTypes = brouillon.propertyTypes;
    document.getElementById("propertyTypesRow")?.querySelectorAll(".option-chip").forEach((chip) => {
      chip.classList.toggle("active", state.propertyTypes.includes(chip.dataset.value));
    });
  }

  if (Array.isArray(brouillon.listings) && brouillon.listings.length) {
    state.listings = [];
    if (listingCardsEl) listingCardsEl.innerHTML = "";
    state.listingCount = 0;
    brouillon.listings.forEach((logement) => addListingCard({
      address: logement.address,
      unit: logement.unit_number,
      unit_type: logement.unit_type,
      monthly_rent: logement.monthly_rent,
      availability_date: logement.availability_date,
      amenities: logement.amenities,
      parking: logement.parking,
      pets_allowed: logement.pets_allowed,
      smoking_allowed: logement.smoking_allowed,
      notes: logement.notes
    }));
  }

  return true;
}

function nextStep(from) {
  clearStatus(`step${from}Status`);

  if (from === 4) {
    for (let i = 0; i < state.listings.length; i++) {
      const id  = state.listings[i].id;
      const adr = document.getElementById(`listing_${id}_address`)?.value.trim();
      if (!adr) {
        setStatus("step4Status", t("err_listing_address", { n: i + 1 }), "error");
        return;
      }
    }
  }

  sauvegarderBrouillon();
  goToStep(from + 1);
}

window.nextStep = nextStep;

// ─── Locations ────────────────────────────────────────────────────────────────

async function loadLocations() {
  const data = await fetchJSON("/locations-quebec.json").catch(() => []);
  state.locations = Array.isArray(data) ? data : [];
  ["mainCityList", "mainCityList2"].forEach(id => {
    const dl = document.getElementById(id);
    if (!dl) return;
    dl.innerHTML = state.locations.map(l => `<option value="${escapeHtml(l.label)}"></option>`).join("");
  });
}

// ─── Invite prefill ───────────────────────────────────────────────────────────

function prefillFromInvitation() {
  if (!state.invitation) return;
  const inv = state.invitation;
  setIfEmpty("fullName",       inv.contact_name || inv.name || "");
  setIfEmpty("companyName",    inv.company_name || inv.name || "");
  setIfEmpty("accountEmail",   inv.email || "");
  setIfEmpty("accountPhone",   inv.phone || "");
  setIfEmpty("mainCity",       inv.main_city || "");
  setIfEmpty("primaryContact", inv.contact_name || inv.name || "");
  setIfEmpty("primaryEmail",   inv.email || "");
  setIfEmpty("primaryPhone",   inv.phone || "");
  setIfEmpty("brandingName",   inv.company_name || inv.name || "");
  const emailEl = document.getElementById("accountEmail");
  if (emailEl) emailEl.readOnly = true;
}

function setIfEmpty(id, value) {
  const el = document.getElementById(id);
  if (el && !el.value && value) el.value = value;
}

// ─── Account step ─────────────────────────────────────────────────────────────

function configureAccountStep() {
  if (!state.invitation?.account_exists) return;
  const pw     = document.getElementById("accountPassword");
  const pwConf = document.getElementById("accountPasswordConfirm");
  [pw, pwConf].forEach(el => {
    if (!el) return;
    el.required = false;
    el.disabled = true;
    el.value    = "";
    el.closest(".field").style.display = "none";
  });
  const alreadyMatched =
    state.sessionUser &&
    state.sessionUser.email?.toLowerCase() === state.invitation.email?.toLowerCase();
  setStatus("accountStatus",
    alreadyMatched ? t("info_existing_session") : t("info_existing_email"),
    "info"
  );
}

async function submitAccount(event) {
  event.preventDefault();
  clearStatus("accountStatus");
  const btn = document.getElementById("submitAccountBtn");

  if (state.invitation?.account_exists) {
    const invEmail     = state.invitation.email?.toLowerCase() || "";
    const sessionEmail = state.sessionUser?.email?.toLowerCase() || "";
    if (!state.sessionUser || invEmail !== sessionEmail) {
      const next = `/client-onboarding.html?token=${encodeURIComponent(state.token)}`;
      window.location.href = `/login.html?next=${encodeURIComponent(next)}`;
      return;
    }
    btn.disabled    = true;
    btn.textContent = t("linking_account");
    try {
      const { data: sd } = await supabaseClient.auth.getSession();
      const token = sd?.session?.access_token || "";
      await fetchJSON("/api/client-onboarding/link-existing-account", {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({
          token: state.token,
          full_name:    val("fullName"), company_name: val("companyName"),
          phone:        val("accountPhone"), main_city: val("mainCity"),
          email_notifications:      document.getElementById("emailNotifications")?.checked || false,
          marketing_communications: document.getElementById("marketingCommunications")?.checked || false
        })
      });
      prefillStep2();
      goToStep(2);
    } catch (err) {
      setStatus("accountStatus", err.message || t("err_generic"), "error");
    } finally {
      btn.disabled    = false;
      btn.textContent = t("btn_continue");
    }
    return;
  }

  const password = document.getElementById("accountPassword")?.value || "";
  const pwConf   = document.getElementById("accountPasswordConfirm")?.value || "";
  if (password !== pwConf) {
    setStatus("accountStatus", t("err_passwords"), "error");
    return;
  }

  btn.disabled    = true;
  btn.textContent = t("creating_account");
  try {
    await fetchJSON("/api/client-onboarding/account", {
      method: "POST",
      body: JSON.stringify({
        token: state.token,
        full_name:    val("fullName"), company_name: val("companyName"),
        password,     phone: val("accountPhone"), main_city: val("mainCity"),
        email_notifications:      document.getElementById("emailNotifications")?.checked || false,
        marketing_communications: document.getElementById("marketingCommunications")?.checked || false
      })
    });
    await supabaseClient.auth.signInWithPassword({
      email:    document.getElementById("accountEmail")?.value.trim() || "",
      password
    });
    prefillStep2();
    goToStep(2);
  } catch (err) {
    setStatus("accountStatus", err.message || t("err_generic"), "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = t("btn_continue");
  }
}

function prefillStep2() {
  setIfEmpty("primaryContact", val("fullName"));
  setIfEmpty("primaryEmail",   document.getElementById("accountEmail")?.value || "");
  setIfEmpty("primaryPhone",   val("accountPhone"));
  setIfEmpty("brandingName",   val("companyName"));
}

// ─── Tags input (markets) ──────────────────────────────────────────────────────

function renderMarketTags() {
  const wrap  = document.getElementById("marketsTagsWrap");
  const input = document.getElementById("marketsTagInput");
  if (!wrap || !input) return;
  wrap.querySelectorAll(".tag-item").forEach(el => el.remove());
  state.markets.forEach((city, idx) => {
    const tag = document.createElement("span");
    tag.className = "tag-item";
    tag.innerHTML = `${escapeHtml(city)}<span class="tag-remove" data-idx="${idx}">×</span>`;
    wrap.insertBefore(tag, input);
  });
  wrap.querySelectorAll(".tag-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      state.markets.splice(parseInt(btn.dataset.idx, 10), 1);
      renderMarketTags();
    });
  });
}

function initMarketsTagInput() {
  const input = document.getElementById("marketsTagInput");
  const wrap  = document.getElementById("marketsTagsWrap");
  if (!input) return;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = input.value.trim().replace(/,$/, "");
      if (v && !state.markets.includes(v)) { state.markets.push(v); renderMarketTags(); }
      input.value = "";
    } else if (e.key === "Backspace" && !input.value && state.markets.length) {
      state.markets.pop(); renderMarketTags();
    }
  });
  input.addEventListener("blur", () => {
    const v = input.value.trim().replace(/,$/, "");
    if (v && !state.markets.includes(v)) { state.markets.push(v); renderMarketTags(); input.value = ""; }
  });
  wrap?.addEventListener("click", () => input.focus());
}

// ─── Property type chips ───────────────────────────────────────────────────────

function initPropertyTypeChips() {
  document.getElementById("propertyTypesRow")?.querySelectorAll(".option-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const v   = chip.dataset.value;
      const idx = state.propertyTypes.indexOf(v);
      if (idx === -1) { state.propertyTypes.push(v); chip.classList.add("active"); }
      else            { state.propertyTypes.splice(idx, 1); chip.classList.remove("active"); }
    });
  });
}

// ─── Listing cards ────────────────────────────────────────────────────────────

function listingCardHTML(id, prefill = {}) {
  const o = (key) => escapeHtml(t(key));
  const sel = (fieldId, curVal) => {
    const options = {
      [`listing_${id}_availability`]: [
        { v:"",         k:"opt_select" },
        { v:"Now",      k:"avail_now" },
        { v:"30 days",  k:"avail_30" },
        { v:"60 days",  k:"avail_60" },
        { v:"custom",   k:"avail_custom" }
      ],
      [`listing_${id}_parking`]: [
        { v:"",                 k:"opt_select" },
        { v:"Included",         k:"parking_included" },
        { v:"Available ($)",    k:"parking_extra" },
        { v:"Street only",      k:"parking_street" },
        { v:"None",             k:"parking_none" }
      ],
      [`listing_${id}_pets`]: [
        { v:"",           k:"opt_select" },
        { v:"yes",        k:"pets_yes" },
        { v:"small_only", k:"pets_small" },
        { v:"negotiable", k:"pets_nego" },
        { v:"no",         k:"pets_no" }
      ],
      [`listing_${id}_smoking`]: [
        { v:"",        k:"opt_select" },
        { v:"no",      k:"smoking_no" },
        { v:"outside_only", k:"smoking_outside" },
        { v:"yes",     k:"smoking_yes" }
      ]
    };
    return (options[fieldId] || []).map(opt =>
      `<option value="${opt.v}" ${opt.v === curVal ? "selected" : ""}>${o(opt.k)}</option>`
    ).join("");
  };

  return `
    <div class="listing-card-header" id="listingCardHeader_${id}">
      <div>
        <div class="listing-card-title" id="listingCardTitle_${id}">${t("listing_default_title")}${state.listings.findIndex(l=>l.id===id)+1}</div>
        <div class="listing-card-subtitle" id="listingCardSub_${id}">${t("listing_default_sub")}</div>
      </div>
      <div class="listing-card-actions" id="listingCardActions_${id}">
        <span class="chevron">▼</span>
      </div>
    </div>
    <div class="listing-card-body">
      <div class="form-grid">
        <div class="field-full">
          <label for="listing_${id}_address">${o("lbl_l_address")}</label>
          <input id="listing_${id}_address" type="text"
            placeholder="${o("ph_l_address")}" value="${escapeHtml(prefill.address||"")}" />
        </div>

        <div class="field">
          <label for="listing_${id}_unit">${o("lbl_l_unit")} <span class="label-hint">${o("opt_optional")}</span></label>
          <input id="listing_${id}_unit" type="text"
            placeholder="${o("ph_l_unit")}" value="${escapeHtml(prefill.unit_number||"")}" />
        </div>

        <div class="field">
          <label for="listing_${id}_type">${o("lbl_l_type")}</label>
          <select id="listing_${id}_type">
            <option value="">${o("opt_select")}</option>
            <option value="Studio"   ${prefill.unit_type==="Studio"   ?"selected":""}>Studio</option>
            <option value="1 1/2"   ${prefill.unit_type==="1 1/2"    ?"selected":""}>1½</option>
            <option value="2 1/2"   ${prefill.unit_type==="2 1/2"    ?"selected":""}>2½</option>
            <option value="3 1/2"   ${prefill.unit_type==="3 1/2"    ?"selected":""}>3½</option>
            <option value="4 1/2"   ${prefill.unit_type==="4 1/2"    ?"selected":""}>4½</option>
            <option value="5 1/2"   ${prefill.unit_type==="5 1/2"    ?"selected":""}>5½</option>
            <option value="Condo"   ${prefill.unit_type==="Condo"    ?"selected":""}>Condo</option>
            <option value="Maison"  ${prefill.unit_type==="Maison"   ?"selected":""}>Maison</option>
            <option value="Townhouse" ${prefill.unit_type==="Townhouse"?"selected":""}>Townhouse</option>
          </select>
        </div>

        <div class="field">
          <label for="listing_${id}_rent">${o("lbl_l_rent")}</label>
          <input id="listing_${id}_rent" type="number" min="0"
            placeholder="${o("ph_l_rent")}" value="${prefill.monthly_rent||""}" />
        </div>

        <div class="field">
          <label for="listing_${id}_availability">${o("lbl_l_availability")}</label>
          <select id="listing_${id}_availability">${sel(`listing_${id}_availability`, prefill.availability_date||"")}</select>
        </div>

        <div class="field" id="listing_${id}_customDateWrap" style="display:none;">
          <label for="listing_${id}_customDate">${o("lbl_l_custom_date")}</label>
          <input id="listing_${id}_customDate" type="date" value="${prefill.custom_date||""}" />
        </div>

        <div class="field">
          <label for="listing_${id}_leaseStart">${o("lbl_l_lease_start")} <span class="label-hint">${o("opt_optional")}</span></label>
          <input id="listing_${id}_leaseStart" type="date" value="${prefill.desired_lease_start||""}" />
        </div>

        <div class="field-full">
          <label for="listing_${id}_amenities">${o("lbl_l_amenities")} <span class="label-hint">${o("opt_optional")}</span></label>
          <input id="listing_${id}_amenities" type="text"
            placeholder="${o("ph_l_amenities")}" value="${escapeHtml(prefill.amenities||"")}" />
        </div>

        <div class="field">
          <label for="listing_${id}_parking">${o("lbl_l_parking")}</label>
          <select id="listing_${id}_parking">${sel(`listing_${id}_parking`, prefill.parking||"")}</select>
        </div>

        <div class="field">
          <label for="listing_${id}_pets">${o("lbl_l_pets")}</label>
          <select id="listing_${id}_pets">${sel(`listing_${id}_pets`, prefill.pets_allowed||"")}</select>
        </div>

        <div class="field">
          <label for="listing_${id}_smoking">${o("lbl_l_smoking")}</label>
          <select id="listing_${id}_smoking">${sel(`listing_${id}_smoking`, prefill.smoking_allowed||"")}</select>
        </div>

        <div class="field-full">
          <label for="listing_${id}_link">${o("lbl_l_link")} <span class="label-hint">${o("opt_optional")}</span></label>
          <input id="listing_${id}_link" type="url"
            placeholder="${o("ph_l_link")}" value="${escapeHtml(prefill.existing_listing_link||"")}" />
        </div>

        <div class="field-full">
          <label for="listing_${id}_notes">${o("lbl_l_notes")} <span class="label-hint">${o("opt_optional")}</span></label>
          <textarea id="listing_${id}_notes"
            placeholder="${o("ph_l_notes")}">${escapeHtml(prefill.notes||"")}</textarea>
        </div>
      </div>
    </div>`;
}

function addListingCard(prefill = {}) {
  state.listingCount++;
  const id = state.listingCount;
  state.listings.push({ id });

  const card = document.createElement("div");
  card.className = "listing-card expanded";
  card.id = `listingCard_${id}`;
  card.innerHTML = listingCardHTML(id, prefill);
  listingCardsEl.appendChild(card);

  attachListingCardEvents(id);
  updateRemoveBtns();
}

function attachListingCardEvents(id) {
  const card   = document.getElementById(`listingCard_${id}`);
  const header = document.getElementById(`listingCardHeader_${id}`);

  header?.addEventListener("click", e => {
    if (e.target.classList.contains("remove-btn")) return;
    card?.classList.toggle("expanded");
  });

  const availSel   = document.getElementById(`listing_${id}_availability`);
  const customWrap = document.getElementById(`listing_${id}_customDateWrap`);
  availSel?.addEventListener("change", () => {
    if (customWrap) customWrap.style.display = availSel.value === "custom" ? "" : "none";
  });

  document.getElementById(`listing_${id}_address`)?.addEventListener("input", () => updateListingTitle(id));
  document.getElementById(`listing_${id}_rent`)?.addEventListener("input",    () => updateListingTitle(id));
  document.getElementById(`listing_${id}_unit`)?.addEventListener("input",    () => updateListingTitle(id));
}

function updateListingTitle(id) {
  const titleEl = document.getElementById(`listingCardTitle_${id}`);
  const subEl   = document.getElementById(`listingCardSub_${id}`);
  const address = document.getElementById(`listing_${id}_address`)?.value.trim();
  const unit    = document.getElementById(`listing_${id}_unit`)?.value.trim();
  const rent    = document.getElementById(`listing_${id}_rent`)?.value;
  const idx     = state.listings.findIndex(l => l.id === id);

  if (titleEl) titleEl.textContent = address || (t("listing_default_title") + (idx + 1));
  if (subEl) {
    const parts = [];
    if (unit) parts.push(`${t("lbl_l_unit")} ${unit}`);
    if (rent) parts.push(`$${Number(rent).toLocaleString()}/mo`);
    subEl.textContent = parts.join(" · ") || t("listing_default_sub");
  }
}

function updateRemoveBtns() {
  state.listings.forEach(({ id }) => {
    const actionsEl = document.getElementById(`listingCardActions_${id}`);
    if (!actionsEl) return;
    actionsEl.querySelector(".remove-btn")?.remove();
    if (state.listings.length > 1) {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.className = "remove-btn";
      btn.textContent = t("btn_remove");
      btn.onclick   = () => removeListing(id);
      actionsEl.insertBefore(btn, actionsEl.querySelector(".chevron"));
    }
  });
}

function removeListing(id) {
  const idx = state.listings.findIndex(l => l.id === id);
  if (idx !== -1) state.listings.splice(idx, 1);
  document.getElementById(`listingCard_${id}`)?.remove();
  updateRemoveBtns();
  // Refresh visible numbering on untitled cards
  state.listings.forEach(({ id: lid }, i) => {
    const titleEl = document.getElementById(`listingCardTitle_${lid}`);
    const address = document.getElementById(`listing_${lid}_address`)?.value.trim();
    if (titleEl && !address) titleEl.textContent = t("listing_default_title") + (i + 1);
  });
}

window.removeListing = removeListing;

/** Collect saved values, remove all cards, rebuild with same data in new language */
function rebuildListingCards() {
  const saved = state.listings.map(({ id }) => ({
    address:             document.getElementById(`listing_${id}_address`)?.value || "",
    unit_number:         document.getElementById(`listing_${id}_unit`)?.value || "",
    unit_type:           document.getElementById(`listing_${id}_type`)?.value || "",
    monthly_rent:        document.getElementById(`listing_${id}_rent`)?.value || "",
    availability_date:   document.getElementById(`listing_${id}_availability`)?.value || "",
    custom_date:         document.getElementById(`listing_${id}_customDate`)?.value || "",
    desired_lease_start: document.getElementById(`listing_${id}_leaseStart`)?.value || "",
    amenities:           document.getElementById(`listing_${id}_amenities`)?.value || "",
    parking:             document.getElementById(`listing_${id}_parking`)?.value || "",
    pets_allowed:        document.getElementById(`listing_${id}_pets`)?.value || "",
    smoking_allowed:     document.getElementById(`listing_${id}_smoking`)?.value || "",
    existing_listing_link: document.getElementById(`listing_${id}_link`)?.value || "",
    notes:               document.getElementById(`listing_${id}_notes`)?.value || ""
  }));

  // Clear
  listingCardsEl.innerHTML = "";
  state.listings = [];
  state.listingCount = 0;

  // Re-add with saved values
  if (saved.length === 0) {
    addListingCard();
  } else {
    saved.forEach(prefill => addListingCard(prefill));
  }
}

function collectListings() {
  return state.listings.map(({ id }) => {
    const availSel = document.getElementById(`listing_${id}_availability`)?.value || "";
    return {
      address:              document.getElementById(`listing_${id}_address`)?.value.trim()  || "",
      unit_number:          document.getElementById(`listing_${id}_unit`)?.value.trim()     || "",
      unit_type:            document.getElementById(`listing_${id}_type`)?.value            || "",
      monthly_rent:         document.getElementById(`listing_${id}_rent`)?.value            || "",
      availability_date:    availSel === "custom"
                              ? (document.getElementById(`listing_${id}_customDate`)?.value || "")
                              : availSel,
      desired_lease_start:  document.getElementById(`listing_${id}_leaseStart`)?.value      || "",
      amenities:            document.getElementById(`listing_${id}_amenities`)?.value.trim()|| "",
      parking:              document.getElementById(`listing_${id}_parking`)?.value         || "",
      pets_allowed:         document.getElementById(`listing_${id}_pets`)?.value            || "",
      smoking_allowed:      document.getElementById(`listing_${id}_smoking`)?.value         || "",
      existing_listing_link: document.getElementById(`listing_${id}_link`)?.value.trim()   || "",
      notes:                document.getElementById(`listing_${id}_notes`)?.value.trim()   || ""
    };
  });
}

// ─── Intake submit ────────────────────────────────────────────────────────────

async function submitIntake() {
  clearStatus("step6Status");
  const btn = submitIntakeBtn;
  if (btn) { btn.disabled = true; btn.textContent = t("btn_submitting"); }

  try {
    const { data: sd } = await supabaseClient.auth.getSession();
    const accessToken  = sd?.session?.access_token || "";

    const payload = {
      token: state.token,
      primary_contact:    val("primaryContact"),
      primary_email:      val("primaryEmail"),
      primary_phone:      val("primaryPhone"),
      preferred_communication: val("preferredComm"),
      billing_contact: {
        name:  val("billingName"),
        email: val("billingEmail"),
        phone: val("billingPhone")
      },
      portfolio: {
        units_in_plan:        val("unitsInPlan"),
        total_portfolio_size: val("totalPortfolioSize"),
        markets:              state.markets,
        property_types:       state.propertyTypes
      },
      listings: collectListings(),
      qualification_criteria: {
        min_income_requirement:   val("minIncomeReq"),
        credit_score_requirement: val("creditScoreReq"),
        employment_requirements:  val("employmentReq"),
        guarantor_policy:         val("guarantorPolicy"),
        pet_policy:               val("petPolicy"),
        occupancy_rules:          val("occupancyRules"),
        disqualifying_factors:    val("disqualifyingFactors"),
        additional_screening:     val("additionalScreening")
      },
      workflow_preferences: {
        escalation_rules:           val("escalationRules"),
        approval_process:           val("approvalProcess"),
        showing_process:            val("showingProcess"),
        approval_notes:             val("approvalNotes"),
        communication_expectations: val("commExpectations")
      },
      // L'etape "Marque et communication" a ete retiree du wizard: aucun de ses
      // champs n'etait obligatoire et le client n'a pas d'opinion utile la-dessus
      // avant d'avoir vu un premier message partir. Valeurs par defaut ici,
      // ajustables ensuite depuis les reglages du portail.
      brand_preferences: {
        communication_tone: "friendly",
        branding_name:      val("companyName"),
        signature_contact:  "",
        additional_notes:   ""
      }
    };

    await fetchJSON("/api/client-onboarding/intake", {
      method: "POST",
      headers: { Authorization: accessToken ? `Bearer ${accessToken}` : "" },
      body: JSON.stringify(payload)
    });

    effacerBrouillon();
    showSuccess();
  } catch (err) {
    setStatus("step6Status", err.message || t("err_submit"), "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t("btn_submit"); }
  }
}

// ─── Invitation validation ────────────────────────────────────────────────────

async function validateInvitation() {
  if (!state.token) { showInvalid(t("err_token_missing")); return; }
  try {
    const result     = await fetchJSON(`/api/client-onboarding/invitation?token=${encodeURIComponent(state.token)}`);
    state.invitation = result.invitation || null;
    prefillFromInvitation();
    configureAccountStep();

    const etapeDepart = result.current_step === 2 ? 2 : 1;
    const brouillonRestaure = etapeDepart === 2 && restaurerBrouillon();

    goToStep(etapeDepart);

    if (brouillonRestaure) {
      setStatus("step2Status", "Nous avons retrouvé vos réponses précédentes.", "info");
    }
  } catch (err) {
    showInvalid(err.message || t("invalid_default"));
  }
}

async function loadSessionUser() {
  const { data } = await supabaseClient.auth.getUser().catch(() => ({ data: null }));
  state.sessionUser = data?.user || null;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

(async function init() {
  // Apply saved language immediately
  applyTranslations();

  // Wire up forms & buttons
  document.getElementById("accountForm")?.addEventListener("submit", submitAccount);
  submitIntakeBtn?.addEventListener("click", submitIntake);
  goToClientPortalBtn?.addEventListener("click", () => { window.location.href = "/client.html"; });
  addListingBtn?.addEventListener("click", () => addListingCard());

  // Seed first listing card
  addListingCard();

  // Tags + chips
  initMarketsTagInput();
  initPropertyTypeChips();

  // Load remote data
  await loadSessionUser().catch(() => {});
  await loadLocations().catch(() => {});
  await validateInvitation();
})();
