const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY = "sb_publishable_103-rw3MwM7k2xUeMMUodg_fRr9vUD4";
// Meme origine que la page courante, comme CLIENT_APP_URL. Un domaine code
// en dur force un saut inutile et casse des que ce domaine change.
const EMPLOYEE_APP_URL = "";
// Meme origine que la page courante. L'admin, l'app employe et le portail
// client sont servis par le meme serveur, donc un chemin relatif marche
// partout. Le domaine etait code en dur ici, et son certificat expire
// renvoyait les clients sur une page blanche des la connexion.
const CLIENT_APP_URL = "";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabs = {
  dashboard: document.getElementById("dashboardTab"),
  apartments: document.getElementById("apartmentsTab"),
  candidates: document.getElementById("candidatesTab"),
  criteria: document.getElementById("criteriaTab")
};

const clientAuthShell = document.getElementById("clientAuthShell");
const clientLoginForm = document.getElementById("clientLoginForm");
const clientLoginEmail = document.getElementById("clientLoginEmail");
const clientLoginPassword = document.getElementById("clientLoginPassword");
const clientLoginSubmit = document.getElementById("clientLoginSubmit");
const clientLoginStatus = document.getElementById("clientLoginStatus");
const clientShell = document.getElementById("clientShell");
const pageTitle = document.getElementById("pageTitle");
const clientMeta = document.getElementById("clientMeta");
const refreshBtn = document.getElementById("refreshBtn");
const apartmentsSupervisionSummary = document.getElementById("apartmentsSupervisionSummary");
const apartmentsBody = document.getElementById("apartmentsBody");
const candidatesReviewSummary = document.getElementById("candidatesReviewSummary");
const candidatesBody = document.getElementById("candidatesBody");
const criteriaForm = document.getElementById("criteriaForm");
const criteriaStatus = document.getElementById("criteriaStatus");

const statTotalApartments = document.getElementById("statTotalApartments");
const statAvailableApartments = document.getElementById("statAvailableApartments");
const statCandidates = document.getElementById("statCandidates");
const statDecisionSplit = document.getElementById("statDecisionSplit");
const statTotalApartmentsTrend = document.getElementById("statTotalApartmentsTrend");
const statAvailableApartmentsTrend = document.getElementById("statAvailableApartmentsTrend");
const statCandidatesTrend = document.getElementById("statCandidatesTrend");
const statDecisionSplitTrend = document.getElementById("statDecisionSplitTrend");
const dashboardDecisionQueue = document.getElementById("dashboardDecisionQueue");
const dashboardApartmentOverview = document.getElementById("dashboardApartmentOverview");
const dashboardCriteriaSummary = document.getElementById("dashboardCriteriaSummary");
const dashboardWatchlist = document.getElementById("dashboardWatchlist");

const candidateModal = document.getElementById("candidateModal");
const closeCandidateModalBtn = document.getElementById("closeCandidateModalBtn");
const candidateModalTitle = document.getElementById("candidateModalTitle");
const candidateDetailGrid = document.getElementById("candidateDetailGrid");
const candidatePassReasons = document.getElementById("candidatePassReasons");
const candidateFailReasons = document.getElementById("candidateFailReasons");

const state = {
  currentTab: "dashboard",
  currentUser: null,
  currentSession: null,
  clientId: "",
  client: null,
  apartments: [],
  candidates: [],
  dashboardTableState: {
    query: "",
    status: "Tous",
    sortKey: "score",
    sortDirection: "desc"
  },
  candidatesTableState: {
    query: "",
    status: "Tous",
    sortKey: "score",
    sortDirection: "desc"
  },
  activeCandidateMenuId: ""
};

function isClientDomain() {
  return String(window.location.hostname || "").trim().toLowerCase() === "client.fluxlocatif.com";
}

function isPreviewSafeClientHost() {
  const hostname = String(window.location.hostname || "").trim().toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".up.railway.app")
  );
}

function redirectToClientPortalEntry() {
  const targetPath = "/client.html";
  if (isPreviewSafeClientHost()) {
    return false;
  }

  const targetUrl = `${CLIENT_APP_URL}${targetPath}`;
  const currentPath = String(window.location.pathname || "").trim() || "/";

  if (isClientDomain() && currentPath === targetPath) {
    return false;
  }

  window.location.href = targetUrl;
  return true;
}

function showClientLoginScreen(message = "", type = "") {
  if (clientAuthShell) {
    clientAuthShell.classList.remove("hidden");
  }

  if (clientShell) {
    clientShell.classList.add("client-shell-hidden");
  }

  if (clientLoginStatus) {
    clientLoginStatus.textContent = message;
    clientLoginStatus.style.color = type === "error" ? "#991b1b" : type === "success" ? "#166534" : "";
  }
}

function showClientPortalScreen() {
  if (clientAuthShell) {
    clientAuthShell.classList.add("hidden");
  }

  if (clientShell) {
    clientShell.classList.remove("client-shell-hidden");
  }

  if (clientLoginStatus) {
    clientLoginStatus.textContent = "";
    clientLoginStatus.style.color = "";
  }
}

function setCriteriaStatus(message = "", type = "") {
  if (!criteriaStatus) return;
  criteriaStatus.textContent = message;
  criteriaStatus.style.color = type === "error" ? "#991b1b" : type === "success" ? "#166534" : "";
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toYesNo(value) {
  if (value === true) return "oui";
  if (value === false) return "non";
  return "";
}

function fromYesNo(value) {
  if (value === "oui") return true;
  if (value === "non") return false;
  return null;
}

// Les loyers sont stockes tantot deja formates ("1 250 $"), tantot en chiffres
// bruts ("1600"). L'ancien code ajoutait un symbole dans tous les cas, d'ou
// "1 250 $ $" d'un cote et "1600 $" sans separateur de l'autre.
function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";

  const chiffres = String(value).replace(/[^\d,.-]/g, "").replace(/\s/g, "").replace(",", ".");
  const nombre = Number(chiffres);

  if (!Number.isFinite(nombre) || chiffres === "") return String(value);

  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(nombre);
}

function formatDisplayDate(value) {
  if (!value) return "";
  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return "";
  }

  const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parsed);
}

function getAvailabilityMeta(value) {
  if (value === null || value === undefined || value === "") {
    return {
      label: "Non précisé",
      tone: "neutral"
    };
  }

  const rawValue = String(value).trim();
  const normalized = rawValue.toLowerCase();
  const formattedDate = formatDisplayDate(rawValue);

  if (formattedDate) {
    return {
      label: `Dès le ${formattedDate}`,
      tone: "info"
    };
  }

  if (/immédiat|immediat/.test(normalized)) {
    return {
      label: "Disponible maintenant",
      tone: "positive"
    };
  }

  if (/disponible/.test(normalized)) {
    return {
      label: "Disponible",
      tone: "positive"
    };
  }

  if (/loué|loue|indisponible|occupé|occupe/.test(normalized)) {
    return {
      label: "Non disponible",
      tone: "danger"
    };
  }

  return {
    label: rawValue,
    tone: "neutral"
  };
}

function getScoreMeta(score) {
  if (score === null || score === undefined || String(score).trim() === "") {
    return {
      label: "-",
      className: "score-mid"
    };
  }

  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return {
      label: "-",
      className: "score-mid"
    };
  }

  if (numericScore >= 80) {
    return {
      label: String(numericScore),
      className: ""
    };
  }

  if (numericScore >= 60) {
    return {
      label: String(numericScore),
      className: "score-mid"
    };
  }

  return {
    label: String(numericScore),
    className: "score-low"
  };
}

function getMatchMeta(matchStatus) {
  const normalized = String(matchStatus || "").trim().toLowerCase();

  if (!normalized || normalized === "refusé" || normalized === "refuse") {
    return {
      label: "À confirmer",
      tone: "neutral"
    };
  }

  return {
    label: "Aligné",
    tone: "positive"
  };
}

function getCandidateStatusMeta(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (/approuv/.test(normalized)) {
    return {
      label: "Approuvé",
      tone: "positive"
    };
  }

  if (/refus/.test(normalized)) {
    return {
      label: "Refusé",
      tone: "danger"
    };
  }

  if (/attente/.test(normalized)) {
    return {
      label: "En attente",
      tone: "warning"
    };
  }

  if (/visite/.test(normalized)) {
    return {
      label: "Visite",
      tone: "info"
    };
  }

  return {
    label: status || "En revue",
    tone: "neutral"
  };
}

function getCandidateScoreValue(candidate) {
  const rawScore = candidate?.match_score;

  if (rawScore === null || rawScore === undefined || String(rawScore).trim() === "") {
    return -1;
  }

  const value = Number(rawScore);
  return Number.isFinite(value) ? value : -1;
}

function getCandidateRevenueValue(candidate) {
  const rawIncome = candidate?.revenu || candidate?.monthly_income;

  if (rawIncome === null || rawIncome === undefined || String(rawIncome).trim() === "") {
    return -1;
  }

  const rawString = String(rawIncome).trim().toLowerCase();
  const numericValue = Number(rawString.replace(/[^\d.-]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return -1;
  }

  return /k\b/.test(rawString) ? numericValue * 1000 : numericValue;
}

// Le revenu etait arrondi au millier: 3 200 $ s'affichait "3k$", alors que la
// fiche du candidat montrait la valeur exacte. Le tableau et la fiche se
// contredisaient, et le tri se faisait sur la valeur reelle.
function formatCandidateRevenue(candidate) {
  const revenue = getCandidateRevenueValue(candidate);
  if (revenue < 0) return "—";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(revenue);
}

function getCandidateInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "CA";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

// Convertit un seuil de credit herite en palier du formulaire.
function paliersDeCredit(value) {
  if (value === null || value === undefined || value === "") return "";

  const texte = String(value).trim().toLowerCase();
  if (["bas", "moyen", "haut"].includes(texte)) return texte;

  const nombre = Number(texte.replace(/[^\d]/g, ""));
  if (!Number.isFinite(nombre) || nombre <= 0) return "";
  if (nombre >= 700) return "haut";
  if (nombre >= 600) return "moyen";
  return "bas";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDashboardCandidateStatusMeta(candidate) {
  const normalized = String(candidate?.status || "").trim().toLowerCase();

  if (/refus/.test(normalized)) {
    return { label: "Refusé", tone: "danger" };
  }

  if (/approuv|accept/.test(normalized)) {
    return { label: "Vérifié", tone: "positive" };
  }

  if (/attente/.test(normalized)) {
    return { label: "Attente", tone: "warning" };
  }

  return { label: "En cours", tone: "info" };
}

function getCandidateScoreDisplayMeta(candidate) {
  const score = getCandidateScoreValue(candidate);

  if (score < 0) {
    return {
      value: 0,
      label: "—",
      className: "low"
    };
  }

  if (score >= 80) {
    return {
      value: Math.max(0, Math.min(100, score)),
      label: String(score),
      className: "high"
    };
  }

  if (score >= 60) {
    return {
      value: Math.max(0, Math.min(100, score)),
      label: String(score),
      className: "mid"
    };
  }

  return {
    value: Math.max(0, Math.min(100, score)),
    label: String(score),
    className: "low"
  };
}

function getCandidateTableStatusOptions() {
  return ["Tous", "En cours", "Attente", "Vérifié", "Refusé"];
}

function matchesCandidateTableStatus(candidate, statusFilter) {
  if (!statusFilter || statusFilter === "Tous") {
    return true;
  }

  return getDashboardCandidateStatusMeta(candidate).label === statusFilter;
}

function filterCandidateRows(candidates = [], tableState) {
  const query = String(tableState?.query || "").trim().toLowerCase();
  const status = String(tableState?.status || "Tous").trim();

  return candidates.filter((candidate) => {
    const apartment = getApartmentByRef(candidate.apartment_ref);
    const apartmentLabel = (apartment?.adresse || formatApartmentLabel(candidate.apartment_ref)).toLowerCase();
    const candidateName = String(candidate?.candidate_name || "").toLowerCase();
    const queryMatches = !query || candidateName.includes(query) || apartmentLabel.includes(query);

    return queryMatches && matchesCandidateTableStatus(candidate, status);
  });
}

function sortCandidateRows(candidates = [], tableState) {
  const sortKey = tableState?.sortKey || "score";
  const direction = tableState?.sortDirection === "asc" ? 1 : -1;

  return candidates.slice().sort((left, right) => {
    if (sortKey === "income") {
      return (getCandidateRevenueValue(left) - getCandidateRevenueValue(right)) * direction;
    }

    if (sortKey === "score") {
      return (getCandidateScoreValue(left) - getCandidateScoreValue(right)) * direction;
    }

    return String(left?.candidate_name || "").localeCompare(String(right?.candidate_name || ""), "fr") * direction;
  });
}

function updateCandidateTableState(key, patch = {}) {
  state[key] = {
    ...state[key],
    ...patch
  };
}

function getCandidateTableSortIndicator(tableState, key) {
  if (tableState?.sortKey !== key) {
    return "↑↓";
  }

  return tableState.sortDirection === "asc" ? "↑" : "↓";
}

// Le badge affichait autrefois un pourcentage calcule a partir de la valeur
// courante, donc fabrique. Il a ete vide, puis il ne restait qu'un tiret sans
// signification sur les quatre tuiles. Il porte maintenant une information
// reelle et verifiable, tiree des memes donnees que le chiffre principal.
function setStatTrend(element, texte) {
  if (!element) return;

  element.className = "stat-context";
  element.innerHTML = texte || "";
}

function getCandidateTableRows(candidates = [], tableState, limit = null) {
  const filteredRows = filterCandidateRows(candidates, tableState);
  const sortedRows = sortCandidateRows(filteredRows, tableState);

  if (Number.isFinite(limit) && limit > 0) {
    return sortedRows.slice(0, limit);
  }

  return sortedRows;
}

function closeCandidateActionMenus() {
  state.activeCandidateMenuId = "";
  document.querySelectorAll("[data-candidate-action-menu]").forEach((menu) => {
    menu.classList.add("hidden");
  });
}

// Le sous-titre affichait "Dossier structure" sur toutes les lignes, identique
// partout et sans information. On indique plutot ce que le dossier contient
// vraiment, pour que le proprietaire sache s'il est complet avant de l'ouvrir.
function resumeDossier(candidate) {
  const champs = [
    candidate?.candidate_name,
    candidate?.phone,
    candidate?.email,
    candidate?.monthly_income ?? candidate?.revenu_mensuel,
    candidate?.credit_level ?? candidate?.credit,
    candidate?.employment_status ?? candidate?.statut_emploi,
    candidate?.occupants_total ?? candidate?.nombre_personnes
  ];

  const fournis = champs.filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length;

  if (fournis === champs.length) return "Dossier complet";
  if (fournis === 0) return "Dossier vide";
  return `${fournis} renseignements sur ${champs.length}`;
}

function renderCandidateViews() {
  renderDashboard();
  renderApartments();
  renderCandidates();
}

async function handleCandidateTableAction(action, candidateId, rerender) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) return;

  if (action === "view") {
    openCandidateModal(candidate);
    closeCandidateActionMenus();
    return;
  }

  const nextStatus = action === "approve" ? "approuvé" : action === "reject" ? "refusé" : "";
  if (!nextStatus) return;

  const previousStatus = candidate.status;

  // Affichage optimiste, puis persistance. En cas d'echec on remet l'ancien
  // statut et on recharge, pour ne jamais laisser une decision non enregistree
  // a l'ecran.
  candidate.status = nextStatus;
  closeCandidateActionMenus();
  renderCandidateViews();

  try {
    const result = await fetchClientJSON(`/api/client/candidates/${encodeURIComponent(candidateId)}`, {
      method: "PUT",
      body: JSON.stringify({ status: nextStatus })
    });

    if (result?.candidate?.status) {
      candidate.status = result.candidate.status;
      renderCandidateViews();
    }
  } catch (error) {
    candidate.status = previousStatus;
    renderCandidateViews();
    window.alert(error?.message || "Impossible d’enregistrer la décision. Réessayez.");
    await loadClientData().catch(() => {});
  }
}

function bindCandidateTableInteractions(container, stateKey, rerender) {
  if (!container) return;

  const searchInput = container.querySelector("[data-candidate-table-search]");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      // rerender() reconstruit tout le innerHTML du conteneur, donc le champ
      // etait detruit a chaque caractere et le focus perdu: impossible de taper
      // plus d'une lettre. On memorise la position du curseur et on la restaure
      // sur le nouveau champ apres le rendu.
      const position = event.target.selectionStart;
      updateCandidateTableState(stateKey, { query: event.target.value || "" });
      rerender();

      const nouveauChamp = document.querySelector(`#${container.id} [data-candidate-table-search]`)
        || container.querySelector("[data-candidate-table-search]");
      if (nouveauChamp) {
        nouveauChamp.focus();
        try {
          nouveauChamp.setSelectionRange(position, position);
        } catch {
          // certains types de champ n'acceptent pas setSelectionRange
        }
      }
    });
  }

  // Le bouton "Filtrer" n'avait aucun listener. Il ouvre desormais la rangee de
  // pastilles de statut, qui est le filtre reel de ce tableau.
  const filterBtn = container.querySelector(".candidate-table-filter-btn");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      const pills = container.querySelector(".candidate-status-filters");
      if (pills) {
        pills.classList.toggle("hidden");
        filterBtn.setAttribute("aria-expanded", String(!pills.classList.contains("hidden")));
      }
    });
  }

  container.querySelectorAll("[data-candidate-status-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      updateCandidateTableState(stateKey, { status: button.dataset.candidateStatusFilter || "Tous" });
      rerender();
    });
  });

  container.querySelectorAll("[data-candidate-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextSortKey = button.dataset.candidateSort || "score";
      const currentState = state[stateKey] || {};
      const nextDirection =
        currentState.sortKey === nextSortKey && currentState.sortDirection === "desc" ? "asc" : "desc";

      updateCandidateTableState(stateKey, {
        sortKey: nextSortKey,
        sortDirection: nextDirection
      });
      rerender();
    });
  });

  container.querySelectorAll("[data-candidate-menu-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const menuId = button.dataset.candidateMenuToggle || "";
      const nextId = state.activeCandidateMenuId === menuId ? "" : menuId;

      state.activeCandidateMenuId = nextId;
      container.querySelectorAll("[data-candidate-action-menu]").forEach((menu) => {
        menu.classList.toggle("hidden", menu.dataset.candidateActionMenu !== nextId);
      });
    });
  });

  container.querySelectorAll("[data-candidate-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleCandidateTableAction(button.dataset.candidateAction, button.dataset.id, rerender);
    });
  });
}

function renderCandidateTable(container, candidates = [], options = {}) {
  if (!container) return;

  const {
    stateKey = "candidatesTableState",
    title = "Dossiers récents",
    limit = null,
    emptyMessage = "Aucun dossier à afficher pour le moment."
  } = options;

  const tableState = state[stateKey] || state.candidatesTableState;
  const visibleRows = getCandidateTableRows(candidates, tableState, limit);
  const totalFilteredCount = filterCandidateRows(candidates, tableState).length;
  const dashboardLimitApplied = Number.isFinite(limit) && limit > 0 && totalFilteredCount > visibleRows.length;

  container.innerHTML = `
    <div class="candidate-table-shell">
      <div class="candidate-table-toolbar">
        <div class="panel-kicker">${title}</div>
        <div class="candidate-table-search-row">
          <label class="candidate-table-search">
            <input
              type="text"
              value="${escapeHtml(tableState.query || "")}"
              placeholder="Rechercher un candidat ou une propriété..."
              data-candidate-table-search="${stateKey}"
            />
          </label>
          <button type="button" class="candidate-table-filter-btn">
            <span>Filtrer</span>
            <span aria-hidden="true">⌕</span>
          </button>
        </div>
        <div class="candidate-status-filters">
          ${getCandidateTableStatusOptions().map((status) => `
            <button
              type="button"
              class="candidate-filter-pill${tableState.status === status ? " active" : ""}"
              data-candidate-status-filter="${status}"
            >
              ${status}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="candidate-table-wrap">
        <table class="candidate-table">
          <!-- Les largeurs sont declarees ici et le tableau est en
               table-layout: fixed (client.css). Sans ca, l'algorithme "auto"
               redistribuait les colonnes selon le contenu de chaque rendu:
               en dessous d'environ 1100px la somme des largeurs minimales
               depassait le min-width du tableau et les en-tetes STATUT et
               SCORE se chevauchaient. -->
          <colgroup>
            <col class="col-candidat" />
            <col class="col-propriete" />
            <col class="col-revenu" />
            <col class="col-statut" />
            <col class="col-score" />
            <col class="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Candidat</th>
              <th>Propriété</th>
              <th>
                <button type="button" class="candidate-sort-btn" data-candidate-sort="income">
                  <span>Revenu</span>
                  <span class="candidate-sort-indicator${tableState.sortKey === "income" ? " active" : ""}">${getCandidateTableSortIndicator(tableState, "income")}</span>
                </button>
              </th>
              <th>Statut</th>
              <th>
                <button type="button" class="candidate-sort-btn" data-candidate-sort="score">
                  <span>Score</span>
                  <span class="candidate-sort-indicator${tableState.sortKey === "score" ? " active" : ""}">${getCandidateTableSortIndicator(tableState, "score")}</span>
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              visibleRows.length
                ? visibleRows.map((candidate) => {
                    const apartment = getApartmentByRef(candidate.apartment_ref);
                    const apartmentLabel = apartment?.adresse || formatApartmentLabel(candidate.apartment_ref);
                    const statusMeta = getDashboardCandidateStatusMeta(candidate);
                    const scoreMeta = getCandidateScoreDisplayMeta(candidate);

                    return `
                      <tr>
                        <td>
                          <div class="candidate-identity">
                            <div class="candidate-initials">${getCandidateInitials(candidate.candidate_name)}</div>
                            <div class="candidate-identity-copy">
                              <div class="candidate-identity-name">${escapeHtml(candidate.candidate_name || "Nom non fourni")}</div>
                              <div class="candidate-identity-subtitle">${escapeHtml(resumeDossier(candidate))}</div>
                            </div>
                          </div>
                        </td>
                        <td class="candidate-property-cell">${escapeHtml(apartmentLabel)}</td>
                        <td class="candidate-income-cell">${formatCandidateRevenue(candidate)}</td>
                        <td><span class="status-pill ${statusMeta.tone}">${statusMeta.label}</span></td>
                        <td class="candidate-score-cell">
                          <div class="candidate-score-display">
                            <div class="candidate-score-track">
                              <div class="candidate-score-fill ${scoreMeta.className}" style="width:${scoreMeta.value}%"></div>
                            </div>
                            <div class="candidate-score-number">${scoreMeta.label}</div>
                          </div>
                        </td>
                        <td class="candidate-action-cell">
                          <div class="candidate-action-menu-shell">
                            <button
                              type="button"
                              class="candidate-action-btn"
                              data-candidate-menu-toggle="${candidate.id}"
                              aria-label="Actions pour ${escapeHtml(candidate.candidate_name || "ce dossier")}"
                            >
                              ···
                            </button>
                            <div
                              class="candidate-action-menu${state.activeCandidateMenuId === candidate.id ? "" : " hidden"}"
                              data-candidate-action-menu="${candidate.id}"
                            >
                              <button type="button" class="candidate-action-option" data-candidate-action="view" data-id="${candidate.id}">Voir le dossier</button>
                              <button type="button" class="candidate-action-option" data-candidate-action="approve" data-id="${candidate.id}">Approuver</button>
                              <button type="button" class="candidate-action-option" data-candidate-action="reject" data-id="${candidate.id}">Refuser</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")
                : `
                  <tr>
                    <td colspan="6" class="candidate-table-empty">${emptyMessage}</td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>
      ${
        dashboardLimitApplied
          ? `<div class="candidate-identity-subtitle">Aperçu limité aux ${visibleRows.length} premiers dossiers correspondant aux filtres.</div>`
          : ""
      }
    </div>
  `;

  bindCandidateTableInteractions(container, stateKey, () => renderCandidateTable(container, candidates, options));

  if (container._candidateOutsideClickHandler) {
    document.removeEventListener("click", container._candidateOutsideClickHandler);
  }

  const outsideClickHandler = (event) => {
    if (!container.contains(event.target)) {
      closeCandidateActionMenus();
      document.removeEventListener("click", outsideClickHandler);
      container._candidateOutsideClickHandler = null;
    }
  };

  container._candidateOutsideClickHandler = outsideClickHandler;
  document.addEventListener("click", outsideClickHandler);
}

function getApartmentCandidates(apartmentRef) {
  return state.candidates.filter(
    (candidate) => normalizeRef(candidate.apartment_ref) === normalizeRef(apartmentRef)
  );
}

function getApartmentByRef(apartmentRef) {
  return state.apartments.find((apartment) => normalizeRef(apartment.ref) === normalizeRef(apartmentRef)) || null;
}

function getBestCandidateForApartment(apartmentRef) {
  return getApartmentCandidates(apartmentRef)
    .slice()
    .sort((a, b) => getCandidateScoreValue(b) - getCandidateScoreValue(a))[0] || null;
}

function deriveApartmentStage(apartment, candidates = []) {
  const availabilityMeta = getAvailabilityMeta(apartment?.disponibilite);
  const bestScore = candidates.reduce((max, candidate) => {
    return Math.max(max, getCandidateScoreValue(candidate));
  }, -1);

  if (availabilityMeta.tone === "danger") {
    return {
      label: "Non disponible",
      tone: "neutral"
    };
  }

  if (!candidates.length) {
    return {
      label: "Demandes à venir",
      tone: "neutral"
    };
  }

  if (bestScore >= 80) {
    return {
      label: "Dossiers à revoir",
      tone: "info"
    };
  }

  return {
    label: "Présélection en cours",
    tone: "warning"
  };
}

function getSafeStageMeta(stage) {
  return {
    label: stage?.label || "Statut à confirmer",
    tone: stage?.tone || "neutral"
  };
}

function deriveApartmentNextStep(apartment, candidates = []) {
  const availabilityMeta = getAvailabilityMeta(apartment?.disponibilite);
  const bestCandidate = getBestCandidateForApartment(apartment?.ref);

  if (availabilityMeta.tone === "danger") {
    return "Aucune action immédiate pour cette unité.";
  }

  if (!candidates.length) {
    return "Nous continuons la réception des demandes.";
  }

  if (bestCandidate && getCandidateScoreValue(bestCandidate) >= 80) {
    return "Des dossiers méritent votre attention.";
  }

  return "Le tri des dossiers se poursuit avant revue.";
}

function deriveApartmentNeedsAttention(apartment, candidates = []) {
  const availabilityMeta = getAvailabilityMeta(apartment?.disponibilite);
  const bestCandidate = getBestCandidateForApartment(apartment?.ref);
  const bestScore = bestCandidate ? getCandidateScoreValue(bestCandidate) : -1;

  if (availabilityMeta.tone === "danger") {
    return false;
  }

  if (!candidates.length) {
    return true;
  }

  return bestScore < 70;
}

function deriveCandidatePriority(candidate) {
  const score = getCandidateScoreValue(candidate);
  const statusMeta = getCandidateStatusMeta(candidate?.status);

  if (statusMeta.tone === "danger" || statusMeta.tone === "positive") {
    return "low";
  }

  if (score >= 80) {
    return "high";
  }

  if (score >= 60) {
    return "medium";
  }

  return "low";
}

function deriveCandidateRecommendation(candidate) {
  const priority = deriveCandidatePriority(candidate);

  if (priority === "high") {
    return {
      label: "À revoir",
      tone: "info"
    };
  }

  if (priority === "medium") {
    return {
      label: "Bon potentiel",
      tone: "positive"
    };
  }

  return {
    label: "À surveiller",
    tone: "neutral"
  };
}

const RESPONSIBILITY_LABELS = {
  CLIENT: "En attente du client",
  TEAM: "Pris en charge par l’équipe",
  WATCH: "À surveiller",
  DONE: "Complété"
};

function getResponsibilityVisual(label) {
  switch (label) {
    case RESPONSIBILITY_LABELS.CLIENT:
      return { tone: "info", className: "client" };
    case RESPONSIBILITY_LABELS.TEAM:
      return { tone: "positive", className: "team" };
    case RESPONSIBILITY_LABELS.WATCH:
      return { tone: "warning", className: "watch" };
    case RESPONSIBILITY_LABELS.DONE:
    default:
      return { tone: "neutral", className: "done" };
  }
}

function hasCompletedCandidateStatus(candidate) {
  const tone = getCandidateStatusMeta(candidate?.status).tone;
  return tone === "positive" || tone === "danger";
}

function getOpenCandidates(candidates = []) {
  return candidates.filter((candidate) => !hasCompletedCandidateStatus(candidate));
}

function hasMaterialNegativeReasons(candidate) {
  const riskReasons = getCandidateReasonGroups(candidate).risks.map((reason) => String(reason || "").toLowerCase());
  return riskReasons.some((reason) =>
    /crédit faible|credit faible|tal défavorable|tal defavorable|revenu insuffisant|refus|défavorable|defavorable|faible/.test(reason)
  );
}

function deriveApartmentResponsibility(apartment, candidates = []) {
  const availabilityMeta = getAvailabilityMeta(apartment?.disponibilite);
  const openCandidates = getOpenCandidates(candidates);
  const bestCandidate = openCandidates
    .slice()
    .sort((a, b) => getCandidateScoreValue(b) - getCandidateScoreValue(a))[0] || null;
  const bestScore = bestCandidate ? getCandidateScoreValue(bestCandidate) : -1;

  if (availabilityMeta.tone === "danger") {
    return RESPONSIBILITY_LABELS.DONE;
  }

  if (candidates.length > 0 && !openCandidates.length) {
    return RESPONSIBILITY_LABELS.DONE;
  }

  if (bestScore >= 80 && bestCandidate && !hasMaterialNegativeReasons(bestCandidate)) {
    return RESPONSIBILITY_LABELS.CLIENT;
  }

  if (!openCandidates.length || bestScore < 70) {
    return RESPONSIBILITY_LABELS.WATCH;
  }

  return RESPONSIBILITY_LABELS.TEAM;
}

function deriveApartmentResponsibilityReason(apartment, candidates = []) {
  const responsibility = deriveApartmentResponsibility(apartment, candidates);

  if (responsibility === RESPONSIBILITY_LABELS.DONE) {
    return candidates.length > 0 && !getOpenCandidates(candidates).length
      ? "Tous les dossiers liés sont déjà traités."
      : "Le logement n’est plus actif dans le cycle de relocation.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.CLIENT) {
    return "Des dossiers solides sont prêts à être revus.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.TEAM) {
    return "L’équipe poursuit encore le tri et la présélection.";
  }

  if (!candidates.length) {
    return "Aucun dossier n’est encore visible pour cette unité.";
  }

  return "Les dossiers reçus restent encore faibles ou peu alignés.";
}

function deriveApartmentNextAction(apartment, candidates = []) {
  const responsibility = deriveApartmentResponsibility(apartment, candidates);

  if (responsibility === RESPONSIBILITY_LABELS.DONE) {
    return "Aucune action requise.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.CLIENT) {
    return "Revoir les meilleurs dossiers reçus.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.TEAM) {
    return "Nous poursuivons la présélection avant de vous solliciter.";
  }

  if (!candidates.length) {
    return "Surveiller l’arrivée de nouvelles candidatures.";
  }

  return "Surveiller la qualité des prochains dossiers.";
}

function getApartmentResponsibilityMeta(apartment, candidates = []) {
  const label = deriveApartmentResponsibility(apartment, candidates);
  const visual = getResponsibilityVisual(label);

  return {
    label,
    tone: visual.tone,
    className: visual.className,
    reason: deriveApartmentResponsibilityReason(apartment, candidates),
    nextStep: deriveApartmentNextAction(apartment, candidates)
  };
}

function deriveCandidateResponsibility(candidate) {
  const statusMeta = getCandidateStatusMeta(candidate?.status);
  const score = getCandidateScoreValue(candidate);
  const matchMeta = getMatchMeta(candidate?.match_status);
  const hasNegativeReasons = hasMaterialNegativeReasons(candidate);

  if (statusMeta.tone === "positive" || statusMeta.tone === "danger") {
    return RESPONSIBILITY_LABELS.DONE;
  }

  if (score < 0) {
    return RESPONSIBILITY_LABELS.WATCH;
  }

  if (score >= 80 && !hasNegativeReasons) {
    return RESPONSIBILITY_LABELS.CLIENT;
  }

  if ((score >= 60 || matchMeta.tone === "positive") && !hasNegativeReasons) {
    return RESPONSIBILITY_LABELS.TEAM;
  }

  return RESPONSIBILITY_LABELS.WATCH;
}

function deriveCandidateResponsibilityReason(candidate) {
  const responsibility = deriveCandidateResponsibility(candidate);
  const statusMeta = getCandidateStatusMeta(candidate?.status);

  if (responsibility === RESPONSIBILITY_LABELS.DONE) {
    return statusMeta.tone === "positive"
      ? "Le dossier a déjà été validé."
      : "Le dossier a déjà été traité.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.CLIENT) {
    return "Le dossier ressort suffisamment pour une revue de votre part.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.TEAM) {
    return "L’équipe poursuit encore l’analyse de ce dossier.";
  }

  if (getCandidateScoreValue(candidate) < 0) {
    return "Le dossier reste incomplet pour le moment.";
  }

  if (hasMaterialNegativeReasons(candidate)) {
    return "Le dossier comporte encore des points sensibles à clarifier.";
  }

  return "Le dossier reste secondaire à ce stade.";
}

function deriveCandidateNextAction(candidate) {
  const responsibility = deriveCandidateResponsibility(candidate);

  if (responsibility === RESPONSIBILITY_LABELS.DONE) {
    return "Aucune action requise.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.CLIENT) {
    return "Revoir ce dossier plus en détail.";
  }

  if (responsibility === RESPONSIBILITY_LABELS.TEAM) {
    return "Nous poursuivons l’analyse avant de vous solliciter.";
  }

  if (getCandidateScoreValue(candidate) < 0) {
    return "Attendre davantage d’éléments avant revue.";
  }

  return "Conserver ce dossier en suivi secondaire.";
}

function getCandidateResponsibilityMeta(candidate) {
  const label = deriveCandidateResponsibility(candidate);
  const visual = getResponsibilityVisual(label);

  return {
    label,
    tone: visual.tone,
    className: visual.className,
    reason: deriveCandidateResponsibilityReason(candidate),
    nextStep: deriveCandidateNextAction(candidate)
  };
}

function getCandidateReasonGroups(candidate) {
  const reasons = Array.isArray(candidate?.match_reasons) ? candidate.match_reasons.filter(Boolean) : [];
  return {
    strengths: reasons.filter(isPositiveReason),
    risks: reasons.filter((reason) => !isPositiveReason(reason))
  };
}

function deriveCandidateReviewSection(candidate) {
  const priority = deriveCandidatePriority(candidate);

  if (priority === "high") {
    return "review";
  }

  if (priority === "medium") {
    return "recommended";
  }

  return "other";
}

function deriveCandidateFocusNote(candidate) {
  const statusMeta = getCandidateStatusMeta(candidate?.status);
  const section = deriveCandidateReviewSection(candidate);
  const score = getCandidateScoreValue(candidate);

  if (statusMeta.tone === "positive") {
    return "Dossier déjà validé, conservé pour suivi.";
  }

  if (statusMeta.tone === "danger") {
    return "Dossier conservé pour référence, sans priorité immédiate.";
  }

  if (section === "review") {
    return "Ce dossier mérite une revue prioritaire.";
  }

  if (section === "recommended") {
    return score >= 80
      ? "Profil solide, proche d’un dossier prioritaire."
      : "Profil prometteur, avec quelques points à confirmer.";
  }

  if (score < 0) {
    return "Évaluation encore en cours.";
  }

  return "À garder en suivi secondaire pour le moment.";
}

function groupCandidatesForWorkspace(candidates = []) {
  const groups = {
    review: [],
    recommended: [],
    other: []
  };

  candidates
    .slice()
    .sort((a, b) => {
      const sectionOrder = { review: 0, recommended: 1, other: 2 };
      const sectionCompare =
        (sectionOrder[deriveCandidateReviewSection(a)] ?? 3) - (sectionOrder[deriveCandidateReviewSection(b)] ?? 3);

      if (sectionCompare !== 0) {
        return sectionCompare;
      }

      return getCandidateScoreValue(b) - getCandidateScoreValue(a);
    })
    .forEach((candidate) => {
      groups[deriveCandidateReviewSection(candidate)].push(candidate);
    });

  return groups;
}

function deriveDecisionQueue(candidates = []) {
  return candidates
    .filter((candidate) => deriveCandidateResponsibility(candidate) === RESPONSIBILITY_LABELS.CLIENT)
    .sort((a, b) => getCandidateScoreValue(b) - getCandidateScoreValue(a))
    .slice(0, 3);
}

function deriveWatchlist(apartments = []) {
  return apartments
    .map((apartment) => {
      const candidates = getApartmentCandidates(apartment.ref);
      const responsibility = getApartmentResponsibilityMeta(apartment, candidates);
      const stage = getSafeStageMeta(deriveApartmentStage(apartment, candidates));

      return {
        apartment,
        candidates,
        responsibility,
        stage
      };
    })
    .filter((item) => item.responsibility.label === RESPONSIBILITY_LABELS.WATCH)
    .slice(0, 3);
}

function countStrongCandidates(candidates = []) {
  return candidates.filter((candidate) => getCandidateScoreValue(candidate) >= 80).length;
}

function getApartmentStrengthSummary(candidates = []) {
  if (!candidates.length) {
    return "Aucun dossier reçu pour le moment";
  }

  const strongCount = countStrongCandidates(candidates);
  const promisingCount = candidates.filter((candidate) => {
    const score = getCandidateScoreValue(candidate);
    return score >= 60 && score < 80;
  }).length;

  if (strongCount > 0) {
    return `${strongCount} dossier${strongCount > 1 ? "s" : ""} fort${strongCount > 1 ? "s" : ""} actuellement`;
  }

  if (promisingCount > 0) {
    return `${promisingCount} dossier${promisingCount > 1 ? "s" : ""} prometteur${promisingCount > 1 ? "s" : ""}`;
  }

  return "Aucun dossier fort actuellement";
}

function deriveApartmentAttentionMeta(apartment, candidates = []) {
  const availabilityMeta = getAvailabilityMeta(apartment?.disponibilite);
  const bestCandidate = getBestCandidateForApartment(apartment?.ref);
  const bestScore = bestCandidate ? getCandidateScoreValue(bestCandidate) : -1;

  if (availabilityMeta.tone === "danger") {
    return {
      label: "Aucune attention requise",
      tone: "low",
      note: "Le logement n’est pas actuellement à relouer."
    };
  }

  if (!candidates.length) {
    return {
      label: "À surveiller",
      tone: "high",
      note: "Aucun dossier n’a encore été reçu pour cette unité."
    };
  }

  if (bestScore >= 80) {
    return {
      label: "Attention utile",
      tone: "medium",
      note: "Des dossiers ressortent et pourront bientôt mériter votre avis."
    };
  }

  if (bestScore >= 60) {
    return {
      label: "Suivi en cours",
      tone: "medium",
      note: "La présélection avance, mais aucun dossier fort n’est encore confirmé."
    };
  }

  return {
    label: "À renforcer",
    tone: "high",
    note: "Les dossiers reçus restent encore faibles ou peu alignés."
  };
}

function normalizeRef(value) {
  return String(value || "").replace(/^L-/i, "").trim();
}

function formatApartmentLabel(apartmentRef) {
  const normalizedRef = normalizeRef(apartmentRef);
  const apartment = state.apartments.find((item) => normalizeRef(item.ref) === normalizedRef);
  if (!apartment) return `L-${apartmentRef || "-"}`;
  return `${apartment.adresse || `L-${apartment.ref}`}`;
}

function resolveClientId(user) {
  return String(
    // app_metadata seulement, comme le serveur depuis le correctif 1.3:
    // user_metadata est modifiable par l'utilisateur et peut etre perime.
    user?.app_metadata?.client_id ||
    user?.app_metadata?.clientId ||
    ""
  ).trim();
}

function resolveUserRole(user) {
  return String(
    user?.app_metadata?.role ||
    ""
  ).trim().toLowerCase();
}

function isPositiveReason(reason) {
  return /conforme|accepté|permis|autorisé/i.test(reason || "");
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Erreur");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function fetchClientJSON(url, options = {}) {
  const session = state.currentSession || await waitForActiveSession(1, 0);

  if (!session?.access_token) {
    throw new Error("Session client introuvable.");
  }

  return fetchJSON(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`
    }
  });
}

async function waitForActiveSession(maxAttempts = 10, delayMs = 150) {
  for (let index = 0; index < maxAttempts; index += 1) {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (data?.session) {
      return data.session;
    }

    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return null;
}

async function requireLogin() {
  const session = await waitForActiveSession();

  if (!session) {
    if (redirectToClientPortalEntry()) {
      throw new Error("Redirection vers le portail client.");
    }

    state.currentSession = null;
    state.currentUser = null;
    state.clientId = "";
    return null;
  }

  const user = session.user;
  state.currentSession = session;
  state.currentUser = user;
  state.clientId = resolveClientId(user);
  const role = resolveUserRole(user);

  // La racine de ce domaine est la page vitrine, pas la console employe. Ces
  // deux redirections envoyaient donc un admin ou un employe qui ouvre le
  // portail client droit sur la page de vente, sans explication. Les vraies
  // destinations sont /admin et /employee.
  if (role && role !== "client") {
    window.location.href = role === "admin" ? "/admin" : "/employee";
    throw new Error("Ce rôle ne peut pas utiliser le portail client.");
  }

  if (!state.clientId) {
    // Ni role ni client_id: c'est un membre du personnel. On verifie s'il est
    // admin avant de l'envoyer vers l'espace employe, pour ne pas le faire
    // rebondir d'une console a l'autre.
    let estAdmin = false;
    try {
      const { data } = await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      estAdmin = Boolean(data);
    } catch {
      estAdmin = false;
    }

    window.location.href = estAdmin ? "/admin" : "/employee";
    throw new Error("Ce compte n’est pas un compte client.");
  }

  return user;
}

function handleClientRouteFailure(error) {
  if (error?.status === 401) {
    if (redirectToClientPortalEntry()) {
      return;
    }

    showClientLoginScreen("Connexion client requise.", "error");
    return;
  }

  // Toute erreur autre qu'un 401 renvoyait le client sur la page de vente,
  // sans un mot d'explication. C'est ce qui se produisait quand /api/client/me
  // repondait 404. On affiche l'erreur et on le laisse sur son portail.
  console.error("Erreur portail client:", error);
  showClientLoginScreen(
    error?.message || "Le portail est momentanément indisponible. Réessayez dans un instant.",
    "error"
  );
}

// ── Recuperation de mot de passe ────────────────────────────────────────────
// Le SMTP de Supabase n'est pas configure, donc le flux natif n'envoie rien. Le
// serveur genere le lien et l'expedie par Resend. Quand l'utilisateur revient
// par ce lien, Supabase depose une session de type "recovery" dans l'URL, et on
// affiche le formulaire de nouveau mot de passe a la place de la connexion.

function afficherFormulaireNouveauMotDePasse() {
  document.getElementById("clientLoginForm")?.classList.add("hidden");
  document.getElementById("forgotPasswordBtn")?.classList.add("hidden");
  document.getElementById("resetPasswordForm")?.classList.remove("hidden");
  showClientLoginScreen("Lien vérifié. Choisissez votre nouveau mot de passe.", "success");
}

async function demanderReinitialisation() {
  const champ = document.getElementById("clientLoginEmail");
  const email = String(champ?.value || "").trim();

  if (!email || !email.includes("@")) {
    showClientLoginScreen("Entrez d’abord votre adresse courriel, puis cliquez à nouveau.", "error");
    champ?.focus();
    return;
  }

  const bouton = document.getElementById("forgotPasswordBtn");
  if (bouton) bouton.disabled = true;

  try {
    const reponse = await fetch("/api/client/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      throw new Error(data.error || "Demande impossible pour le moment.");
    }

    showClientLoginScreen(
      data.message || "Si un compte existe pour cette adresse, un courriel vient d’être envoyé.",
      "success"
    );
  } catch (error) {
    showClientLoginScreen(error.message || "Demande impossible pour le moment.", "error");
  } finally {
    if (bouton) bouton.disabled = false;
  }
}

async function enregistrerNouveauMotDePasse(event) {
  event.preventDefault();

  const valeur = document.getElementById("resetPasswordValue")?.value || "";
  const confirmation = document.getElementById("resetPasswordConfirm")?.value || "";

  if (valeur.length < 8) {
    showClientLoginScreen("Le mot de passe doit faire au moins 8 caractères.", "error");
    return;
  }

  if (valeur !== confirmation) {
    showClientLoginScreen("Les deux mots de passe ne correspondent pas.", "error");
    return;
  }

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: valeur });
    if (error) throw error;

    showClientLoginScreen("Mot de passe enregistré. Vous pouvez vous connecter.", "success");
    window.setTimeout(() => { window.location.href = "/client.html"; }, 1500);
  } catch (error) {
    showClientLoginScreen(error.message || "Impossible d’enregistrer le mot de passe.", "error");
  }
}

async function signInClient(event) {
  event.preventDefault();

  if (!clientLoginSubmit) return;

  clientLoginSubmit.disabled = true;
  showClientLoginScreen("", "");

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: String(clientLoginEmail?.value || "").trim(),
      password: String(clientLoginPassword?.value || "")
    });

    if (error) {
      throw error;
    }

    const user = await requireLogin();

    if (!user) {
      throw new Error("Session client introuvable.");
    }

    // La coquille et ses squelettes s'affichent AVANT l'appel reseau, sinon
    // le client reste sur un ecran vide le temps des trois requetes.
    showClientPortalScreen();
    switchTab("dashboard");
    renderLoadingSkeletons();

    await loadClientData();
  } catch (error) {
    setBusy(false);
    showClientLoginScreen(error.message || "Impossible de se connecter.", "error");
  } finally {
    clientLoginSubmit.disabled = false;
  }
}

function switchTab(tabName) {
  state.currentTab = tabName;

  Object.entries(tabs).forEach(([key, element]) => {
    if (!element) return;
    const isHidden = key !== tabName;
    element.classList.toggle("hidden", isHidden);
    element.hidden = isHidden;
  });

  document.querySelectorAll(".menu-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  const titles = {
    dashboard: "Tableau de bord",
    apartments: "Appartements",
    candidates: "Dossiers",
    criteria: "Critères"
  };

  pageTitle.textContent = titles[tabName] || "Client";
}

// ===================== ÉTATS DE CHARGEMENT =====================
// Le portail attendait la fin des trois appels reseau avant d'afficher quoi
// que ce soit: le client voyait une page blanche, puis tout d'un coup. On
// montre desormais la coquille tout de suite, remplie de blocs gris de la
// meme taille que le contenu attendu, pour qu'aucune ligne ne saute quand
// les vraies donnees arrivent.

function skeletonLines(count, options = {}) {
  const { widths = [], height = "" } = options;

  return Array.from({ length: count }, (_, index) => {
    const width = widths[index] || `${90 - index * 12}%`;
    return `<span class="flx-skeleton flx-skeleton-line ${height}" style="width:${width}"></span>`;
  }).join("");
}

function skeletonListBlocks(count, linesPerBlock = 3) {
  return Array.from({ length: count }, () => `
    <div class="flx-skeleton-block">
      ${skeletonLines(1, { widths: ["62%"], height: "tall" })}
      ${skeletonLines(linesPerBlock - 1, { widths: ["38%", "80%"] })}
      <div class="flx-skeleton-row">
        <span class="flx-skeleton flx-skeleton-pill" style="width:96px;flex:0 0 96px"></span>
        <span class="flx-skeleton flx-skeleton-pill" style="width:74px;flex:0 0 74px"></span>
      </div>
    </div>
  `).join("");
}

function renderLoadingSkeletons() {
  if (clientMeta && !clientMeta.textContent) {
    clientMeta.innerHTML = `<span class="flx-skeleton flx-skeleton-line" style="width:230px"></span>`;
  }

  [statTotalApartments, statAvailableApartments, statCandidates, statDecisionSplit].forEach((node) => {
    if (node) {
      node.innerHTML = `<span class="flx-skeleton flx-skeleton-line value" style="width:58px"></span>`;
    }
  });

  [statTotalApartmentsTrend, statAvailableApartmentsTrend, statCandidatesTrend, statDecisionSplitTrend]
    .forEach((node) => {
      if (node) {
        node.innerHTML = `<span class="flx-skeleton flx-skeleton-line" style="width:104px"></span>`;
      }
    });

  if (dashboardDecisionQueue) {
    dashboardDecisionQueue.innerHTML = `
      <div class="flx-skeleton-stack" style="padding:8px 0 14px">
        <div class="flx-skeleton-row">
          <span class="flx-skeleton flx-skeleton-line tall"></span>
          <span class="flx-skeleton flx-skeleton-pill" style="width:88px;flex:0 0 88px"></span>
        </div>
        ${skeletonListBlocks(3, 2)}
      </div>
    `;
  }

  [dashboardApartmentOverview, dashboardWatchlist].forEach((node) => {
    if (node) node.innerHTML = `<div class="flx-skeleton-stack">${skeletonListBlocks(3)}</div>`;
  });

  if (dashboardCriteriaSummary) {
    dashboardCriteriaSummary.innerHTML = `
      <div class="flx-skeleton-stack" style="padding:12px 0">
        ${skeletonLines(4, { widths: ["72%", "54%", "66%", "44%"] })}
      </div>
    `;
  }

  if (apartmentsSupervisionSummary) {
    apartmentsSupervisionSummary.innerHTML = `<div class="flx-skeleton-stack">${skeletonListBlocks(3, 2)}</div>`;
  }

  if (apartmentsBody) {
    apartmentsBody.innerHTML = `<div class="flx-skeleton-stack">${skeletonListBlocks(4)}</div>`;
  }

  if (candidatesReviewSummary) {
    candidatesReviewSummary.innerHTML = `<div class="flx-skeleton-stack">${skeletonListBlocks(3, 2)}</div>`;
  }

  if (candidatesBody) {
    candidatesBody.innerHTML = `<div class="flx-skeleton-stack">${skeletonListBlocks(4)}</div>`;
  }

  setBusy(true, "Chargement de votre portefeuille…");
}

// aria-busy + message dans une region live: un lecteur d'ecran ne voit pas
// les blocs gris, il faut lui dire que la page travaille.
function setBusy(isBusy, message = "", options = {}) {
  const { dim = false } = options;
  const scroll = document.querySelector(".client-scroll");

  if (scroll) {
    if (isBusy) {
      scroll.setAttribute("aria-busy", "true");
    } else {
      scroll.removeAttribute("aria-busy");
    }

    // Estomper n'a de sens qu'a l'actualisation, quand il y a deja quelque
    // chose a l'ecran. Au premier chargement, ce sont les squelettes.
    if (isBusy && dim) {
      scroll.setAttribute("data-refreshing", "true");
    } else {
      scroll.removeAttribute("data-refreshing");
    }
  }

  const live = document.getElementById("clientLoadingStatus");

  if (live) {
    live.textContent = isBusy ? message || "Chargement en cours." : message;
  }

  if (refreshBtn) {
    if (isBusy) {
      refreshBtn.setAttribute("aria-busy", "true");
    } else {
      refreshBtn.removeAttribute("aria-busy");
    }
  }
}

function renderDashboard() {
  const totalApartments = state.apartments.length;
  // Comparait avec l'egalite stricte a "disponible", alors que la valeur reelle
  // est une phrase ("Disponible maintenant", "Disponible dans 30 jours"). Le
  // compteur affichait donc 0 pour un portefeuille entierement disponible. On
  // reutilise la meme lecture que les pastilles de l'interface.
  const availableApartments = state.apartments.filter(
    (item) => getAvailabilityMeta(item.disponibilite).tone === "positive"
  ).length;
  const totalCandidates = state.candidates.length;
  const approvedCount = state.candidates.filter((item) => item.status === "approuvé").length;
  const refusedCount = state.candidates.filter((item) => item.status === "refusé").length;

  statTotalApartments.textContent = String(totalApartments);
  statAvailableApartments.textContent = String(availableApartments);
  statCandidates.textContent = String(totalCandidates);
  statDecisionSplit.textContent = `${approvedCount} / ${refusedCount}`;

  const loues = totalApartments - availableApartments;
  const aRevoir = state.candidates.filter(
    (item) => deriveCandidateResponsibility(item) === RESPONSIBILITY_LABELS.CLIENT
  ).length;
  const enAttente = totalCandidates - approvedCount - refusedCount;

  setStatTrend(
    statTotalApartmentsTrend,
    totalApartments ? `dont <strong>${loues}</strong> loué${loues > 1 ? "s" : ""}` : ""
  );
  setStatTrend(
    statAvailableApartmentsTrend,
    totalApartments ? `sur ${totalApartments} au portefeuille` : ""
  );
  setStatTrend(
    statCandidatesTrend,
    totalCandidates ? `<strong>${aRevoir}</strong> attend${aRevoir > 1 ? "ent" : ""} votre décision` : ""
  );
  setStatTrend(
    statDecisionSplitTrend,
    totalCandidates ? `${enAttente} sans décision` : ""
  );

  renderDashboardDecisionQueue();
  renderDashboardApartmentOverview();
  renderDashboardCriteriaSummary();
  renderDashboardWatchlist();
}

function renderDashboardDecisionQueue() {
  if (!dashboardDecisionQueue) return;

  const prioritizedCandidates = deriveDecisionQueue(state.candidates);
  const dashboardCandidates = (prioritizedCandidates.length
    ? prioritizedCandidates
    : state.candidates.slice().sort((a, b) => getCandidateScoreValue(b) - getCandidateScoreValue(a))
  ).slice(0, 5);

  renderCandidateTable(dashboardDecisionQueue, dashboardCandidates, {
    stateKey: "dashboardTableState",
    title: "Dossiers à prioriser",
    limit: 5,
    emptyMessage: "Aucun dossier prioritaire pour le moment."
  });
}

function renderDashboardApartmentOverview() {
  if (!dashboardApartmentOverview) return;

  if (!state.apartments.length) {
    dashboardApartmentOverview.innerHTML = `
      <div class="dashboard-empty-state">
        <div class="dashboard-empty-state-title">Aucun logement actif</div>
        <div>Ajoutez un logement pour que notre équipe commence à recevoir des candidatures.</div>
        <button type="button" class="secondary-btn compact-action dashboard-empty-state-action" data-dashboard-tab="apartments">Voir mes appartements</button>
      </div>
    `;
    return;
  }

  const apartmentItems = state.apartments
    .map((apartment) => {
      const candidates = getApartmentCandidates(apartment.ref);
      const stage = getSafeStageMeta(deriveApartmentStage(apartment, candidates));
      const responsibility = getApartmentResponsibilityMeta(apartment, candidates);
      const bestCandidate = getBestCandidateForApartment(apartment.ref);
      const scoreMeta = getScoreMeta(bestCandidate?.match_score);

      return {
        apartment,
        candidates,
        stage,
        responsibility,
        bestCandidate,
        scoreMeta
      };
    })
    .sort((a, b) => {
      const responsibilityOrder = {
        [RESPONSIBILITY_LABELS.CLIENT]: 0,
        [RESPONSIBILITY_LABELS.TEAM]: 1,
        [RESPONSIBILITY_LABELS.WATCH]: 2,
        [RESPONSIBILITY_LABELS.DONE]: 3
      };
      const responsibilityCompare =
        (responsibilityOrder[a.responsibility.label] ?? 4) - (responsibilityOrder[b.responsibility.label] ?? 4);

      if (responsibilityCompare !== 0) {
        return responsibilityCompare;
      }

      return b.candidates.length - a.candidates.length;
    })
    .slice(0, 4);

  dashboardApartmentOverview.innerHTML = apartmentItems.map((item) => `
    <div class="dashboard-item">
      <div class="dashboard-item-top">
        <div class="dashboard-item-main">
          <div class="dashboard-item-title">${escapeHtml(item.apartment.adresse || `Appartement L-${item.apartment.ref || "-"}`)}</div>
          <div class="dashboard-item-meta">${escapeHtml(item.apartment.ville || "Ville à confirmer")} · ${escapeHtml(formatCurrency(item.apartment.loyer))}</div>
        </div>
        <span class="responsibility-pill ${item.responsibility.className}">${item.responsibility.label}</span>
      </div>
      <div class="dashboard-item-summary">
        <span class="status-pill ${item.stage.tone}">${item.stage.label}</span>
        <span class="status-pill ${getAvailabilityMeta(item.apartment.disponibilite).tone}">${getAvailabilityMeta(item.apartment.disponibilite).label}</span>
        <span class="data-pill">${item.candidates.length} dossier${item.candidates.length > 1 ? "s" : ""}</span>
        <span class="score-pill ${item.scoreMeta.className}">${item.scoreMeta.label}</span>
      </div>
      <div class="next-step-note">
        <div class="next-step-label">Prochaine étape</div>
        <div class="next-step-copy">${item.responsibility.nextStep}</div>
      </div>
      <div class="responsibility-note">${item.responsibility.reason}</div>
    </div>
  `).join("");
}

// Un client dont aucun critere n'est defini voyait quatre lignes "Non precise",
// sans jamais apprendre que c'est l'etape qui fait fonctionner le tri des
// candidats. On lui dit, et on l'y emmene.
function aucunCritereDefini() {
  const c = state.client?.criteres || {};
  const renseigne = (v) =>
    v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);

  return ![
    c.revenu_minimum, c.revenu_multiple, c.credit_min, c.accepte_tal,
    c.max_occupants, c.animaux_acceptes, c.anciennete_min_mois, c.emplois_acceptes
  ].some(renseigne);
}

function renderDashboardCriteriaSummary() {
  if (!dashboardCriteriaSummary) return;

  if (state.client && aucunCritereDefini()) {
    dashboardCriteriaSummary.innerHTML = `
      <div class="dashboard-empty-state">
        <div class="dashboard-empty-state-title">Vos critères ne sont pas encore définis</div>
        <div>C’est ce qui nous permet d’écarter les dossiers qui ne vous conviennent pas avant qu’ils n’arrivent chez vous. Cinq minutes, une seule fois.</div>
        <button type="button" class="primary-btn compact-action dashboard-empty-state-action" data-dashboard-tab="criteria">Définir mes critères</button>
      </div>
    `;
    return;
  }

  if (!state.client) {
    dashboardCriteriaSummary.innerHTML = `
      <div class="dashboard-empty-state">
        <div class="dashboard-empty-state-title">Aucun critère défini</div>
        <div>Sans critères, nous ne pouvons pas trier les candidats pour vous. C’est l’étape qui fait le plus de différence.</div>
        <button type="button" class="primary-btn compact-action dashboard-empty-state-action" data-dashboard-tab="criteria">Définir mes critères</button>
      </div>
    `;
    return;
  }

  const criteria = state.client?.criteres || {};
  const jobs = Array.isArray(criteria.emplois_acceptes) && criteria.emplois_acceptes.length
    ? criteria.emplois_acceptes.join(", ")
    : "Non précisé";

  const previewItems = [
    {
      label: "Revenu minimum",
      value: criteria.revenu_minimum ? formatCurrency(criteria.revenu_minimum) : "Non précisé",
      note: "Seuil"
    },
    {
      label: "Crédit",
      value: criteria.credit_min || "Non précisé",
      note: "Niveau"
    },
    {
      label: "Animaux / TAL",
      value: `${criteria.animaux_acceptes === true ? "Animaux oui" : criteria.animaux_acceptes === false ? "Animaux non" : "Animaux n.c."} · ${criteria.accepte_tal === true ? "TAL oui" : criteria.accepte_tal === false ? "TAL non" : "TAL n.c."}`,
      // Annoncer une regle globale sans dire qu'elle souffre des exceptions
      // serait mentir a l'ecran: certains logements ont leur propre politique,
      // et c'est elle qui s'applique.
      note: noteExceptionsAnimaux()
    },
    {
      label: "Occupants / emplois",
      value: `${criteria.max_occupants ? `${criteria.max_occupants} max` : "Occupants n.c."} · ${jobs}`,
      note: "Cadre"
    }
  ];

  dashboardCriteriaSummary.innerHTML = previewItems.map((item) => `
    <div class="criteria-preview-item">
      <div class="criteria-preview-label">${item.label}</div>
      <div class="criteria-preview-value">${item.value}</div>
      <div class="criteria-preview-note">${item.note}</div>
    </div>
  `).join("");
}

function renderDashboardWatchlist() {
  if (!dashboardWatchlist) return;

  const watchlistItems = deriveWatchlist(state.apartments);

  if (!watchlistItems.length) {
    dashboardWatchlist.innerHTML = `
      <div class="dashboard-empty-state">
        <div class="dashboard-empty-state-title">Rien à surveiller</div>
        <div>Aucun de vos logements ne demande votre attention en ce moment.</div>
      </div>
    `;
    return;
  }

  dashboardWatchlist.innerHTML = watchlistItems.map((item) => {
    const availabilityMeta = getAvailabilityMeta(item.apartment.disponibilite);
    const responsibility = item.responsibility;

    return `
      <div class="dashboard-item">
        <div class="dashboard-item-top">
          <div class="dashboard-item-main">
            <div class="dashboard-item-title">${escapeHtml(item.apartment.adresse || `Appartement L-${item.apartment.ref || "-"}`)}</div>
            <div class="dashboard-item-meta">${item.apartment.ville || "Ville à confirmer"}</div>
          </div>
          <span class="responsibility-pill ${responsibility.className}">${responsibility.label}</span>
        </div>
        <div class="dashboard-item-summary">
          <span class="status-pill ${availabilityMeta.tone}">${availabilityMeta.label}</span>
          <span class="data-pill">${item.candidates.length} dossier${item.candidates.length > 1 ? "s" : ""}</span>
        </div>
        <div class="next-step-note">
          <div class="next-step-label">Prochaine étape</div>
          <div class="next-step-copy">${responsibility.nextStep}</div>
        </div>
        <div class="responsibility-note">${responsibility.reason}</div>
      </div>
    `;
  }).join("");
}

// Compte les logements qui declarent leur propre politique animaux. Le
// resultat est affiche sous la regle globale, pour que le client sache
// exactement a combien de ses logements elle s'applique.
function logementsAvecReglePropre() {
  return state.apartments.filter((a) => derogationsDuLogement(a).length);
}

function noteExceptionsAnimaux() {
  const exceptions = logementsAvecReglePropre();
  const total = state.apartments.length;

  if (!total) return "Règles";
  if (!exceptions.length) return `S’applique à vos ${total} logements`;

  const restants = total - exceptions.length;
  return `S’applique à ${restants} logement${restants > 1 ? "s" : ""} · ${exceptions.length} ${exceptions.length > 1 ? "ont" : "a"} leur propre règle`;
}

function renderApartments() {
  if (!apartmentsBody) return;

  apartmentsBody.innerHTML = "";

  if (apartmentsSupervisionSummary) {
    const responsibilityCounts = state.apartments.reduce((accumulator, apartment) => {
      const label = deriveApartmentResponsibility(apartment, getApartmentCandidates(apartment.ref));
      accumulator[label] = (accumulator[label] || 0) + 1;
      return accumulator;
    }, {});

    apartmentsSupervisionSummary.innerHTML = `
      <div class="apartments-supervision-metric">
        <div class="apartments-supervision-label">En attente du client</div>
        <div class="apartments-supervision-value">${responsibilityCounts[RESPONSIBILITY_LABELS.CLIENT] || 0}</div>
        <div class="apartments-supervision-note">Unités à revoir.</div>
      </div>
      <div class="apartments-supervision-metric">
        <div class="apartments-supervision-label">Pris en charge par l’équipe</div>
        <div class="apartments-supervision-value">${responsibilityCounts[RESPONSIBILITY_LABELS.TEAM] || 0}</div>
        <div class="apartments-supervision-note">Unités en cours de tri.</div>
      </div>
      <div class="apartments-supervision-metric">
        <div class="apartments-supervision-label">À surveiller</div>
        <div class="apartments-supervision-value">${responsibilityCounts[RESPONSIBILITY_LABELS.WATCH] || 0}</div>
        <div class="apartments-supervision-note">Unités à suivre de près.</div>
      </div>
    `;
  }

  if (!state.apartments.length) {
    apartmentsBody.innerHTML = `
      <div class="dashboard-empty-state">
        <div class="dashboard-empty-state-title">Aucun logement enregistré</div>
        <div>Ajoutez votre premier logement pour lancer la recherche de locataires.</div>
        <button type="button" class="primary-btn compact-action dashboard-empty-state-action" id="emptyAddApartmentBtn">Ajouter un logement</button>
      </div>
    `;
    return;
  }

  const apartmentItems = state.apartments
    .map((apartment) => {
      const apartmentCandidates = getApartmentCandidates(apartment.ref);
      const availabilityMeta = getAvailabilityMeta(apartment.disponibilite);
      const stage = getSafeStageMeta(deriveApartmentStage(apartment, apartmentCandidates));
      const responsibility = getApartmentResponsibilityMeta(apartment, apartmentCandidates);
      const bestCandidate = getBestCandidateForApartment(apartment.ref);
      const strongSummary = getApartmentStrengthSummary(apartmentCandidates);

      return {
        apartment,
        apartmentCandidates,
        availabilityMeta,
        stage,
        responsibility,
        bestCandidate,
        strongSummary
      };
    })
    .sort((a, b) => {
      const responsibilityOrder = {
        [RESPONSIBILITY_LABELS.CLIENT]: 0,
        [RESPONSIBILITY_LABELS.WATCH]: 1,
        [RESPONSIBILITY_LABELS.TEAM]: 2,
        [RESPONSIBILITY_LABELS.DONE]: 3
      };
      const responsibilityCompare =
        (responsibilityOrder[a.responsibility.label] ?? 4) - (responsibilityOrder[b.responsibility.label] ?? 4);

      if (responsibilityCompare !== 0) {
        return responsibilityCompare;
      }

      return b.apartmentCandidates.length - a.apartmentCandidates.length;
    });

  apartmentsBody.innerHTML = apartmentItems.map((item) => `
    <article class="apartment-pipeline-card">
      <div class="apartment-pipeline-header">
        <div class="apartment-pipeline-main">
          <div class="apartment-pipeline-title">${item.apartment.adresse || `Appartement L-${item.apartment.ref || "-"}`}</div>
          <div class="apartment-pipeline-meta">
            ${item.apartment.ville || "Ville à confirmer"} · Réf. L-${item.apartment.ref || "-"} · ${formatCurrency(item.apartment.loyer)}
          </div>
        </div>
        <div class="apartment-pipeline-statuses">
          <span class="status-pill ${item.stage.tone}">${item.stage.label}</span>
          <span class="responsibility-pill ${item.responsibility.className}">${item.responsibility.label}</span>
        </div>
      </div>

      <div class="apartment-pipeline-grid">
        <div class="apartment-pipeline-panel">
          <div class="apartment-pipeline-panel-label">Responsabilité</div>
          <div class="apartment-pipeline-summary">
            <span class="status-pill ${item.availabilityMeta.tone}">${item.availabilityMeta.label}</span>
            <span class="data-pill">${item.apartmentCandidates.length} dossier${item.apartmentCandidates.length > 1 ? "s" : ""} reçu${item.apartmentCandidates.length > 1 ? "s" : ""}</span>
            <span class="data-pill">${item.strongSummary}</span>
          </div>
          <div class="responsibility-note">${item.responsibility.reason}</div>
        </div>

        <div class="apartment-pipeline-next-step">
          <div class="apartment-pipeline-next-step-title">Prochaine étape</div>
          <div class="apartment-pipeline-next-step-copy">${item.responsibility.nextStep}</div>
          <div class="apartment-pipeline-panel-copy">
            ${item.bestCandidate
              ? `Dossier le plus avancé actuellement : ${item.bestCandidate.candidate_name || "Candidat"}`
              : "Aucun dossier fort actuellement pour cette unité."}
          </div>
        </div>
      </div>

      ${renderReglePropre(item.apartment)}

      <div class="apartment-pipeline-actions">
        <button type="button" class="secondary-btn compact-action apartment-review-btn">Voir les dossiers liés</button>
        <button type="button" class="secondary-btn compact-action apartment-edit-btn" data-ref="${escapeHtml(item.apartment.ref)}">Modifier</button>
      </div>

      ${renderEditeurLogement(item.apartment)}
    </article>
  `).join("");

  document.querySelectorAll(".apartment-review-btn").forEach((button) => {
    button.addEventListener("click", () => switchTab("candidates"));
  });

  document.getElementById("emptyAddApartmentBtn")?.addEventListener("click", () => {
    document.getElementById("addApartmentForm")?.classList.remove("hidden");
    document.getElementById("newApartmentAddress")?.focus();
  });

  brancherEditeursLogement();
}

// Ce que le logement applique reellement, affiche sur sa fiche. Sans cela, le
// client lisait sa regle globale dans l'onglet Criteres et ignorait qu'un
// immeuble avait la sienne, qui prend le dessus.
function derogationsDuLogement(apartment) {
  const derogations = [];

  const animaux = String(apartment.animaux_acceptes || "").trim();
  if (animaux) derogations.push(`Animaux : ${animaux}`);

  if (apartment.accepte_tal === true) derogations.push("Dossier TAL : accepté");
  if (apartment.accepte_tal === false) derogations.push("Dossier TAL : refusé");

  const credit = String(apartment.credit_requis || "").trim();
  if (credit) derogations.push(`Crédit : ${credit}`);

  if (apartment.max_occupants) derogations.push(`Occupants : ${apartment.max_occupants} max`);

  return derogations;
}

function renderReglePropre(apartment) {
  const derogations = derogationsDuLogement(apartment);
  if (!derogations.length) return "";

  return `
    <div class="apartment-own-rule">
      <span class="apartment-own-rule-tag">Règle${derogations.length > 1 ? "s" : ""} propre${derogations.length > 1 ? "s" : ""} à ce logement</span>
      <span>${derogations.map((d) => escapeHtml(d)).join(" · ")}</span>
      <span class="apartment-own-rule-note">Prend le dessus sur vos critères généraux.</span>
    </div>`;
}

function renderEditeurLogement(apartment) {
  const ref = escapeHtml(apartment.ref);
  const opt = (valeur, courant, libelle) =>
    `<option value="${escapeHtml(valeur)}"${String(courant).trim() === valeur ? " selected" : ""}>${escapeHtml(libelle)}</option>`;

  const globaux = state.client?.criteres || {};
  const libelleGlobal = globaux.animaux_acceptes === true ? "acceptés"
    : globaux.animaux_acceptes === false ? "refusés"
    : "non précisé";
  const libelleTalGlobal = globaux.accepte_tal === true ? "accepté"
    : globaux.accepte_tal === false ? "refusé"
    : "non précisé";
  const libelleCreditGlobal = globaux.credit_min || "non précisé";
  const libelleOccupantsGlobal = globaux.max_occupants ? `${globaux.max_occupants} max` : "non précisé";

  // Un champ vide veut dire "suivre les criteres generaux". La valeur heritee
  // est affichee dans l'option elle-meme, pour que le client sache ce qu'il
  // herite avant de choisir d'y deroger.
  const heriteOuValeur = (valeurLogement, options) => {
    const courant = valeurLogement === null || valeurLogement === undefined ? "" : String(valeurLogement);
    return options.map(([v, libelle]) =>
      `<option value="${escapeHtml(v)}"${courant === v ? " selected" : ""}>${escapeHtml(libelle)}</option>`
    ).join("");
  };

  return `
    <form class="apartment-edit-form hidden" data-edit-ref="${ref}">
      <div class="form-grid">
        <input name="adresse" type="text" placeholder="Adresse" value="${escapeHtml(apartment.adresse || "")}" required />
        <input name="ville" type="text" placeholder="Ville" value="${escapeHtml(apartment.ville || "")}" />
        <input name="type_logement" type="text" placeholder="Type (ex. 4½)" value="${escapeHtml(apartment.type_logement || apartment.chambres || "")}" />
        <input name="loyer" type="text" placeholder="Loyer" value="${escapeHtml(apartment.loyer || "")}" />
        <select name="disponibilite">
          ${opt("", apartment.disponibilite, "Disponibilité")}
          ${opt("Disponible maintenant", apartment.disponibilite, "Disponible maintenant")}
          ${opt("Disponible dans 30 jours", apartment.disponibilite, "Dans 30 jours")}
          ${opt("Disponible dans 60 jours", apartment.disponibilite, "Dans 60 jours")}
          ${opt("Loué", apartment.disponibilite, "Loué")}
        </select>
        <select name="animaux_acceptes">
          <option value=""${!String(apartment.animaux_acceptes || "").trim() ? " selected" : ""}>Suivre mes critères généraux (${escapeHtml(libelleGlobal)})</option>
          ${opt("Oui, animaux acceptes", apartment.animaux_acceptes, "Animaux acceptés pour ce logement")}
          ${opt("Oui, petits animaux seulement", apartment.animaux_acceptes, "Petits animaux seulement")}
          ${opt("Non, animaux refuses", apartment.animaux_acceptes, "Animaux refusés pour ce logement")}
        </select>
        <select name="accepte_tal">
          ${heriteOuValeur(apartment.accepte_tal, [
            ["", `Dossier TAL : suivre mes critères (${libelleTalGlobal})`],
            ["true", "Dossier TAL accepté pour ce logement"],
            ["false", "Dossier TAL refusé pour ce logement"]
          ])}
        </select>
        <select name="credit_requis">
          ${heriteOuValeur(apartment.credit_requis, [
            ["", `Crédit : suivre mes critères (${libelleCreditGlobal})`],
            ["haut", "Crédit élevé exigé (700+)"],
            ["moyen", "Crédit moyen exigé (600–699)"],
            ["bas", "Crédit bas accepté"]
          ])}
        </select>
        <select name="max_occupants">
          ${heriteOuValeur(apartment.max_occupants, [
            ["", `Occupants : suivre mes critères (${libelleOccupantsGlobal})`],
            ["1", "1 occupant maximum"],
            ["2", "2 occupants maximum"],
            ["3", "3 occupants maximum"],
            ["4", "4 occupants maximum"],
            ["5", "5 occupants maximum"],
            ["6", "6 occupants maximum"]
          ])}
        </select>
      </div>
      <div class="apartment-edit-actions">
        <button type="submit" class="primary-btn compact-action">Enregistrer</button>
        <button type="button" class="secondary-btn compact-action apartment-edit-cancel">Annuler</button>
        <span class="apartment-edit-status"></span>
      </div>
    </form>`;
}

function brancherEditeursLogement() {
  document.querySelectorAll(".apartment-edit-btn").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const form = document.querySelector(`[data-edit-ref="${bouton.dataset.ref}"]`);
      if (!form) return;
      form.classList.toggle("hidden");
      if (!form.classList.contains("hidden")) form.querySelector("input")?.focus();
    });
  });

  document.querySelectorAll(".apartment-edit-cancel").forEach((bouton) => {
    bouton.addEventListener("click", () => bouton.closest(".apartment-edit-form")?.classList.add("hidden"));
  });

  document.querySelectorAll(".apartment-edit-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const statut = form.querySelector(".apartment-edit-status");
      const submit = form.querySelector("button[type=submit]");
      if (statut) { statut.textContent = ""; statut.className = "apartment-edit-status"; }
      if (submit) submit.disabled = true;

      const corps = {};
      new FormData(form).forEach((valeur, cle) => {
        // Une chaine vide sur un critere veut dire "suivre mes criteres
        // generaux": on envoie null pour effacer une derogation existante.
        const criteres = ["accepte_tal", "credit_requis", "max_occupants", "animaux_acceptes"];
        corps[cle] = (criteres.includes(cle) && valeur === "") ? null : valeur;
      });

      try {
        await fetchClientJSON(`/api/client/apartments/${encodeURIComponent(form.dataset.editRef)}`, {
          method: "PUT",
          body: JSON.stringify(corps)
        });
        await loadClientData();
      } catch (error) {
        if (statut) {
          statut.textContent = error.message || "Modification impossible.";
          statut.className = "apartment-edit-status error";
        }
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });
}

function renderCandidates() {
  if (!candidatesBody) return;

  candidatesBody.innerHTML = "";

  const clientCount = state.candidates.filter(
    (candidate) => deriveCandidateResponsibility(candidate) === RESPONSIBILITY_LABELS.CLIENT
  ).length;
  const teamCount = state.candidates.filter(
    (candidate) => deriveCandidateResponsibility(candidate) === RESPONSIBILITY_LABELS.TEAM
  ).length;
  const isSparseState = state.candidates.length > 0 && state.candidates.length < 3;

  if (candidatesReviewSummary) {
    candidatesReviewSummary.innerHTML = `
      <div class="candidates-review-metric">
        <div class="candidates-review-label">Dossiers reçus</div>
        <div class="candidates-review-value">${state.candidates.length}</div>
        <div class="candidates-review-note">Dossiers visibles.</div>
      </div>
      <div class="candidates-review-metric">
        <div class="candidates-review-label">En attente du client</div>
        <div class="candidates-review-value">${clientCount}</div>
        <div class="candidates-review-note">À revoir.</div>
      </div>
      <div class="candidates-review-metric">
        <div class="candidates-review-label">Pris en charge par l’équipe</div>
        <div class="candidates-review-value">${teamCount}</div>
        <div class="candidates-review-note">Encore suivis.</div>
      </div>
      ${
        isSparseState
          ? `
            <div class="candidates-review-note-card">
              <div class="candidates-review-label">Portefeuille en constitution</div>
              <div class="candidates-review-note">Peu de dossiers pour le moment. La vue se remplira au fil des réceptions.</div>
            </div>
          `
          : ""
      }
    `;
  }

  if (!state.candidates.length) {
    renderCandidateTable(candidatesBody, [], {
      stateKey: "candidatesTableState",
      title: "Tous les dossiers",
      emptyMessage: "Aucun dossier à afficher pour le moment."
    });
    return;
  }

  renderCandidateTable(candidatesBody, state.candidates, {
    stateKey: "candidatesTableState",
    title: "Tous les dossiers",
    emptyMessage: "Aucun dossier ne correspond aux filtres actuels."
  });
}

function populateCriteriaForm() {
  const criteria = state.client?.criteres || {};
  document.getElementById("criteriaIncome").value =
    criteria.revenu_minimum === null || criteria.revenu_minimum === undefined ? "" : String(criteria.revenu_minimum);
  // Le select propose bas/moyen/haut, mais les enregistrements herites stockent
  // un seuil numerique (680). La valeur ne correspondait a aucune option, le
  // select retombait sur vide, et enregistrer effacait la cote du client.
  document.getElementById("criteriaCredit").value = paliersDeCredit(criteria.credit_min);
  document.getElementById("criteriaTal").value = toYesNo(criteria.accepte_tal);
  document.getElementById("criteriaAnimals").value = toYesNo(criteria.animaux_acceptes);
  document.getElementById("criteriaOccupants").value =
    criteria.max_occupants === null || criteria.max_occupants === undefined ? "" : String(criteria.max_occupants);
  document.getElementById("criteriaJobs").value = Array.isArray(criteria.emplois_acceptes)
    ? criteria.emplois_acceptes.join(", ")
    : "";
  document.getElementById("criteriaSeniority").value =
    criteria.anciennete_min_mois === null || criteria.anciennete_min_mois === undefined
      ? ""
      : String(criteria.anciennete_min_mois);
}

function openCandidateModal(candidate) {
  candidateModalTitle.textContent = candidate.candidate_name || "Détails candidat";

  const detailItems = [
    ["Revenu", candidate.revenu || candidate.monthly_income || "-"],
    ["Cote de crédit", candidate.credit_level || "-"],
    ["TAL", candidate.tal_record || "-"],
    ["Emploi", candidate.job_title || candidate.employment_status || "-"],
    ["Ancienneté", candidate.employment_length || "-"],
    ["Animaux", candidate.pets || "-"],
    ["Occupants", candidate.occupants_total || "-"],
    ["Appartement", formatApartmentLabel(candidate.apartment_ref)]
  ];

  candidateDetailGrid.innerHTML = detailItems
    .map(([label, value]) => `<div class="detail-item"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");

  const reasons = Array.isArray(candidate.match_reasons) ? candidate.match_reasons : [];
  const passed = reasons.filter(isPositiveReason);
  const failed = reasons.filter((reason) => !isPositiveReason(reason));

  candidatePassReasons.innerHTML = (passed.length ? passed : ["Aucun critère validé explicitement."])
    .map((reason) => `<li>${reason}</li>`)
    .join("");

  candidateFailReasons.innerHTML = (failed.length ? failed : ["Aucun point bloquant relevé."])
    .map((reason) => `<li>${reason}</li>`)
    .join("");

  candidateModal.classList.add("open");
}

function closeCandidateModal() {
  candidateModal.classList.remove("open");
}

async function loadClientData() {
  const [clientData, apartmentsData, candidatesData] = await Promise.all([
    fetchClientJSON("/api/client/me"),
    fetchClientJSON("/api/client/apartments"),
    fetchClientJSON("/api/client/candidates")
  ]);

  const currentClient = clientData.client || null;

  if (!currentClient) {
    throw new Error(`Client introuvable pour client_id=${state.clientId}.`);
  }

  state.client = currentClient;
  state.apartments = apartmentsData.apartments || [];
  state.candidates = candidatesData.candidates || [];

  // L'identifiant technique du client n'a aucun sens pour lui et faisait du
  // bruit dans l'en-tete de son propre portail.
  const nb = state.apartments.length;
  clientMeta.textContent = nb
    ? `${state.client.nom || "Votre portefeuille"} · ${nb} logement${nb > 1 ? "s" : ""}`
    : (state.client.nom || "Votre portefeuille");
  renderDashboard();
  renderApartments();
  renderCandidates();
  populateCriteriaForm();
  setBusy(false, "Portefeuille chargé.");
}

async function saveCriteria(event) {
  event.preventDefault();
  setCriteriaStatus("", "");

  const payload = {
    criteres: {
      revenu_minimum: parseOptionalNumber(document.getElementById("criteriaIncome").value),
      credit_min: document.getElementById("criteriaCredit").value || null,
      accepte_tal: fromYesNo(document.getElementById("criteriaTal").value),
      animaux_acceptes: fromYesNo(document.getElementById("criteriaAnimals").value),
      max_occupants: parseOptionalNumber(document.getElementById("criteriaOccupants").value),
      anciennete_min_mois: parseOptionalNumber(document.getElementById("criteriaSeniority").value),
      emplois_acceptes: String(document.getElementById("criteriaJobs").value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  };

  try {
    const result = await fetchClientJSON("/api/client/criteria", {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    state.client = result.client || state.client;
    populateCriteriaForm();
    setCriteriaStatus("Critères enregistrés.", "success");
  } catch (error) {
    setCriteriaStatus(error.message || "Impossible d’enregistrer les critères.", "error");
  }
}

document.querySelectorAll(".menu-btn").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

// Delegation: ces boutons sont aussi crees dynamiquement dans les etats vides,
// donc une ecoute posee au chargement ne les atteindrait jamais.
document.addEventListener("click", (evenement) => {
  const cible = evenement.target.closest("[data-dashboard-tab]");
  if (cible) switchTab(cible.dataset.dashboardTab);
});

// Le portail n'avait aucun moyen de se deconnecter: la session restait ouverte
// indefiniment, y compris sur un poste partage. onAuthStateChange gerait deja
// SIGNED_OUT, mais rien ne pouvait le declencher.
// Le lien "Mot de passe oublie" et le formulaire de nouveau mot de passe.
document.getElementById("forgotPasswordBtn")?.addEventListener("click", demanderReinitialisation);
document.getElementById("resetPasswordForm")?.addEventListener("submit", enregistrerNouveauMotDePasse);

// Retour par le lien de recuperation: Supabase place le type dans le fragment
// d'URL et emet PASSWORD_RECOVERY. Dans les deux cas on montre le formulaire.
if (/type=recovery/.test(window.location.hash || "")) {
  afficherFormulaireNouveauMotDePasse();
}

supabaseClient.auth.onAuthStateChange((evenement) => {
  if (evenement === "PASSWORD_RECOVERY") {
    afficherFormulaireNouveauMotDePasse();
  }
});

// Ajout d'un logement depuis le portail, ce que l'onboarding promettait sans
// que ce soit possible.
const toggleAddApartmentBtn = document.getElementById("toggleAddApartmentBtn");
const addApartmentForm = document.getElementById("addApartmentForm");

toggleAddApartmentBtn?.addEventListener("click", () => {
  addApartmentForm?.classList.toggle("hidden");
  if (!addApartmentForm?.classList.contains("hidden")) {
    document.getElementById("newApartmentAddress")?.focus();
  }
});

document.getElementById("cancelAddApartmentBtn")?.addEventListener("click", () => {
  addApartmentForm?.classList.add("hidden");
  addApartmentForm?.reset();
});

addApartmentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const statut = document.getElementById("addApartmentStatus");
  const bouton = addApartmentForm.querySelector("button[type=submit]");
  if (statut) { statut.textContent = ""; statut.className = "client-auth-status"; }
  if (bouton) bouton.disabled = true;

  try {
    await fetchClientJSON("/api/client/apartments", {
      method: "POST",
      body: JSON.stringify({
        adresse: document.getElementById("newApartmentAddress").value.trim(),
        ville: document.getElementById("newApartmentCity").value.trim(),
        type_logement: document.getElementById("newApartmentType").value.trim(),
        loyer: document.getElementById("newApartmentRent").value || null,
        disponibilite: document.getElementById("newApartmentAvailability").value,
        stationnement: document.getElementById("newApartmentParking").value
      })
    });

    addApartmentForm.reset();
    addApartmentForm.classList.add("hidden");
    await loadClientData();
  } catch (error) {
    if (statut) {
      statut.textContent = error.message || "Impossible d’ajouter le logement.";
      statut.className = "client-auth-status error";
    }
  } finally {
    if (bouton) bouton.disabled = false;
  }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error("Deconnexion echouee:", error);
    } finally {
      window.location.href = "/client.html";
    }
  });
}

if (refreshBtn) {
  // loadClientData est async et n'etait pas protege sur ce chemin: un echec
  // laissait des donnees perimees a l'ecran sans que le client le sache.
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    // A l'actualisation on ne vide pas l'ecran: les donnees deja affichees
    // restent lisibles, simplement estompees, et le bouton tourne.
    setBusy(true, "Actualisation en cours…", { dim: true });
    try {
      await loadClientData();
    } catch (error) {
      console.error("Actualisation echouee:", error);
      setBusy(false, "L’actualisation a échoué.");
      window.alert(error?.message || "L’actualisation a échoué. Les données affichées datent d’avant.");
    } finally {
      refreshBtn.disabled = false;
      // Pas de setBusy(false) ici: loadClientData l'a deja fait avec son
      // message de fin, et l'ecraser aussitot par une chaine vide priverait
      // un lecteur d'ecran de l'annonce.
      if (refreshBtn.getAttribute("aria-busy")) {
        setBusy(false);
      }
    }
  });
}

if (criteriaForm) {
  criteriaForm.addEventListener("submit", saveCriteria);
}

if (closeCandidateModalBtn) {
  closeCandidateModalBtn.addEventListener("click", closeCandidateModal);
}

if (candidateModal) {
  candidateModal.addEventListener("click", (event) => {
    if (event.target === candidateModal) {
      closeCandidateModal();
    }
  });
}

if (clientLoginForm) {
  clientLoginForm.addEventListener("submit", signInClient);
}

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    if (redirectToClientPortalEntry()) {
      return;
    }

    state.currentSession = null;
    state.currentUser = null;
    state.clientId = "";
    state.client = null;
    state.apartments = [];
    state.candidates = [];
    showClientLoginScreen("Veuillez vous connecter pour accéder à votre espace client.", "success");
    return;
  }

  if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
    supabaseClient.auth.getSession().then(({ data }) => {
      state.currentSession = data?.session || null;
    }).catch(() => {});
  }
});

(async function init() {
  try {
    const user = await requireLogin();

    if (!user) {
      showClientLoginScreen();
      return;
    }

    // Idem au chargement direct du portail (lien de session, retour sur la
    // page): on montre la structure tout de suite, puis on la remplit.
    showClientPortalScreen();
    switchTab("dashboard");
    renderLoadingSkeletons();

    await loadClientData();
  } catch (error) {
    setBusy(false);

    if (state.currentUser) {
      handleClientRouteFailure(error);
      return;
    }

    showClientLoginScreen(error.message || "Connexion client requise.", "error");
  }
})();
