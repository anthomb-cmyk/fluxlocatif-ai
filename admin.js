const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51dXprdmd5b2x4YmF3dnF5dWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Njc1NzYsImV4cCI6MjA4OTM0MzU3Nn0.zjltrYd38fypIAm1DIr0wj69eS9T7xpi_4p2aWsNYyw";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabs = {
  users: document.getElementById("usersTab"),
  sessions: document.getElementById("sessionsTab"),
  messages: document.getElementById("messagesTab"),
  apartments: document.getElementById("apartmentsTab")
};

const pageTitle = document.getElementById("pageTitle");
const refreshBtn = document.getElementById("refreshBtn");
const usersBody = document.getElementById("usersBody");
const sessionsBody = document.getElementById("sessionsBody");
const messagesBody = document.getElementById("messagesBody");
const apartmentsBody = document.getElementById("apartmentsBody");
const messageUserId = document.getElementById("messageUserId");
const loadMessagesBtn = document.getElementById("loadMessagesBtn");
const apartmentForm = document.getElementById("apartmentForm");
const apartmentFormStatus = document.getElementById("apartmentFormStatus");
const apartmentFormTitle = document.getElementById("apartmentFormTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editingRefBadge = document.getElementById("editingRefBadge");
const submitApartmentBtn = document.getElementById("submitApartmentBtn");

let currentTab = "users";
let editingApartmentRef = null;

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

async function requireAdmin() {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError) {
    throw new Error("Session error: " + sessionError.message);
  }

  if (!sessionData?.session) {
    window.location.href = "/login.html";
    throw new Error("No active session. You must log in first.");
  }

  const userId = sessionData.session.user.id;

  const { data: adminRow, error: adminError } = await supabaseClient
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    throw new Error("Erreur lecture admin_users: " + adminError.message);
  }

  if (!adminRow) {
    throw new Error(`Votre compte est connecté, mais n'existe pas dans admin_users. UUID actuel: ${userId}`);
  }

  return sessionData.session.user;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-CA");
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Erreur");
  }

  return data;
}

function switchTab(tabName) {
  currentTab = tabName;

  Object.entries(tabs).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== tabName);
  });

  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  const titles = {
    users: "Utilisateurs",
    sessions: "Sessions",
    messages: "Conversations",
    apartments: "Appartements"
  };

  pageTitle.textContent = titles[tabName] || "Admin";
}

function forceUsersHeader() {
  const thead = document.querySelector("#usersTab thead");
  if (!thead) return;

  thead.innerHTML = `
    <tr>
      <th>Nom</th>
      <th>Jour</th>
      <th>Heartbeats</th>
      <th>Total minutes</th>
      <th>Total heures</th>
    </tr>
  `;
}

async function loadUsers() {
  forceUsersHeader();

  const today = new Date().toISOString().split("T")[0];
  const data = await fetchJSON(`/api/admin/user-daily-time?day=${today}`);

  usersBody.innerHTML = "";
  const rows = data.summary || [];

  if (!rows.length) {
    usersBody.innerHTML = `
      <tr>
        <td colspan="5">Aucune donnée aujourd’hui.</td>
      </tr>
    `;
    return;
  }

  for (const row of rows) {
    const minutes = (row.total_seconds || 0) / 60;
    const hours = (row.total_seconds || 0) / 3600;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.full_name || row.user_id || "-"}</td>
      <td>${row.day || "-"}</td>
      <td>${row.heartbeat_count ?? 0}</td>
      <td>${minutes.toFixed(2)} min</td>
      <td>${hours.toFixed(2)} h</td>
    `;
    usersBody.appendChild(tr);
  }
}

async function loadSessions() {
  const data = await fetchJSON("/api/admin/chat-sessions");
  sessionsBody.innerHTML = "";

  for (const row of data.sessions || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id || "-"}</td>
      <td>${row.user_id || "-"}</td>
      <td>${formatDate(row.started_at)}</td>
      <td>${formatDate(row.ended_at)}</td>
      <td>${formatDate(row.last_seen_at)}</td>
    `;
    sessionsBody.appendChild(tr);
  }
}

async function loadMessages() {
  let url = "/api/admin/chat-messages";
  const userId = messageUserId?.value?.trim() || "";

  if (userId) {
    url += `?user_id=${encodeURIComponent(userId)}`;
  }

  const data = await fetchJSON(url);
  messagesBody.innerHTML = "";

  for (const row of data.messages || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(row.created_at)}</td>
      <td>${row.user_id || "-"}</td>
      <td>${row.mode || "-"}</td>
      <td>${row.sender || "-"}</td>
      <td class="long">${row.text || ""}</td>
    `;
    messagesBody.appendChild(tr);
  }
}

function resetApartmentForm() {
  editingApartmentRef = null;
  apartmentForm.reset();
  apartmentFormTitle.textContent = "Ajouter un appartement";
  submitApartmentBtn.textContent = "Ajouter l’appartement";
  cancelEditBtn.style.display = "none";
  editingRefBadge.style.display = "none";
  editingRefBadge.textContent = "";
  apartmentFormStatus.textContent = "";
}

function fillApartmentForm(row) {
  editingApartmentRef = row.ref;

  document.getElementById("aptAdresse").value = row.adresse || "";
  document.getElementById("aptVille").value = row.ville || "";
  document.getElementById("aptType").value = row.type_logement || "";
  document.getElementById("aptChambres").value =
    row.chambres === null || row.chambres === undefined ? "" : String(row.chambres);
  document.getElementById("aptSuperficie").value = row.superficie || "";
  document.getElementById("aptLoyer").value =
    row.loyer === null || row.loyer === undefined ? "" : String(row.loyer);
  document.getElementById("aptInclusions").value = row.inclusions || "";
  document.getElementById("aptStatut").value = row.statut || "";
  document.getElementById("aptStationnement").value = row.stationnement || "";
  document.getElementById("aptAnimaux").value = row.animaux_acceptes || "";
  document.getElementById("aptMeuble").value = row.meuble || "";
  document.getElementById("aptDisponibilite").value = row.disponibilite || "";
  document.getElementById("aptElectricite").value = row.electricite || "";
  document.getElementById("aptNotes").value = row.notes || "";

  apartmentFormTitle.textContent = "Modifier un appartement";
  submitApartmentBtn.textContent = "Sauvegarder les modifications";
  cancelEditBtn.style.display = "inline-flex";
  editingRefBadge.style.display = "inline-flex";
  editingRefBadge.textContent = `Modification : L-${row.ref}`;
  apartmentFormStatus.textContent = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadApartments() {
  const data = await fetchJSON("/api/listings");
  apartmentsBody.innerHTML = "";

  Object.values(data.listings || {}).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>L-${row.ref || "-"}</td>
      <td>${row.adresse || "-"}</td>
      <td>${row.ville || "-"}</td>
      <td>${row.type_logement || "-"}</td>
      <td>${row.chambres ?? "-"}</td>
      <td>${row.superficie || "-"}</td>
      <td>${row.loyer ?? "-"}</td>
      <td>${row.inclusions || "-"}</td>
      <td>${row.stationnement || "-"}</td>
      <td>${row.animaux_acceptes || "-"}</td>
      <td>${row.meuble || "-"}</td>
      <td>${row.electricite || "-"}</td>
      <td>${row.disponibilite || "-"}</td>
      <td>${row.statut || "-"}</td>
      <td>${row.notes || "-"}</td>
      <td>
        <button
          type="button"
          class="secondary-btn edit-apartment-btn"
          data-ref="${row.ref}"
          style="padding:8px 12px;border-radius:10px;"
        >
          Modifier
        </button>
      </td>
    `;
    apartmentsBody.appendChild(tr);
  });

  document.querySelectorAll(".edit-apartment-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ref = btn.dataset.ref;
      const data = await fetchJSON("/api/listings");
      const listing = data.listings?.[String(ref)];
      if (listing) {
        fillApartmentForm(listing);
      }
    });
  });
}

async function createOrUpdateApartment(event) {
  event.preventDefault();

  apartmentFormStatus.textContent = "";

  const payload = {
    adresse: document.getElementById("aptAdresse").value.trim(),
    ville: document.getElementById("aptVille").value.trim(),
    type_logement: document.getElementById("aptType").value,
    chambres: document.getElementById("aptChambres").value,
    superficie: document.getElementById("aptSuperficie").value.trim(),
    loyer: document.getElementById("aptLoyer").value,
    inclusions: document.getElementById("aptInclusions").value,
    statut: document.getElementById("aptStatut").value,
    stationnement: document.getElementById("aptStationnement").value,
    animaux_acceptes: document.getElementById("aptAnimaux").value,
    meuble: document.getElementById("aptMeuble").value,
    disponibilite: document.getElementById("aptDisponibilite").value,
    notes: document.getElementById("aptNotes").value.trim(),
    electricite: document.getElementById("aptElectricite").value
  };

  try {
    if (editingApartmentRef) {
      await fetchJSON(`/api/admin/apartments/L-${editingApartmentRef}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      apartmentFormStatus.textContent = `Appartement L-${editingApartmentRef} modifié avec succès.`;
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

async function refreshCurrentTab() {
  if (currentTab === "users") await loadUsers();
  if (currentTab === "sessions") await loadSessions();
  if (currentTab === "messages") await loadMessages();
  if (currentTab === "apartments") await loadApartments();
}

document.querySelectorAll(".menu-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    switchTab(btn.dataset.tab);
    await refreshCurrentTab();
  });
});

if (refreshBtn) {
  refreshBtn.addEventListener("click", refreshCurrentTab);
}

if (loadMessagesBtn) {
  loadMessagesBtn.addEventListener("click", loadMessages);
}

if (apartmentForm) {
  apartmentForm.addEventListener("submit", createOrUpdateApartment);
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetApartmentForm);
}

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "/login.html";
  }
});

(async function init() {
  try {
    await requireAdmin();
    switchTab("users");
    await loadUsers();
  } catch (error) {
    console.error("ADMIN INIT ERROR:", error);
    showFatalError(error.message || "Erreur admin inconnue.");
  }
})();
