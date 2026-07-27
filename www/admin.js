const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY = "sb_publishable_103-rw3MwM7k2xUeMMUodg_fRr9vUD4";
const EMPLOYEE_APP_URL = "https://fluxlocatif.up.railway.app";
// Meme origine que la page courante. L'admin, l'app employe et le portail
// client sont servis par le meme serveur, donc un chemin relatif marche
// partout. Le domaine etait code en dur ici, et son certificat expire
// renvoyait les clients sur une page blanche des la connexion.
const CLIENT_APP_URL = "";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabs = {
  users: document.getElementById("usersTab"),
  sessions: document.getElementById("sessionsTab"),
  messages: document.getElementById("messagesTab"),
  clients: document.getElementById("clientsTab"),
  apartments: document.getElementById("apartmentsTab"),
  candidates: document.getElementById("candidatesTab"),
  translatorReports: document.getElementById("translatorReportsTab")
};

const pageTitle = document.getElementById("pageTitle");
const refreshBtn = document.getElementById("refreshBtn");
const adminsBody = document.getElementById("adminsBody");
const employeesBody = document.getElementById("employeesBody");
const sessionsBody = document.getElementById("sessionsBody");
const messagesBody = document.getElementById("messagesBody");
const clientsBody = document.getElementById("clientsBody");
const apartmentsBody = document.getElementById("apartmentsBody");
const candidatesBody = document.getElementById("candidatesBody");
const translatorReportsList = document.getElementById("translatorReportsList");
const translatorReportReasonFilter = document.getElementById("translatorReportReasonFilter");
const translatorReportStatusFilter = document.getElementById("translatorReportStatusFilter");
const translatorReportSearch = document.getElementById("translatorReportSearch");
const clearTranslatorReportFiltersBtn = document.getElementById("clearTranslatorReportFiltersBtn");

const workspaceConversationList = document.getElementById("workspaceConversationList");
const workspaceChatTitle = document.getElementById("workspaceChatTitle");
const workspaceChatMeta = document.getElementById("workspaceChatMeta");
const workspaceMessageThread = document.getElementById("workspaceMessageThread");
const workspaceMessageForm = document.getElementById("workspaceMessageForm");
const workspaceMessageInput = document.getElementById("workspaceMessageInput");
const listingTaskForm = document.getElementById("listingTaskForm");
const listingTaskAssignedTo = document.getElementById("listingTaskAssignedTo");
const listingTaskStatus = document.getElementById("listingTaskStatus");

const apartmentForm = document.getElementById("apartmentForm");
const apartmentFormStatus = document.getElementById("apartmentFormStatus");
const apartmentFormTitle = document.getElementById("apartmentFormTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editingRefBadge = document.getElementById("editingRefBadge");
const submitApartmentBtn = document.getElementById("submitApartmentBtn");
const editingApartmentRefInput = document.getElementById("editingApartmentRef");

const apartmentSearch = document.getElementById("apartmentSearch");
const apartmentCityFilter = document.getElementById("apartmentCityFilter");
const apartmentDisponibiliteFilter = document.getElementById("apartmentDisponibiliteFilter");
const clearApartmentFiltersBtn = document.getElementById("clearApartmentFiltersBtn");

const clientForm = document.getElementById("clientForm");
const clientFormStatus = document.getElementById("clientFormStatus");
const clientFormTitle = document.getElementById("clientFormTitle");
const editingClientIdInput = document.getElementById("editingClientId");
const editingClientBadge = document.getElementById("editingClientBadge");
const cancelClientEditBtn = document.getElementById("cancelClientEditBtn");
const submitClientBtn = document.getElementById("submitClientBtn");
const openInviteClientBtn = document.getElementById("openInviteClientBtn");
const adminUserForm = document.getElementById("adminUserForm");
const employeeUserForm = document.getElementById("employeeUserForm");
const adminUserFormStatus = document.getElementById("adminUserFormStatus");
const employeeUserFormStatus = document.getElementById("employeeUserFormStatus");

const candidateStatusFilter = document.getElementById("candidateStatusFilter");
const candidateSearch = document.getElementById("candidateSearch");
const clearCandidateFiltersBtn = document.getElementById("clearCandidateFiltersBtn");

let currentTab = "users";
let allApartments = [];
let allCandidates = [];
let allTranslatorReports = [];
let lastPendingCandidatesCount = 0;
let pendingCandidatesBaselineSet = false;
let allClients = [];
let workspaceEmployees = [];
let workspaceConversations = [];
let activeWorkspaceEmployeeId = "";

function resolveUserRole(user) {
  return String(
    user?.user_metadata?.role ||
    user?.app_metadata?.role ||
    ""
  ).trim().toLowerCase();
}

function showFatalError(message) {
  document.body.innerHTML = `
    <div style="font-family: Inter, Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto;">
      <h1 style="margin-bottom: 12px;">Accès admin bloqué</h1>
      <div style="padding:16px 18px;border-radius:14px;background:#fee2e2;color:#991b1b;font-weight:700;">
        ${message}
      </div>
    </div>
  `;
}

async function waitForActiveSession(maxAttempts = 10, delayMs = 150) {
  for (let index = 0; index < maxAttempts; index += 1) {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (sessionData?.session) {
      return sessionData.session;
    }

    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return null;
}

async function requireAdmin() {
  const session = await waitForActiveSession();

  if (!session) {
    window.location.href = `/login?next=${encodeURIComponent("/admin")}`;
    throw new Error("No active session. You must log in first.");
  }

  const userId = session.user.id;
  const clientId = String(
    session.user?.user_metadata?.client_id ||
    session.user?.user_metadata?.clientId ||
    session.user?.app_metadata?.client_id ||
    session.user?.app_metadata?.clientId ||
    ""
  ).trim();
  const role = resolveUserRole(session.user);

  if (role === "admin") {
    return session.user;
  }

  // La table admin_users est lue AVANT l'aiguillage par role. L'ancien ordre
  // renvoyait vers l'espace employe tout compte portant role=employee, meme
  // s'il figurait dans admin_users: le serveur accordait l'acces, le front le
  // refusait. C'est ce qui empechait anthonymakeen@gmail.com d'ouvrir la
  // console admin.
  const { data: adminRowPrioritaire, error: adminLookupError } = await supabaseClient
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!adminLookupError && adminRowPrioritaire) {
    return session.user;
  }

  if (role === "client") {
    window.location.href = `${CLIENT_APP_URL}/client.html`;
    throw new Error("Les clients doivent utiliser le portail client.");
  }

  if (role === "employee") {
    window.location.href = `${EMPLOYEE_APP_URL}/employee`;
    throw new Error("Les employés doivent utiliser l’application employé.");
  }

  const { data: adminRow, error: adminError } = await supabaseClient
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    throw new Error("Erreur lecture admin_users: " + adminError.message);
  }

  if (!adminRow) {
    if (clientId) {
      window.location.href = `${CLIENT_APP_URL}/client.html`;
      throw new Error("Les clients doivent utiliser le portail client.");
    }

    window.location.href = `${EMPLOYEE_APP_URL}/employee`;
    throw new Error(`Votre compte est connecté, mais n'existe pas dans admin_users. UUID actuel: ${userId}`);
  }

  return session.user;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-CA");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTranslatorReportReason(value) {
  if (value === "off_topic") return "Pas rapport";
  if (value === "misunderstood_message") return "Mauvaise compréhension";
  if (value === "wrong_listing_info") return "Mauvaises infos sur le logement";
  if (value === "wrong_next_question") return "Mauvaises prochaines questions";
  if (value === "other") return "Autres";
  return value || "-";
}

function formatTranslatorReportStatus(value) {
  if (value === "reviewed") return "Révisé";
  return "Ouvert";
}

function clientLabel(clientId) {
  if (!clientId) return "-";
  const client = allClients.find((item) => item.id === clientId);
  return escapeHtml(client?.nom || clientId);
}

function clientBooleanToSelectValue(value) {
  return value === true ? "oui" : value === false ? "non" : "";
}

function formatClientCreditLabel(value) {
  if (value === "bas") return "Bas (0–599)";
  if (value === "moyen") return "Moyen (600–699)";
  if (value === "haut") return "Haut (700+)";
  return value || "-";
}

function clientSelectValueToBoolean(value) {
  if (value === "oui") return true;
  if (value === "non") return false;
  return null;
}

function parseCommaSeparatedList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMatchStatus(value) {
  if (value === "accepté") return "Accepté";
  if (value === "à revoir") return "À revoir";
  if (value === "refusé") return "Refusé";
  return "-";
}

function matchStatusClass(value) {
  if (value === "accepté") return "match-badge accepted";
  if (value === "à revoir") return "match-badge review";
  if (value === "refusé") return "match-badge refused";
  return "";
}

function populateClientSelect(selectedValue = "") {
  const clientSelect = document.getElementById("aptClientId");
  if (!clientSelect) return;

  clientSelect.innerHTML = `<option value="">Aucun client lié</option>`;

  allClients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.nom || client.id;
    clientSelect.appendChild(option);
  });

  clientSelect.value = selectedValue;
}

async function reloadClients() {
  const clientsData = await fetchJSON("/api/admin/clients");
  allClients = clientsData.clients || [];
  return allClients;
}

async function loadListingsCollection() {
  const listingsData = await fetchJSON("/api/listings");
  allApartments = Object.values(listingsData.listings || {}).sort((a, b) => Number(a.ref) - Number(b.ref));
  return allApartments;
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJSON(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  // /api/listings exige maintenant un membre du personnel (voir requireStaff),
  // il lui faut donc aussi le jeton.
  const url_ = String(url || "");
  if (url_.startsWith("/api/admin") || url_.startsWith("/api/listings")) {
    const session = await waitForActiveSession(1, 0);
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
    throw new Error("Session expirée. Reconnectez-vous.");
  }

  if (!res.ok) {
    throw new Error(data.error || "Erreur");
  }

  return data;
}

function switchTab(tabName) {
  currentTab = tabName;

  Object.entries(tabs).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", key !== tabName);
  });

  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  const titles = {
    users: "Utilisateurs",
    sessions: "Sessions",
    messages: "Conversations",
    clients: "Clients",
    apartments: "Appartements",
    candidates: "Candidats",
    translatorReports: "Signalements Traducteur"
  };

  pageTitle.textContent = titles[tabName] || "Admin";
}

async function loadUsers() {
  const data = await fetchJSON("/api/admin/users");
  const rows = data.users || [];
  const groupedBodies = {
    admin: adminsBody,
    employee: employeesBody
  };

  Object.values(groupedBodies).forEach((body) => {
    if (body) {
      body.innerHTML = "";
    }
  });

  if (!rows.length) {
    Object.values(groupedBodies).forEach((body) => {
      if (body) {
        body.innerHTML = `<tr><td colspan="6">Aucun utilisateur trouvé.</td></tr>`;
      }
    });
    return;
  }

  for (const row of rows) {
    const role = row.role || "employee";
    if (role === "client") {
      continue;
    }
    const targetBody = groupedBodies[role] || employeesBody;
    const tr = document.createElement("tr");
    const activityLabel = row.today_total_seconds
      ? `${(row.today_total_seconds / 60).toFixed(1)} min · ${row.today_heartbeat_count ?? 0} heartbeat(s)`
      : "Aucune activité aujourd’hui";
    tr.innerHTML = `
      <td>${escapeHtml(row.full_name || row.email || row.user_id || "-")}</td>
      <td>${escapeHtml(row.email || "-")}</td>
      <td>${row.is_deactivated ? "Désactivé" : "Actif"}</td>
      <td>${formatDate(row.created_at)}</td>
      <td>${activityLabel}</td>
      <td style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="secondary-btn deactivate-user-btn" data-id="${escapeHtml(row.user_id)}" data-email="${escapeHtml(row.email || "")}" ${row.is_deactivated ? "disabled" : ""}>
          Désactiver
        </button>
        <button type="button" class="secondary-btn delete-user-btn" data-id="${escapeHtml(row.user_id)}" data-email="${escapeHtml(row.email || "")}" style="background:#fee2e2;color:#991b1b;">
          Supprimer définitivement
        </button>
      </td>
    `;
    targetBody.appendChild(tr);
  }

  Object.values(groupedBodies).forEach((body) => {
    if (body && !body.children.length) {
      body.innerHTML = `<tr><td colspan="6">Aucun utilisateur dans cette catégorie.</td></tr>`;
    }
  });

  document.querySelectorAll(".deactivate-user-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openUserActionModal({
        action: "deactivate",
        userId: button.dataset.id,
        email: button.dataset.email
      });
    });
  });

  document.querySelectorAll(".delete-user-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openUserActionModal({
        action: "delete",
        userId: button.dataset.id,
        email: button.dataset.email
      });
    });
  });
}

function setManualUserFormStatus(element, message = "", type = "") {
  if (!element) return;
  element.textContent = message;
  element.style.color = type === "error" ? "#991b1b" : type === "success" ? "#166534" : "";
}

async function createManualUser(role, fullName, email, password) {
  return fetchJSON("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      role,
      full_name: fullName,
      email,
      password
    })
  });
}

async function handleManualUserFormSubmit(event, role, statusElement) {
  event.preventDefault();
  const form = event.currentTarget;
  const fullNameInput = form.querySelector('input[type="text"]');
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInput = form.querySelector('input[type="password"]');
  const submitButton = form.querySelector('button[type="submit"]');

  setManualUserFormStatus(statusElement, "", "");
  submitButton.disabled = true;

  try {
    await createManualUser(
      role,
      fullNameInput.value.trim(),
      emailInput.value.trim(),
      passwordInput.value
    );

    form.reset();
    setManualUserFormStatus(
      statusElement,
      role === "admin" ? "Administrateur créé avec succès." : "Employé créé avec succès.",
      "success"
    );
    await loadUsers();
  } catch (error) {
    setManualUserFormStatus(statusElement, error.message || "Impossible de créer ce compte.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

function openUserActionModal({ action, userId, email }) {
  const existingModal = document.getElementById("userActionModal");
  if (existingModal) {
    existingModal.remove();
  }

  const isDelete = action === "delete";
  const modal = document.createElement("div");
  modal.id = "userActionModal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
  modal.innerHTML = `
    <div style="width:min(560px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 24px 60px rgba(15,23,42,.22);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px;">
        <div>
          <div style="font-size:.85rem;font-weight:800;color:${isDelete ? "#991b1b" : "#1e90ff"};text-transform:uppercase;letter-spacing:.05em;">
            ${isDelete ? "Suppression permanente" : "Désactivation utilisateur"}
          </div>
          <h3 style="margin:6px 0 0;color:#191d45;">${isDelete ? "Confirmer la suppression" : "Confirmer la désactivation"}</h3>
          <div style="margin-top:8px;color:#6b7280;">${email || userId}</div>
        </div>
        <button type="button" id="closeUserActionModal" class="secondary-btn">Fermer</button>
      </div>
      <div style="display:grid;gap:14px;">
        <div style="padding:14px 16px;border-radius:16px;background:${isDelete ? "#fff1f2" : "#eff6ff"};color:${isDelete ? "#9f1239" : "#1d4ed8"};">
          ${isDelete
            ? "Cette action supprime définitivement l’accès Supabase de cet utilisateur. Les données métier liées seront conservées."
            : "Cette action bloque les futures connexions de cet utilisateur sans supprimer ses données métier."}
        </div>
        ${isDelete ? `
          <label style="display:grid;gap:8px;font-weight:700;">
            Tapez SUPPRIMER pour confirmer
            <input id="deleteUserConfirmInput" type="text" placeholder="SUPPRIMER" style="border:1px solid rgba(79,70,229,.14);border-radius:14px;padding:12px 14px;font:inherit;" />
          </label>
        ` : ""}
        <div id="userActionStatus" style="font-weight:700;"></div>
        <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
          <button type="button" id="confirmUserActionBtn" class="primary-btn" style="${isDelete ? "background:#991b1b;" : ""}">
            ${isDelete ? "Supprimer définitivement" : "Désactiver l’utilisateur"}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
  document.getElementById("closeUserActionModal")?.addEventListener("click", closeModal);

  document.getElementById("confirmUserActionBtn")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("userActionStatus");
    const confirmInput = document.getElementById("deleteUserConfirmInput");
    const confirmBtn = document.getElementById("confirmUserActionBtn");

    if (isDelete && String(confirmInput?.value || "").trim() !== "SUPPRIMER") {
      statusEl.textContent = "Tapez SUPPRIMER pour confirmer la suppression permanente.";
      statusEl.style.color = "#991b1b";
      return;
    }

    confirmBtn.disabled = true;
    statusEl.textContent = "";

    try {
      if (isDelete) {
        await fetchJSON(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: "DELETE"
        });
      } else {
        await fetchJSON(`/api/admin/users/${encodeURIComponent(userId)}/deactivate`, {
          method: "POST"
        });
      }

      closeModal();
      if (currentTab === "clients") {
        await loadClients();
      } else {
        await loadUsers();
      }
    } catch (error) {
      statusEl.textContent = error.message || "Impossible de traiter cette action.";
      statusEl.style.color = "#991b1b";
      confirmBtn.disabled = false;
    }
  });
}

async function loadSessions() {
  const data = await fetchJSON("/api/admin/chat-sessions");
  sessionsBody.innerHTML = "";

  for (const row of data.sessions || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.id || "-")}</td>
      <td>${escapeHtml(row.user_id || "-")}</td>
      <td>${formatDate(row.started_at)}</td>
      <td>${formatDate(row.ended_at)}</td>
      <td>${formatDate(row.last_seen_at)}</td>
    `;
    sessionsBody.appendChild(tr);
  }
}

async function loadMessages() {
  const [employeesData, conversationsData] = await Promise.all([
    fetchJSON("/api/admin/workspace/employees"),
    fetchJSON("/api/admin/workspace/conversations")
  ]);

  workspaceEmployees = employeesData.employees || [];
  workspaceConversations = conversationsData.conversations || [];

  if (listingTaskAssignedTo) {
    const currentValue = listingTaskAssignedTo.value;
    listingTaskAssignedTo.innerHTML = `<option value="">Assigner à un employé</option>`;
    workspaceEmployees.forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee.user_id;
      option.textContent = employee.full_name || employee.email || employee.user_id;
      listingTaskAssignedTo.appendChild(option);
    });
    listingTaskAssignedTo.value = workspaceEmployees.some((employee) => employee.user_id === currentValue) ? currentValue : "";
  }

  if (workspaceConversationList) {
    workspaceConversationList.innerHTML = "";

    workspaceConversations.forEach((conversation) => {
      const employee = conversation.employee || {};
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary-btn";
      button.style.textAlign = "left";
      button.style.display = "grid";
      button.style.gap = "4px";
      button.innerHTML = `
        <span style="font-weight:800;">${escapeHtml(employee.full_name || employee.email || employee.user_id)}</span>
        <span style="font-size:.88rem;color:#6b7280;">${escapeHtml(conversation.last_message?.content || "Aucun message pour le moment.")}</span>
        ${conversation.unread_count ? `<span style="font-size:.82rem;color:#1e90ff;font-weight:800;">${conversation.unread_count} non lu(s)</span>` : ""}
      `;
      button.addEventListener("click", () => {
        openWorkspaceConversation(employee.user_id);
      });
      workspaceConversationList.appendChild(button);
    });
  }

  if (!activeWorkspaceEmployeeId && workspaceConversations[0]?.employee?.user_id) {
    activeWorkspaceEmployeeId = workspaceConversations[0].employee.user_id;
  }

  if (activeWorkspaceEmployeeId) {
    await openWorkspaceConversation(activeWorkspaceEmployeeId);
  } else {
    renderWorkspaceThread([]);
  }
}

function renderWorkspaceThread(messages = []) {
  if (!workspaceMessageThread) return;

  workspaceMessageThread.innerHTML = "";

  if (!messages.length) {
    workspaceMessageThread.innerHTML = `<div style="color:#6b7280;">Aucun message pour cette conversation.</div>`;
    return;
  }

  messages.forEach((message) => {
    const isAdminMessage = String(message.from_user_id) !== String(message.employee_user_id);
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.justifyItems = isAdminMessage ? "end" : "start";

    const bubble = document.createElement("div");
    bubble.style.maxWidth = "78%";
    bubble.style.padding = "12px 14px";
    bubble.style.borderRadius = "16px";
    bubble.style.background = isAdminMessage ? "rgba(79,70,229,.10)" : "#f3f4f6";
    bubble.innerHTML = `
      <div style="font-weight:800;margin-bottom:4px;">${isAdminMessage ? "Admin" : "Employé"}</div>
      <div>${escapeHtml(message.content || "")}</div>
      <div style="margin-top:6px;font-size:.8rem;color:#6b7280;">${formatDate(message.created_at)}</div>
    `;

    row.appendChild(bubble);
    workspaceMessageThread.appendChild(row);
  });

  workspaceMessageThread.scrollTop = workspaceMessageThread.scrollHeight;
}

async function openWorkspaceConversation(employeeUserId) {
  activeWorkspaceEmployeeId = employeeUserId;
  const employee = workspaceEmployees.find((item) => item.user_id === employeeUserId) || null;

  if (workspaceChatTitle) {
    workspaceChatTitle.textContent = employee ? (employee.full_name || employee.email || employee.user_id) : "Messagerie interne";
  }

  if (workspaceChatMeta) {
    workspaceChatMeta.textContent = employee ? (employee.email || employee.user_id) : "Sélectionnez un employé.";
  }

  const data = await fetchJSON(`/api/admin/workspace/messages/${encodeURIComponent(employeeUserId)}`);
  renderWorkspaceThread(data.messages || []);
}

async function sendWorkspaceMessage(event) {
  event.preventDefault();

  if (!activeWorkspaceEmployeeId || !workspaceMessageInput?.value.trim()) {
    return;
  }

  const contenu = workspaceMessageInput.value.trim();

  // Sans try/catch, un echec laissait le message dans le champ, n'affichait
  // rien, et ne rechargeait pas la conversation: l'admin ne savait pas si son
  // message etait parti. On ne vide le champ qu'apres confirmation.
  try {
    await fetchJSON("/api/admin/workspace/messages", {
      method: "POST",
      body: JSON.stringify({
        employee_user_id: activeWorkspaceEmployeeId,
        content: contenu
      })
    });
  } catch (error) {
    console.error("Envoi du message echoue:", error);
    window.alert(error?.message || "Le message n’a pas pu être envoyé. Il est conservé dans le champ.");
    return;
  }

  workspaceMessageInput.value = "";
  await loadMessages();
}

async function createListingTask(event) {
  event.preventDefault();

  listingTaskStatus.textContent = "";
  listingTaskStatus.style.color = "";

  try {
    await fetchJSON("/api/admin/workspace/listing-tasks", {
      method: "POST",
      body: JSON.stringify({
        assigned_to_user_id: listingTaskAssignedTo.value,
        address: document.getElementById("listingTaskAddress").value.trim(),
        city: document.getElementById("listingTaskCity").value.trim(),
        type: document.getElementById("listingTaskType").value.trim(),
        rent: document.getElementById("listingTaskRent").value,
        inclusions: document.getElementById("listingTaskInclusions").value.trim(),
        pets: document.getElementById("listingTaskPets").value.trim(),
        parking: document.getElementById("listingTaskParking").value.trim(),
        features: document.getElementById("listingTaskFeatures").value.trim(),
        conditions: document.getElementById("listingTaskConditions").value.trim()
      })
    });

    listingTaskForm.reset();
    listingTaskStatus.textContent = "Mission de publication créée et assignée.";
    listingTaskStatus.style.color = "green";
  } catch (error) {
    listingTaskStatus.textContent = error.message || "Impossible de créer la mission.";
    listingTaskStatus.style.color = "red";
  }
}

function resetApartmentForm() {
  if (!editingApartmentRefInput) return;

  editingApartmentRefInput.value = "";
  apartmentForm.reset();
  apartmentFormTitle.textContent = "Ajouter un appartement";
  submitApartmentBtn.textContent = "Ajouter l’appartement";
  cancelEditBtn.style.display = "none";
  editingRefBadge.style.display = "none";
  editingRefBadge.textContent = "";
}

function resetClientForm() {
  if (!clientForm) return;

  clientForm.reset();
  if (editingClientIdInput) editingClientIdInput.value = "";
  clientFormTitle.textContent = "Créer un client manuellement (option avancée)";
  submitClientBtn.textContent = "Ajouter le client";
  cancelClientEditBtn.style.display = "none";
  editingClientBadge.style.display = "none";
  editingClientBadge.textContent = "";
  clientFormStatus.textContent = "";
  clientFormStatus.style.color = "";
}

function openInviteClientModal() {
  const existingModal = document.getElementById("inviteClientModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "inviteClientModal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
  modal.innerHTML = `
    <div style="width:min(640px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 24px 60px rgba(15,23,42,.22);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px;">
        <div>
          <div style="font-size:.85rem;font-weight:800;color:#1e90ff;text-transform:uppercase;letter-spacing:.05em;">Invitation client</div>
          <h3 style="margin:6px 0 0;color:#191d45;">Envoyer un lien d’onboarding</h3>
          <p style="margin:6px 0 0;font-size:.88rem;color:#6b7280;">Le client recevra automatiquement un courriel avec son lien d’accès personnalisé.</p>
        </div>
        <button type="button" id="closeInviteClientModal" class="secondary-btn">Fermer</button>
      </div>

      <form id="inviteClientForm" class="admin-form">
        <div class="form-grid">
          <input id="inviteName"     type="text"  placeholder="Nom complet" required />
          <input id="inviteEmail"    type="email" placeholder="Courriel" required />
          <input id="invitePhone"    type="text"  placeholder="Téléphone (optionnel)" />
          <input id="inviteMainCity" type="text"  placeholder="Ville principale (optionnel)" />
        </div>

        <div class="form-actions">
          <button type="submit" id="submitInviteClientBtn" class="primary-btn">✉ Envoyer l’invitation</button>
        </div>
      </form>

      <div id="inviteClientStatus" style="margin-top:14px;font-weight:700;"></div>

      <div id="inviteClientLinkWrap" style="display:none;margin-top:14px;">
        <div style="font-size:.9rem;color:#6b7280;margin-bottom:8px;">Lien de secours — valable 7 jours</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input id="inviteClientLink" type="text" readonly style="flex:1 1 360px;border:1px solid rgba(79,70,229,.14);border-radius:14px;padding:12px 14px;font:inherit;" />
          <button type="button" id="copyInviteClientLinkBtn" class="secondary-btn">Copier le lien</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
  document.getElementById("closeInviteClientModal")?.addEventListener("click", closeModal);
  document.getElementById("copyInviteClientLinkBtn")?.addEventListener("click", async () => {
    const linkInput = document.getElementById("inviteClientLink");
    const statusEl = document.getElementById("inviteClientStatus");

    if (!linkInput?.value) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkInput.value);
      } else {
        linkInput.select();
        document.execCommand("copy");
      }
      statusEl.textContent = "Lien copié.";
      statusEl.style.color = "#166534";
    } catch {
      statusEl.textContent = "Impossible de copier le lien.";
      statusEl.style.color = "#991b1b";
    }
  });

  document.getElementById("inviteClientForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = document.getElementById("submitInviteClientBtn");
    const statusEl = document.getElementById("inviteClientStatus");
    const linkWrap = document.getElementById("inviteClientLinkWrap");
    const linkInput = document.getElementById("inviteClientLink");

    const emailValue = document.getElementById("inviteEmail").value.trim();
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours…";
    statusEl.textContent = "";
    linkWrap.style.display = "none";

    try {
      const result = await fetchJSON("/api/admin/client-invitations", {
        method: "POST",
        body: JSON.stringify({
          name:      document.getElementById("inviteName").value.trim(),
          email:     emailValue,
          phone:     document.getElementById("invitePhone").value.trim(),
          main_city: document.getElementById("inviteMainCity").value.trim()
        })
      });

      linkInput.value = result.onboarding_link || "";
      linkWrap.style.display = "block";

      if (result.invitation_email_sent) {
        statusEl.innerHTML = `✅ Invitation envoyée à <strong>${emailValue}</strong>. Le client recevra son lien d’accès par courriel.`;
        statusEl.style.color = "#166534";
      } else {
        statusEl.innerHTML = `⚠️ Invitation créée mais l’envoi du courriel a échoué${result.invitation_email_error ? ` : ${result.invitation_email_error}` : ""}.<br>Copiez le lien ci-dessous et envoyez-le manuellement.`;
        statusEl.style.color = "#b45309";
      }
    } catch (error) {
      statusEl.textContent = error.message || "Impossible de créer l’invitation.";
      statusEl.style.color = "#991b1b";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "✉ Envoyer l’invitation";
    }
  });
}

function fillClientForm(client) {
  if (!clientForm) return;

  const criteria = client.criteres || {};

  editingClientIdInput.value = client.id || "";
  document.getElementById("clientNom").value = client.nom || "";
  document.getElementById("clientRevenuMinimum").value =
    criteria.revenu_minimum === null || criteria.revenu_minimum === undefined ? "" : String(criteria.revenu_minimum);
  document.getElementById("clientCreditMin").value = criteria.credit_min || "";
  document.getElementById("clientAccepteTal").value = clientBooleanToSelectValue(criteria.accepte_tal);
  document.getElementById("clientMaxOccupants").value =
    criteria.max_occupants === null || criteria.max_occupants === undefined ? "" : String(criteria.max_occupants);
  document.getElementById("clientAnimauxAcceptes").value = clientBooleanToSelectValue(criteria.animaux_acceptes);
  document.getElementById("clientEmploisAcceptes").value = Array.isArray(criteria.emplois_acceptes)
    ? criteria.emplois_acceptes.join(", ")
    : "";
  document.getElementById("clientAncienneteMinMois").value =
    criteria.anciennete_min_mois === null || criteria.anciennete_min_mois === undefined
      ? ""
      : String(criteria.anciennete_min_mois);

  clientFormTitle.textContent = "Modifier un client";
  submitClientBtn.textContent = "Sauvegarder les modifications";
  cancelClientEditBtn.style.display = "inline-flex";
  editingClientBadge.style.display = "inline-flex";
  editingClientBadge.textContent = `Modification : ${escapeHtml(client.nom || client.id)}`;
  clientFormStatus.textContent = "";
  clientFormStatus.style.color = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillApartmentForm(row) {
  editingApartmentRefInput.value = row.ref || "";

  document.getElementById("aptAdresse").value = row.adresse || "";
  document.getElementById("aptVille").value = row.ville || "";
  populateClientSelect(row.client_id || "");
  document.getElementById("aptType").value = row.type_logement || "";
  document.getElementById("aptChambres").value =
    row.chambres === null || row.chambres === undefined ? "" : String(row.chambres);
  document.getElementById("aptSuperficie").value = row.superficie || "";
  document.getElementById("aptLoyer").value =
    row.loyer === null || row.loyer === undefined ? "" : String(row.loyer);
  document.getElementById("aptInclusions").value = row.inclusions || "";
  document.getElementById("aptStatut").value = row.statut || "";
  document.getElementById("aptElectricite").value = row.electricite || "";
  document.getElementById("aptLaveuseSecheuse").value = row.laveuse_secheuse || "";
  document.getElementById("aptElectrosInclus").value = row.electros_inclus || "";
  document.getElementById("aptRangement").value = row.rangement || "";
  document.getElementById("aptBalcon").value = row.balcon || "";
  document.getElementById("aptWifi").value = row.wifi || "";
  document.getElementById("aptAccesTerrain").value = row.acces_au_terrain || "";
  document.getElementById("aptStationnementsGratuits").value =
    row.nombre_stationnements_gratuits === null || row.nombre_stationnements_gratuits === undefined
      ? ""
      : String(row.nombre_stationnements_gratuits);
  document.getElementById("aptStationnementsPayants").value =
    row.nombre_stationnements_payants === null || row.nombre_stationnements_payants === undefined
      ? ""
      : String(row.nombre_stationnements_payants);
  document.getElementById("aptPrixStationnementPayant").value =
    row.prix_stationnement_payant === null || row.prix_stationnement_payant === undefined
      ? ""
      : String(row.prix_stationnement_payant);
  document.getElementById("aptNombreLogementsBatiment").value =
    row.nombre_logements_batisse === null || row.nombre_logements_batisse === undefined
      ? ""
      : String(row.nombre_logements_batisse);
  document.getElementById("aptAnimaux").value = row.animaux_acceptes || "";
  document.getElementById("aptMeuble").value = row.meuble || "";
  document.getElementById("aptDisponibilite").value = row.disponibilite || "";
  document.getElementById("aptNotes").value = row.notes || "";

  apartmentFormTitle.textContent = "Modifier un appartement";
  submitApartmentBtn.textContent = "Sauvegarder les modifications";
  cancelEditBtn.style.display = "inline-flex";
  editingRefBadge.style.display = "inline-flex";
  editingRefBadge.textContent = `Modification : L-${escapeHtml(row.ref)}`;
  apartmentFormStatus.textContent = "";
  apartmentFormStatus.style.color = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function countLinkedApartments(clientId) {
  return allApartments.filter((apartment) => apartment.client_id === clientId).length;
}

function formatPortalAccessStatus(client) {
  if (client.portal_access_status === "active") return "Actif";
  if (client.portal_access_status === "deactivated") return "Désactivé";
  if (client.portal_access_status === "invited") return "Invitation envoyée";
  return "Aucun accès";
}

function formatInvitationStatus(client) {
  if (client.invitation_status === "pending") return "En attente";
  if (client.invitation_status === "completed") return "Complétée";
  if (client.invitation_status === "expired") return "Expirée";
  return "-";
}

async function copyText(value) {
  if (!value) return false;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const tempInput = document.createElement("input");
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  const copied = document.execCommand("copy");
  tempInput.remove();
  return copied;
}

// Le wizard collecte contact principal, facturation, portefeuille, preferences
// de processus et de marque. Verifie sur tout le depot: chacun de ces champs
// avait un site d'ecriture et zero site de lecture. Le client remplissait six
// ecrans dont la moitie partait dans un JSON que personne n'ouvrait jamais.
function ouvrirProfilClient(client) {
  const ligne = (etiquette, valeur) => {
    const v = Array.isArray(valeur) ? valeur.join(", ") : valeur;
    const affiche = (v === null || v === undefined || v === "") ? "-" : String(v);
    return `<div style="display:grid;grid-template-columns:220px 1fr;gap:12px;padding:7px 0;border-bottom:1px solid #f1f2f6;">
      <div style="color:#6b7280;font-size:13px;">${escapeHtml(etiquette)}</div>
      <div style="font-weight:600;">${escapeHtml(affiche)}</div>
    </div>`;
  };

  const section = (titre, lignes) =>
    `<h4 style="margin:22px 0 6px;">${escapeHtml(titre)}</h4>${lignes.join("")}`;

  const p = client.portfolio || {};
  const b = client.billing_contact || {};
  const w = client.workflow_preferences || {};
  const m = client.brand_preferences || {};
  const q = client.qualification_criteria || {};

  const contenu = [
    section("Contact principal", [
      ligne("Nom", client.primary_contact),
      ligne("Courriel", client.primary_email),
      ligne("Téléphone", client.primary_phone),
      ligne("Communication préférée", client.preferred_communication)
    ]),
    section("Facturation", [
      ligne("Nom", b.name),
      ligne("Courriel", b.email),
      ligne("Téléphone", b.phone)
    ]),
    section("Portefeuille", [
      ligne("Logements au forfait", p.units_in_plan),
      ligne("Taille totale", p.total_portfolio_size),
      ligne("Marchés", p.markets),
      ligne("Types de propriétés", p.property_types)
    ]),
    section("Qualification", [
      ligne("Garant", q.guarantor_policy),
      ligne("Facteurs disqualifiants", q.disqualifying_factors),
      ligne("Vérifications additionnelles", q.additional_screening)
    ]),
    section("Processus", [
      ligne("Règles d’escalade", w.escalation_rules),
      ligne("Processus d’approbation", w.approval_process),
      ligne("Processus de visites", w.showing_process),
      ligne("Notes d’approbation", w.approval_notes),
      ligne("Attentes de communication", w.communication_expectations)
    ]),
    section("Marque", [
      ligne("Ton", m.communication_tone),
      ligne("Nom de marque", m.branding_name),
      ligne("Signature", m.signature_contact),
      ligne("Notes", m.additional_notes)
    ])
  ].join("");

  const fond = document.createElement("div");
  fond.style.cssText = "position:fixed;inset:0;background:rgba(15,17,35,.55);display:grid;place-items:center;padding:20px;z-index:80;";
  fond.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:26px;max-width:720px;width:100%;max-height:85vh;overflow:auto;">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:16px;">
        <div>
          <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.12em;">Profil soumis</div>
          <h3 style="margin:4px 0 0;">${escapeHtml(client.nom || client.id)}</h3>
        </div>
        <button type="button" class="secondary-btn" data-fermer>Fermer</button>
      </div>
      ${contenu}
    </div>
  `;

  fond.addEventListener("click", (event) => {
    if (event.target === fond || event.target.hasAttribute("data-fermer")) fond.remove();
  });

  document.body.appendChild(fond);
}

function renderClientsTable(rows) {
  if (!clientsBody) return;

  clientsBody.innerHTML = "";

  if (!rows.length) {
    clientsBody.innerHTML = `<tr><td colspan="13">Aucun client trouvé.</td></tr>`;
    return;
  }

  rows.forEach((client) => {
    const criteria = client.criteres || {};
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(client.nom || "-")}</td>
      <td>${escapeHtml(client.portal_email || client.email || "-")}</td>
      <td>${formatPortalAccessStatus(client)}</td>
      <td>${formatInvitationStatus(client)}${client.onboarding_link ? " · lien disponible" : ""}</td>
      <td>${criteria.revenu_minimum ?? "-"}</td>
      <td>${formatClientCreditLabel(criteria.credit_min)}</td>
      <td>${criteria.accepte_tal ? "Oui" : "Non"}</td>
      <td>${criteria.max_occupants ?? "-"}</td>
      <td>${criteria.animaux_acceptes ? "Oui" : "Non"}</td>
      <td>${Array.isArray(criteria.emplois_acceptes) && criteria.emplois_acceptes.length ? criteria.emplois_acceptes.join(", ") : "-"}</td>
      <td>${criteria.anciennete_min_mois ?? "-"}</td>
      <td>${countLinkedApartments(client.id)}</td>
      <td style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="secondary-btn edit-client-btn" data-id="${escapeHtml(client.id)}">Modifier</button>
        <button type="button" class="secondary-btn view-client-profile-btn" data-id="${escapeHtml(client.id)}">Profil soumis</button>
        ${!client.portal_user_id && (client.invitation_status === "pending" || client.invitation_status === "expired" || !client.invitation_status)
          ? `<button type="button" class="secondary-btn resend-invite-btn" data-client-id="${escapeHtml(client.id)}" data-email="${escapeHtml(client.portal_email || client.email || "")}" style="background:rgba(30,144,255,.08);color:#1e90ff;">✉ ${client.invitation_status === "expired" ? "Regénérer et renvoyer" : "Renvoyer l'invitation"}</button>`
          : ""}
        ${client.onboarding_link ? `<button type="button" class="secondary-btn copy-client-link-btn" data-link="${escapeHtml(client.onboarding_link)}">Copier le lien</button>` : ""}
        ${client.portal_user_id && client.portal_access_status !== "deactivated"
          ? `<button type="button" class="secondary-btn deactivate-client-access-btn" data-user-id="${escapeHtml(client.portal_user_id)}" data-email="${escapeHtml(client.portal_email || client.email || "")}">Désactiver accès</button>`
          : ""}
        ${client.portal_user_id
          ? `<button type="button" class="secondary-btn delete-client-access-btn" data-user-id="${escapeHtml(client.portal_user_id)}" data-email="${escapeHtml(client.portal_email || client.email || "")}" style="background:#fee2e2;color:#991b1b;">Supprimer accès</button>`
          : ""}
      </td>
    `;

    clientsBody.appendChild(tr);
  });

  document.querySelectorAll(".view-client-profile-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const client = allClients.find((item) => item.id === btn.dataset.id);
      if (client) ouvrirProfilClient(client);
    });
  });

  document.querySelectorAll(".edit-client-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const client = allClients.find((item) => item.id === btn.dataset.id);
      if (client) fillClientForm(client);
    });
  });

  document.querySelectorAll(".copy-client-link-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const copied = await copyText(btn.dataset.link || "");
        clientFormStatus.textContent = copied ? "Lien d’onboarding copié." : "Impossible de copier le lien.";
        clientFormStatus.style.color = copied ? "green" : "red";
      } catch {
        clientFormStatus.textContent = "Impossible de copier le lien.";
        clientFormStatus.style.color = "red";
      }
    });
  });

  document.querySelectorAll(".resend-invite-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const clientId = btn.dataset.clientId;
      const email    = btn.dataset.email;
      const original = btn.textContent;
      btn.disabled    = true;
      btn.textContent = "Envoi…";
      try {
        const result = await fetchJSON("/api/admin/client-invitations/resend", {
          method: "POST",
          body: JSON.stringify({ client_id: clientId })
        });
        if (result.invitation_email_sent) {
          clientFormStatus.innerHTML = `✅ Invitation renvoyée à <strong>${email}</strong>.`;
          clientFormStatus.style.color = "#166534";
          btn.textContent = "✓ Envoyé";
          setTimeout(() => loadClients(), 1500);
        } else {
          clientFormStatus.textContent = `⚠️ Lien regénéré, mais l'envoi email a échoué${result.invitation_email_error ? ` : ${result.invitation_email_error}` : ""}. Rechargez et copiez le lien manuellement.`;
          clientFormStatus.style.color = "#b45309";
          btn.disabled    = false;
          btn.textContent = original;
        }
      } catch (err) {
        clientFormStatus.textContent = err.message || "Impossible de renvoyer l'invitation.";
        clientFormStatus.style.color = "#991b1b";
        btn.disabled    = false;
        btn.textContent = original;
      }
    });
  });

  document.querySelectorAll(".deactivate-client-access-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openUserActionModal({
        action: "deactivate",
        userId: btn.dataset.userId,
        email: btn.dataset.email
      });
    });
  });

  document.querySelectorAll(".delete-client-access-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openUserActionModal({
        action: "delete",
        userId: btn.dataset.userId,
        email: btn.dataset.email
      });
    });
  });
}

function populateCityFilter(rows) {
  if (!apartmentCityFilter) return;

  const currentValue = apartmentCityFilter.value;
  const cities = [...new Set(rows.map((r) => (r.ville || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr")
  );

  apartmentCityFilter.innerHTML = `<option value="">Toutes les villes</option>`;
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    apartmentCityFilter.appendChild(option);
  });

  if (cities.includes(currentValue)) {
    apartmentCityFilter.value = currentValue;
  }
}

function getFilteredApartments() {
  const search = (apartmentSearch?.value || "").trim().toLowerCase();
  const city = apartmentCityFilter?.value || "";
  const dispo = apartmentDisponibiliteFilter?.value || "";

  return allApartments.filter((row) => {
    const matchesCity = !city || (row.ville || "") === city;
    const matchesDispo = !dispo || (row.disponibilite || "") === dispo;

    const blob = [
      row.ref,
      row.adresse,
      row.ville,
      row.type_logement,
      row.chambres,
      row.superficie,
      row.loyer,
      row.inclusions,
      row.laveuse_secheuse,
      row.electros_inclus,
      row.balcon,
      row.wifi,
      row.acces_au_terrain,
      row.nombre_stationnements_gratuits,
      row.nombre_stationnements_payants,
      row.prix_stationnement_payant,
      row.nombre_logements_batisse,
      row.rangement,
      row.animaux_acceptes,
      row.meuble,
      row.electricite,
      row.disponibilite,
      row.statut,
      row.notes
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || blob.includes(search);

    return matchesCity && matchesDispo && matchesSearch;
  });
}

function renderApartmentsTable(rows) {
  apartmentsBody.innerHTML = "";

  if (!rows.length) {
    apartmentsBody.innerHTML = `<tr><td colspan="24">Aucun appartement trouvé.</td></tr>`;
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>L-${escapeHtml(row.ref || "-")}</td>
      <td>${escapeHtml(row.adresse || "-")}</td>
      <td>${escapeHtml(row.ville || "-")}</td>
      <td>${clientLabel(row.client_id)}</td>
      <td>${escapeHtml(row.type_logement || "-")}</td>
      <td>${escapeHtml(row.chambres ?? "-")}</td>
      <td>${escapeHtml(row.superficie || "-")}</td>
      <td>${escapeHtml(row.loyer ?? "-")}</td>
      <td>${escapeHtml(row.inclusions || "-")}</td>
      <td>${escapeHtml(row.electricite || "-")}</td>
      <td>${escapeHtml(row.laveuse_secheuse || "-")}</td>
      <td>${escapeHtml(row.electros_inclus || "-")}</td>
      <td>${escapeHtml(row.balcon || "-")}</td>
      <td>${escapeHtml(row.wifi || "-")}</td>
      <td>${escapeHtml(row.acces_au_terrain || "-")}</td>
      <td>${escapeHtml(row.nombre_stationnements_gratuits ?? "-")}</td>
      <td>${escapeHtml(row.nombre_stationnements_payants ?? "-")}</td>
      <td>${escapeHtml(row.prix_stationnement_payant ?? "-")}</td>
      <td>${escapeHtml(row.nombre_logements_batisse ?? "-")}</td>
      <td>${escapeHtml(row.rangement || "-")}</td>
      <td>${escapeHtml(row.animaux_acceptes || "-")}</td>
      <td>${escapeHtml(row.meuble || "-")}</td>
      <td>${escapeHtml(row.disponibilite || "-")}</td>
      <td>${escapeHtml(row.statut || "-")}</td>
      <td>${escapeHtml(row.notes || "-")}</td>
      <td style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="secondary-btn edit-apartment-btn" data-ref="${escapeHtml(row.ref)}">Modifier</button>
        <button type="button" class="secondary-btn delete-apartment-btn" data-ref="${escapeHtml(row.ref)}" style="background:#fee2e2;color:#991b1b;">Supprimer</button>
      </td>
    `;

    apartmentsBody.appendChild(tr);
  });

  document.querySelectorAll(".edit-apartment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ref = String(btn.dataset.ref);
      const listing = allApartments.find((r) => String(r.ref) === ref);
      if (listing) fillApartmentForm(listing);
    });
  });

  document.querySelectorAll(".delete-apartment-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ref = String(btn.dataset.ref);
      const confirmDelete = window.confirm(`Supprimer définitivement L-${ref} ?`);
      if (!confirmDelete) return;

      try {
        await fetchJSON(`/api/admin/apartments/L-${ref}`, { method: "DELETE" });

        if (editingApartmentRefInput.value === ref) {
          resetApartmentForm();
        }

        apartmentFormStatus.textContent = `Appartement L-${ref} supprimé avec succès.`;
        apartmentFormStatus.style.color = "green";

        await loadApartments();
      } catch (error) {
        apartmentFormStatus.textContent = error.message || "Erreur suppression appartement.";
        apartmentFormStatus.style.color = "red";
      }
    });
  });
}

function applyApartmentFilters() {
  renderApartmentsTable(getFilteredApartments());
}

async function loadClients() {
  const [clients, apartments] = await Promise.all([
    reloadClients(),
    loadListingsCollection()
  ]);

  allClients = clients;
  allApartments = apartments;
  populateClientSelect();
  renderClientsTable(allClients);
}

async function loadApartments() {
  const [clients, apartments] = await Promise.all([
    reloadClients(),
    loadListingsCollection()
  ]);

  allClients = clients;
  allApartments = apartments;
  populateClientSelect();
  populateCityFilter(allApartments);
  applyApartmentFilters();
}

async function createOrUpdateClient(event) {
  event.preventDefault();

  if (!clientForm) return;

  clientFormStatus.textContent = "";
  clientFormStatus.style.color = "";

  const editingId = editingClientIdInput.value.trim();
  const payload = {
    nom: document.getElementById("clientNom").value.trim(),
    criteres: {
      revenu_minimum: parseOptionalNumber(document.getElementById("clientRevenuMinimum").value),
      credit_min: document.getElementById("clientCreditMin").value || null,
      accepte_tal: clientSelectValueToBoolean(document.getElementById("clientAccepteTal").value),
      max_occupants: parseOptionalNumber(document.getElementById("clientMaxOccupants").value),
      animaux_acceptes: clientSelectValueToBoolean(document.getElementById("clientAnimauxAcceptes").value),
      emplois_acceptes: parseCommaSeparatedList(document.getElementById("clientEmploisAcceptes").value),
      anciennete_min_mois: parseOptionalNumber(document.getElementById("clientAncienneteMinMois").value)
    }
  };

  try {
    if (editingId) {
      await fetchJSON(`/api/admin/clients/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      clientFormStatus.textContent = "Client modifié avec succès.";
    } else {
      await fetchJSON("/api/admin/clients", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      clientFormStatus.textContent = "Client ajouté avec succès.";
    }

    clientFormStatus.style.color = "green";
    resetClientForm();
    await loadClients();
    applyApartmentFilters();
  } catch (error) {
    clientFormStatus.textContent = error.message || "Erreur lors de l’opération.";
    clientFormStatus.style.color = "red";
  }
}

async function createOrUpdateApartment(event) {
  event.preventDefault();

  apartmentFormStatus.textContent = "";
  apartmentFormStatus.style.color = "";

  const editingRef = editingApartmentRefInput.value.trim();

  const payload = {
    adresse: document.getElementById("aptAdresse").value.trim(),
    ville: document.getElementById("aptVille").value.trim(),
    client_id: document.getElementById("aptClientId").value || null,
    type_logement: document.getElementById("aptType").value,
    chambres: document.getElementById("aptChambres").value,
    superficie: document.getElementById("aptSuperficie").value.trim(),
    loyer: document.getElementById("aptLoyer").value,
    inclusions: document.getElementById("aptInclusions").value,
    statut: document.getElementById("aptStatut").value,
    electricite: document.getElementById("aptElectricite").value,
    laveuse_secheuse: document.getElementById("aptLaveuseSecheuse").value,
    electros_inclus: document.getElementById("aptElectrosInclus").value,
    balcon: document.getElementById("aptBalcon").value,
    wifi: document.getElementById("aptWifi").value,
    acces_au_terrain: document.getElementById("aptAccesTerrain").value,
    nombre_stationnements_gratuits: parseOptionalNumber(document.getElementById("aptStationnementsGratuits").value),
    nombre_stationnements_payants: parseOptionalNumber(document.getElementById("aptStationnementsPayants").value),
    prix_stationnement_payant: parseOptionalNumber(document.getElementById("aptPrixStationnementPayant").value),
    nombre_logements_batisse: parseOptionalNumber(document.getElementById("aptNombreLogementsBatiment").value),
    rangement: document.getElementById("aptRangement").value,
    animaux_acceptes: document.getElementById("aptAnimaux").value,
    meuble: document.getElementById("aptMeuble").value,
    disponibilite: document.getElementById("aptDisponibilite").value,
    notes: document.getElementById("aptNotes").value.trim()
  };

  try {
    if (editingRef) {
      await fetchJSON(`/api/admin/apartments/L-${editingRef}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      apartmentFormStatus.textContent = `Appartement L-${editingRef} modifié avec succès.`;
      apartmentFormStatus.style.color = "green";
    } else {
      const result = await fetchJSON("/api/admin/apartments", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      apartmentFormStatus.textContent = `Appartement ajouté avec succès. Référence générée : ${result.generated_ref}`;
      apartmentFormStatus.style.color = "green";
    }

    resetApartmentForm();
    await loadApartments();
  } catch (error) {
    apartmentFormStatus.textContent = error.message || "Erreur lors de l’opération.";
    apartmentFormStatus.style.color = "red";
  }
}

function getFilteredCandidates() {
  const status = candidateStatusFilter?.value || "";
  const search = (candidateSearch?.value || "").trim().toLowerCase();

  return allCandidates.filter((candidate) => {
    const matchesStatus = !status || candidate.status === status;

    const blob = [
      candidate.apartment_ref,
      candidate.candidate_name,
      candidate.phone,
      candidate.email,
      candidate.job_title,
      candidate.employer_name,
      candidate.employment_length,
      candidate.employment_status,
      candidate.monthly_income,
      candidate.credit_level,
      candidate.tal_record,
      candidate.occupants_total,
      candidate.pets,
      candidate.employee_notes,
      candidate.admin_notes,
      candidate.status
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || blob.includes(search);

    return matchesStatus && matchesSearch;
  });
}

async function updateCandidateStatus(id, status) {
  await fetchJSON(`/api/admin/candidates/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });

  await loadCandidates();
}

async function evaluateCandidate(candidate) {
  if (!candidate?.id) return;
  await fetchJSON(`/api/admin/candidates/${escapeHtml(candidate.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      reevaluate_match: true
    })
  });

  await loadCandidates();
}

function normalizeRef(value) {
  return String(value || "").replace(/^L-/i, "").trim();
}

async function reassignCandidateToListing(candidateId, listingRef) {
  await fetchJSON(`/api/admin/candidates/${candidateId}`, {
    method: "PUT",
    body: JSON.stringify({
      apartment_ref: Number(normalizeRef(listingRef)),
      reevaluate_match: true
    })
  });

  await loadCandidates();
}

function formatAlternativeListings(alternatives = []) {
  if (!Array.isArray(alternatives) || !alternatives.length) {
    return `<div style="color:#6b7280;">Aucune alternative compatible trouvée.</div>`;
  }

  return alternatives.map((listing) => `
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px 14px;background:#fff;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-weight:800;color:#191d45;">${listing.ref}</div>
          <div>${listing.address || "-"}</div>
          <div style="color:#6b7280;">${listing.city || "-"} · client_id: ${listing.client_id || "-"}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
          <div style="font-weight:800;color:#4f46e5;">Score ${listing.match_score ?? "-"}</div>
          <button type="button" class="secondary-btn reassign-candidate-btn" data-ref="${listing.ref}">Réassigner</button>
        </div>
      </div>
      <div style="margin-top:10px;color:#374151;">${Array.isArray(listing.reasons) && listing.reasons.length ? listing.reasons.join(", ") : "-"}</div>
    </div>
  `).join("");
}

function openAlternativeListingsModal(candidate) {
  const existingModal = document.getElementById("alternativeListingsModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "alternativeListingsModal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
  modal.innerHTML = `
    <div style="width:min(780px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 24px 60px rgba(15,23,42,.22);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px;">
        <div>
          <div style="font-size:.85rem;font-weight:800;color:#1e90ff;text-transform:uppercase;letter-spacing:.05em;">Suggestions</div>
          <h3 style="margin:6px 0 0;color:#191d45;">Autres logements compatibles</h3>
          <div style="margin-top:6px;color:#6b7280;">${escapeHtml(candidate.candidate_name || "Candidat")} · logement initial L-${escapeHtml(candidate.apartment_ref || "-")}</div>
        </div>
        <button type="button" id="closeAlternativeListingsModal" class="secondary-btn">Fermer</button>
      </div>
      <div style="display:grid;gap:12px;">
        ${formatAlternativeListings(candidate.alternative_listings || [])}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.getElementById("closeAlternativeListingsModal")?.addEventListener("click", closeModal);

  modal.querySelectorAll(".reassign-candidate-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Réassignation...";

      try {
        await reassignCandidateToListing(candidate.id, button.dataset.ref);
        closeModal();
      } catch (error) {
        button.disabled = false;
        button.textContent = "Réassigner";
        alert(error.message || "Impossible de réassigner le candidat.");
      }
    });
  });
}

function renderCandidatesTable(rows) {
  if (!candidatesBody) return;

  candidatesBody.innerHTML = "";

  if (!rows.length) {
    candidatesBody.innerHTML = `<tr><td colspan="20">Aucun candidat trouvé.</td></tr>`;
    return;
  }

  rows.forEach((candidate) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>L-${escapeHtml(candidate.apartment_ref || "-")}</td>
      <td>${escapeHtml(candidate.candidate_name || "-")}</td>
      <td>${escapeHtml(candidate.phone || "-")}</td>
      <td>${escapeHtml(candidate.email || "-")}</td>
      <td>${escapeHtml(candidate.job_title || "-")}</td>
      <td>${escapeHtml(candidate.employer_name || "-")}</td>
      <td>${escapeHtml(candidate.employment_length || "-")}</td>
      <td>${escapeHtml(candidate.employment_status || "-")}</td>
      <td>${escapeHtml(candidate.monthly_income || "-")}</td>
      <td>${escapeHtml(candidate.credit_level || "-")}</td>
      <td>${escapeHtml(candidate.tal_record || "-")}</td>
      <td>${escapeHtml(candidate.occupants_total || "-")}</td>
      <td>${escapeHtml(candidate.pets || "-")}</td>
      <td>${escapeHtml(candidate.employee_notes || "-")}</td>
      <td>${escapeHtml(candidate.admin_notes || "-")}</td>
      <td>${escapeHtml(candidate.status || "-")}</td>
      <td>${candidate.match_status ? `<span class="${matchStatusClass(candidate.match_status)}">${formatMatchStatus(candidate.match_status)}</span>` : "-"}</td>
      <td>${escapeHtml(candidate.match_score ?? "-")}</td>
      <td>${Array.isArray(candidate.match_reasons) && candidate.match_reasons.length ? escapeHtml(candidate.match_reasons.join(", ")) : "-"}</td>
      <td style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="secondary-btn evaluate-candidate-btn" data-id="${escapeHtml(candidate.id)}">Évaluer</button>
        <button type="button" class="secondary-btn alternatives-candidate-btn" data-id="${escapeHtml(candidate.id)}">Suggestions</button>
        <button type="button" class="secondary-btn approve-candidate-btn" data-id="${escapeHtml(candidate.id)}" style="background:#dcfce7;color:#166534;">Approuver</button>
        <button type="button" class="secondary-btn reject-candidate-btn" data-id="${escapeHtml(candidate.id)}" style="background:#fee2e2;color:#991b1b;">Refuser</button>
      </td>
    `;

    candidatesBody.appendChild(tr);
  });

  // Ces handlers etaient async sans try/catch: un 401, 404 ou 500 rejetait la
  // promesse sans etre capture. L'admin cliquait "Approuver", rien ne bougeait,
  // et rien ne lui disait que l'action avait echoue.
  const avecRetour = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error("Action admin echouee:", error);
      window.alert(error?.message || "L’action a échoué. Réessayez.");
    }
  };

  document.querySelectorAll(".approve-candidate-btn").forEach((btn) => {
    btn.addEventListener("click", avecRetour(async () => {
      await updateCandidateStatus(btn.dataset.id, "approuvé");
    }));
  });

  document.querySelectorAll(".evaluate-candidate-btn").forEach((btn) => {
    btn.addEventListener("click", avecRetour(async () => {
      const candidate = allCandidates.find((item) => item.id === btn.dataset.id);
      if (candidate) {
        await evaluateCandidate(candidate);
      }
    }));
  });

  document.querySelectorAll(".alternatives-candidate-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const candidate = allCandidates.find((item) => item.id === btn.dataset.id);
      if (candidate) {
        openAlternativeListingsModal(candidate);
      }
    });
  });

  document.querySelectorAll(".reject-candidate-btn").forEach((btn) => {
    btn.addEventListener("click", avecRetour(async () => {
      await updateCandidateStatus(btn.dataset.id, "refusé");
    }));
  });
}

function applyCandidateFilters() {
  renderCandidatesTable(getFilteredCandidates());
}

async function loadCandidates() {
  const [data] = await Promise.all([
    fetchJSON("/api/admin/candidates"),
    loadListingsCollection()
  ]);
  allCandidates = data.candidates || [];
  applyCandidateFilters();
}

function getFilteredTranslatorReports() {
  const reason = translatorReportReasonFilter?.value || "";
  const status = translatorReportStatusFilter?.value || "";
  const search = (translatorReportSearch?.value || "").trim().toLowerCase();

  return allTranslatorReports.filter((report) => {
    const matchesReason = !reason || report.reason === reason;
    const matchesStatus = !status || (report.status || "open") === status;
    const searchBlob = [
      report.listing_ref,
      report.translator_thread_key,
      report.employee?.full_name,
      report.employee?.email,
      report.employee_user_id,
      report.raw_tenant_message,
      report.translation,
      report.suggested_reply,
      formatTranslatorReportReason(report.reason)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !search || searchBlob.includes(search);

    return matchesReason && matchesStatus && matchesSearch;
  });
}

function renderTranslatorReports(rows) {
  if (!translatorReportsList) return;

  translatorReportsList.innerHTML = "";

  if (!rows.length) {
    translatorReportsList.innerHTML = `<div style="color:#6b7280;">Aucun signalement Traducteur trouvé.</div>`;
    return;
  }

  rows.forEach((report) => {
    const employeeLabel = report.employee?.full_name || report.employee?.email || report.employee_user_id || "-";
    const recentContextMarkup = Array.isArray(report.recent_context) && report.recent_context.length
      ? report.recent_context.map((entry) => `
          <div class="translator-report-context-item">
            <div class="translator-report-context-head">${escapeHtml(entry.label || entry.sender || "-")}</div>
            <div class="translator-report-value">${escapeHtml(entry.text || "")}</div>
            ${Array.isArray(entry.sections) && entry.sections.length
              ? entry.sections.map((section) => `
                  <div style="margin-top:8px;">
                    <div class="translator-report-label">${escapeHtml(section.title || "Section")}</div>
                    <div class="translator-report-value">${escapeHtml(section.text || "")}</div>
                  </div>
                `).join("")
              : ""}
          </div>
        `).join("")
      : `<div class="translator-report-context-item"><div class="translator-report-value">Aucun contexte récent enregistré.</div></div>`;

    const threadStateMarkup = report.thread_state_snapshot
      ? `
          <div class="translator-report-field">
            <div class="translator-report-label">Étape actuelle</div>
            <div class="translator-report-value">${escapeHtml(report.thread_state_snapshot.current_step || "-")}</div>
          </div>
          <div class="translator-report-field">
            <div class="translator-report-label">Dernière étape demandée</div>
            <div class="translator-report-value">${escapeHtml(report.thread_state_snapshot.last_asked_step || "-")}</div>
          </div>
          <div class="translator-report-field wide">
            <div class="translator-report-label">Dernière question logement détectée</div>
            <div class="translator-report-value">${escapeHtml(report.thread_state_snapshot.last_detected_listing_question || "-")}</div>
          </div>
        `
      : `<div class="translator-report-field wide"><div class="translator-report-label">État du thread</div><div class="translator-report-value">Aucun instantané enregistré.</div></div>`;

    const details = document.createElement("details");
    details.className = "translator-report-card";
    details.innerHTML = `
      <summary>
        <div class="translator-report-summary">
          <div class="translator-report-summary-main">
            <div class="translator-report-summary-meta">
              <span class="translator-report-chip">${escapeHtml(formatTranslatorReportReason(report.reason))}</span>
              <span class="translator-report-chip status-${escapeHtml((report.status || "open"))}">${escapeHtml(formatTranslatorReportStatus(report.status))}</span>
              ${report.listing_ref ? `<span class="translator-report-chip">${escapeHtml(report.listing_ref)}</span>` : ""}
            </div>
            <div style="font-weight:800;">${escapeHtml(employeeLabel)}</div>
            <div class="translator-report-snippet">${escapeHtml(report.raw_tenant_message || report.translation || "-")}</div>
          </div>
          <div class="translator-report-summary-side">
            <div>${escapeHtml(formatDate(report.created_at))}</div>
            <div style="margin-top:6px;">${escapeHtml(report.translator_thread_key || "-")}</div>
          </div>
        </div>
      </summary>
      <div class="translator-report-body">
        <div class="translator-report-grid">
          <div class="translator-report-field">
            <div class="translator-report-label">Employé</div>
            <div class="translator-report-value">${escapeHtml(employeeLabel)}</div>
          </div>
          <div class="translator-report-field">
            <div class="translator-report-label">Listing</div>
            <div class="translator-report-value">${escapeHtml(report.listing_ref || "-")}</div>
          </div>
          <div class="translator-report-field wide">
            <div class="translator-report-label">Thread</div>
            <div class="translator-report-value">${escapeHtml(report.translator_thread_key || "-")}</div>
          </div>
          <div class="translator-report-field wide">
            <div class="translator-report-label">Message locataire brut</div>
            <div class="translator-report-value">${escapeHtml(report.raw_tenant_message || "-")}</div>
          </div>
          <div class="translator-report-field wide">
            <div class="translator-report-label">Français international</div>
            <div class="translator-report-value">${escapeHtml(report.translation || "-")}</div>
          </div>
          <div class="translator-report-field wide">
            <div class="translator-report-label">Réponse suggérée</div>
            <div class="translator-report-value">${escapeHtml(report.suggested_reply || "-")}</div>
          </div>
        </div>

        <div class="translator-report-context">
          <div class="translator-report-label">Contexte récent</div>
          ${recentContextMarkup}
        </div>

        <div class="translator-report-grid">
          ${threadStateMarkup}
        </div>

        <div class="translator-report-actions">
          <button
            type="button"
            class="secondary-btn translator-report-status-btn"
            data-id="${escapeHtml(report.id)}"
            data-status="${report.status === "reviewed" ? "open" : "reviewed"}"
          >
            ${report.status === "reviewed" ? "Remettre ouvert" : "Marquer révisé"}
          </button>
        </div>
      </div>
    `;

    translatorReportsList.appendChild(details);
  });

  document.querySelectorAll(".translator-report-status-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;

      try {
        await fetchJSON(`/api/admin/translator-reports/${encodeURIComponent(button.dataset.id)}`, {
          method: "PUT",
          body: JSON.stringify({ status: button.dataset.status })
        });
        await loadTranslatorReports();
      } catch (error) {
        alert(error.message || "Impossible de mettre à jour ce signalement.");
        button.disabled = false;
      }
    });
  });
}

function applyTranslatorReportFilters() {
  renderTranslatorReports(getFilteredTranslatorReports());
}

async function loadTranslatorReports() {
  const data = await fetchJSON("/api/admin/translator-reports");
  allTranslatorReports = data.reports || [];
  applyTranslatorReportFilters();
}

async function checkNewCandidates() {
  try {
    const data = await fetchJSON("/api/admin/candidates?status=en attente");
    const pendingCount = (data.candidates || []).length;

    // Le garde-fou etait `lastPendingCandidatesCount !== 0`, cense ignorer le
    // premier chargement. Il s'appliquait en permanence: des que la file
    // retombait a zero, cas normal apres traitement, le candidat suivant
    // n'alertait plus jamais. On utilise un drapeau d'initialisation dedie.
    if (pendingCandidatesBaselineSet && pendingCount > lastPendingCandidatesCount) {
      alert("Nouveau candidat reçu");
    }

    lastPendingCandidatesCount = pendingCount;
    pendingCandidatesBaselineSet = true;
  } catch (error) {
    console.error("Erreur notification candidats:", error);
  }
}

async function refreshCurrentTab() {
  if (currentTab === "users") await loadUsers();
  if (currentTab === "sessions") await loadSessions();
  if (currentTab === "messages") await loadMessages();
  if (currentTab === "clients") await loadClients();
  if (currentTab === "apartments") await loadApartments();
  if (currentTab === "candidates") await loadCandidates();
  if (currentTab === "translatorReports") await loadTranslatorReports();
}

document.querySelectorAll(".menu-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    switchTab(btn.dataset.tab);
    await refreshCurrentTab();
  });
});

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    try {
      await refreshCurrentTab();
    } catch (error) {
      console.error("Rafraichissement echoue:", error);
      window.alert(error?.message || "Impossible de rafraîchir. Les données affichées sont peut-être périmées.");
    }
  });
}

if (apartmentForm) {
  apartmentForm.addEventListener("submit", createOrUpdateApartment);
}

if (clientForm) {
  clientForm.addEventListener("submit", createOrUpdateClient);
}

if (adminUserForm) {
  adminUserForm.addEventListener("submit", (event) => handleManualUserFormSubmit(event, "admin", adminUserFormStatus));
}

if (employeeUserForm) {
  employeeUserForm.addEventListener("submit", (event) => handleManualUserFormSubmit(event, "employee", employeeUserFormStatus));
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetApartmentForm);
}

if (cancelClientEditBtn) {
  cancelClientEditBtn.addEventListener("click", resetClientForm);
}

if (apartmentSearch) {
  apartmentSearch.addEventListener("input", applyApartmentFilters);
}

if (apartmentCityFilter) {
  apartmentCityFilter.addEventListener("change", applyApartmentFilters);
}

if (apartmentDisponibiliteFilter) {
  apartmentDisponibiliteFilter.addEventListener("change", applyApartmentFilters);
}

if (clearApartmentFiltersBtn) {
  clearApartmentFiltersBtn.addEventListener("click", () => {
    apartmentSearch.value = "";
    apartmentCityFilter.value = "";
    apartmentDisponibiliteFilter.value = "";
    applyApartmentFilters();
  });
}

if (candidateStatusFilter) {
  candidateStatusFilter.addEventListener("change", applyCandidateFilters);
}

if (candidateSearch) {
  candidateSearch.addEventListener("input", applyCandidateFilters);
}

if (clearCandidateFiltersBtn) {
  clearCandidateFiltersBtn.addEventListener("click", () => {
    candidateStatusFilter.value = "";
    candidateSearch.value = "";
    applyCandidateFilters();
  });
}

if (translatorReportReasonFilter) {
  translatorReportReasonFilter.addEventListener("change", applyTranslatorReportFilters);
}

if (translatorReportStatusFilter) {
  translatorReportStatusFilter.addEventListener("change", applyTranslatorReportFilters);
}

if (translatorReportSearch) {
  translatorReportSearch.addEventListener("input", applyTranslatorReportFilters);
}

if (clearTranslatorReportFiltersBtn) {
  clearTranslatorReportFiltersBtn.addEventListener("click", () => {
    translatorReportReasonFilter.value = "";
    translatorReportStatusFilter.value = "";
    translatorReportSearch.value = "";
    applyTranslatorReportFilters();
  });
}

if (openInviteClientBtn) {
  openInviteClientBtn.addEventListener("click", openInviteClientModal);
}

if (workspaceMessageForm) {
  workspaceMessageForm.addEventListener("submit", sendWorkspaceMessage);
}

if (listingTaskForm) {
  listingTaskForm.addEventListener("submit", createListingTask);
}

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = `/login?next=${encodeURIComponent("/admin")}`;
  }
});

(async function init() {
  try {
    await requireAdmin();
    switchTab("users");
    await loadUsers();
    await checkNewCandidates();
    setInterval(checkNewCandidates, 10000);
  } catch (error) {
    console.error("ADMIN INIT ERROR:", error);
    showFatalError(error.message || "Erreur admin inconnue.");
  }
})();
