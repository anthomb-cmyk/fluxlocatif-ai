const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY = "sb_publishable_103-rw3MwM7k2xUeMMUodg_fRr9vUD4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  token: new URLSearchParams(window.location.search).get("token") || "",
  invitation: null,
  currentStep: 1,
  locations: [],
  sessionUser: null
};

const onboardingContent = document.getElementById("onboardingContent");
const successState = document.getElementById("successState");
const invalidState = document.getElementById("invalidState");
const invalidStateMessage = document.getElementById("invalidStateMessage");
const progressStep1 = document.getElementById("progressStep1");
const progressStep2 = document.getElementById("progressStep2");
const step1Panel = document.getElementById("step1Panel");
const step2Panel = document.getElementById("step2Panel");
const accountForm = document.getElementById("accountForm");
const listingForm = document.getElementById("listingForm");
const accountStatus = document.getElementById("accountStatus");
const listingStatus = document.getElementById("listingStatus");
const submitAccountBtn = document.getElementById("submitAccountBtn");
const submitListingBtn = document.getElementById("submitListingBtn");
const backToStep1Btn = document.getElementById("backToStep1Btn");
const goToClientPortalBtn = document.getElementById("goToClientPortalBtn");
const mainCityList = document.getElementById("mainCityList");
const listingCity = document.getElementById("listingCity");
const listingAvailability = document.getElementById("listingAvailability");
const listingAvailabilityCustomWrap = document.getElementById("listingAvailabilityCustomWrap");
const propertyTypeButtons = document.getElementById("propertyTypeButtons");

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
    throw new Error(data.error || "Erreur");
  }

  return data;
}

function setStatus(element, message = "", type = "") {
  if (!element) return;
  element.textContent = message;
  element.className = "status";
  if (message) {
    element.classList.add("show");
  }
  if (type) {
    element.classList.add(type);
  }
}

function showInvalid(message) {
  onboardingContent.style.display = "none";
  successState.classList.remove("show");
  invalidState.classList.add("show");
  invalidStateMessage.textContent = message || "Cette invitation n’est plus disponible.";
}

function showSuccess() {
  onboardingContent.style.display = "none";
  invalidState.classList.remove("show");
  successState.classList.add("show");
}

function setStep(step) {
  state.currentStep = step;
  progressStep1.classList.toggle("active", step === 1);
  progressStep2.classList.toggle("active", step === 2);
  step1Panel.classList.toggle("active", step === 1);
  step2Panel.classList.toggle("active", step === 2);
}

function fillInvitationFields() {
  if (!state.invitation) return;
  document.getElementById("fullName").value = state.invitation.name || state.invitation.contact_name || "";
  document.getElementById("companyName").value = state.invitation.company_name || state.invitation.name || "";
  document.getElementById("accountEmail").value = state.invitation.email || "";
  document.getElementById("accountPhone").value = state.invitation.phone || "";
  document.getElementById("mainCity").value = state.invitation.main_city || "";
  document.getElementById("accountEmail").readOnly = true;
}

function updateAccountStepMode() {
  const password = document.getElementById("accountPassword");
  const passwordConfirm = document.getElementById("accountPasswordConfirm");
  const passwordWrap = password?.closest(".field");
  const passwordConfirmWrap = passwordConfirm?.closest(".field");
  const submitLabel = state.invitation?.account_exists ? "Se connecter pour continuer" : "Continuer";

  if (state.invitation?.account_exists) {
    if (password) {
      password.required = false;
      password.disabled = true;
      password.value = "";
    }
    if (passwordConfirm) {
      passwordConfirm.required = false;
      passwordConfirm.disabled = true;
      passwordConfirm.value = "";
    }
    if (passwordWrap) passwordWrap.style.display = "none";
    if (passwordConfirmWrap) passwordConfirmWrap.style.display = "none";
    setStatus(
      accountStatus,
      state.sessionUser && String(state.sessionUser.email || "").trim().toLowerCase() === String(state.invitation.email || "").trim().toLowerCase()
        ? "Ce courriel existe déjà. Votre session actuelle sera utilisée pour continuer l’activation."
        : "Ce courriel possède déjà un compte. Connectez-vous avec cette adresse pour poursuivre l’activation de votre invitation.",
      "success"
    );
  } else {
    if (password) {
      password.required = true;
      password.disabled = false;
    }
    if (passwordConfirm) {
      passwordConfirm.required = true;
      passwordConfirm.disabled = false;
    }
    if (passwordWrap) passwordWrap.style.display = "";
    if (passwordConfirmWrap) passwordConfirmWrap.style.display = "";
  }

  submitAccountBtn.textContent = submitLabel;
}

async function loadSessionUser() {
  const { data } = await supabaseClient.auth.getUser();
  state.sessionUser = data?.user || null;
}

function populateMainCityOptions() {
  if (!mainCityList) return;
  mainCityList.innerHTML = "";
  state.locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location.label;
    mainCityList.appendChild(option);
  });
}

function populateListingCityOptions() {
  if (!listingCity) return;
  listingCity.innerHTML = `<option value="">Sélectionner</option>`;
  state.locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location.label;
    option.textContent = `${location.label} — ${location.zone}`;
    listingCity.appendChild(option);
  });
}

async function loadLocations() {
  const data = await fetchJSON("/locations-quebec.json");
  state.locations = Array.isArray(data) ? data : [];
  populateMainCityOptions();
  populateListingCityOptions();
}

async function validateInvitation() {
  if (!state.token) {
    showInvalid("Le token d’invitation est manquant.");
    return;
  }

  try {
    const result = await fetchJSON(`/api/client-onboarding/invitation?token=${encodeURIComponent(state.token)}`);
    state.invitation = result.invitation || null;
    fillInvitationFields();
    updateAccountStepMode();

    if (
      state.invitation?.account_exists &&
      state.sessionUser &&
      String(state.sessionUser.email || "").trim().toLowerCase() === String(state.invitation.email || "").trim().toLowerCase() &&
      !state.invitation.account_created_at
    ) {
      setStatus(accountStatus, "Votre compte existant est détecté. Complétez vos informations puis continuez.", "success");
    }

    setStep(result.current_step === 2 ? 2 : 1);
  } catch (error) {
    showInvalid(error.message || "Cette invitation n’est plus disponible.");
  }
}

async function submitAccount(event) {
  event.preventDefault();
  setStatus(accountStatus, "", "");

  if (state.invitation?.account_exists) {
    const invitedEmail = String(state.invitation.email || "").trim().toLowerCase();
    const sessionEmail = String(state.sessionUser?.email || "").trim().toLowerCase();

    if (!state.sessionUser || invitedEmail !== sessionEmail) {
      const nextPath = `/client-onboarding.html?token=${encodeURIComponent(state.token)}`;
      window.location.href = `/login.html?next=${encodeURIComponent(nextPath)}`;
      return;
    }

    submitAccountBtn.disabled = true;
    submitAccountBtn.textContent = "Connexion...";

    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const accessToken = sessionData?.session?.access_token || "";
      await fetchJSON("/api/client-onboarding/link-existing-account", {
        method: "POST",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : ""
        },
        body: JSON.stringify({
          token: state.token,
          full_name: document.getElementById("fullName").value.trim(),
          company_name: document.getElementById("companyName").value.trim(),
          phone: document.getElementById("accountPhone").value.trim(),
          main_city: document.getElementById("mainCity").value.trim(),
          email_notifications: document.getElementById("emailNotifications").checked,
          marketing_communications: document.getElementById("marketingCommunications").checked
        })
      });

      setStatus(accountStatus, "Compte existant relié. Vous pouvez maintenant ajouter votre premier logement.", "success");
      setStep(2);
    } catch (error) {
      setStatus(accountStatus, error.message || "Impossible de relier le compte existant.", "error");
    } finally {
      submitAccountBtn.disabled = false;
      submitAccountBtn.textContent = "Se connecter pour continuer";
    }
    return;
  }

  const password = document.getElementById("accountPassword").value;
  const passwordConfirm = document.getElementById("accountPasswordConfirm").value;

  if (password !== passwordConfirm) {
    setStatus(accountStatus, "Les mots de passe ne correspondent pas.", "error");
    return;
  }

  submitAccountBtn.disabled = true;
  submitAccountBtn.textContent = "Activation...";

  try {
    await fetchJSON("/api/client-onboarding/account", {
      method: "POST",
      body: JSON.stringify({
        token: state.token,
        full_name: document.getElementById("fullName").value.trim(),
        company_name: document.getElementById("companyName").value.trim(),
        password,
        phone: document.getElementById("accountPhone").value.trim(),
        main_city: document.getElementById("mainCity").value.trim(),
        email_notifications: document.getElementById("emailNotifications").checked,
        marketing_communications: document.getElementById("marketingCommunications").checked
      })
    });

    await supabaseClient.auth.signInWithPassword({
      email: document.getElementById("accountEmail").value.trim(),
      password
    });

    setStatus(accountStatus, "Compte activé. Vous pouvez maintenant ajouter votre premier logement.", "success");
    setStep(2);
  } catch (error) {
    setStatus(accountStatus, error.message || "Impossible de créer le compte client.", "error");
  } finally {
    submitAccountBtn.disabled = false;
    submitAccountBtn.textContent = "Continuer";
  }
}

async function submitListing(event) {
  event.preventDefault();
  setStatus(listingStatus, "", "");

  submitListingBtn.disabled = true;
  submitListingBtn.textContent = "Enregistrement...";

  try {
    const selectedAvailability = listingAvailability.value;
    const resolvedAvailability =
      selectedAvailability === "custom"
        ? document.getElementById("listingAvailabilityCustom").value
        : selectedAvailability;
    const inclusions = [
      document.getElementById("inclusionHeat").checked ? "Chauffé" : "",
      document.getElementById("inclusionElectricity").checked ? "Électricité incluse" : "",
      document.getElementById("inclusionWater").checked ? "Eau incluse" : ""
    ].filter(Boolean);

    await fetchJSON("/api/client-onboarding/listing", {
      method: "POST",
      body: JSON.stringify({
        token: state.token,
        adresse: document.getElementById("listingAddress").value.trim(),
        ville: document.getElementById("listingCity").value.trim(),
        type_logement: document.getElementById("listingType").value,
        chambres: document.getElementById("listingBedrooms").value.trim(),
        loyer: document.getElementById("listingRent").value,
        disponibilite: resolvedAvailability,
        inclusions: inclusions.join(", "),
        animaux_acceptes: document.querySelector('input[name="listingPets"]:checked')?.value || "",
        meuble: document.querySelector('input[name="listingFurnished"]:checked')?.value || "",
        stationnement: document.getElementById("listingParking").value,
        minimum_income_rule: document.getElementById("criteriaIncomeRule").value,
        credit_requirement: document.getElementById("criteriaCreditRequirement").value,
        tal_policy: document.getElementById("criteriaTalPolicy").value,
        occupants_limit: document.getElementById("criteriaOccupantsLimit").value,
        employment_requirement: document.getElementById("criteriaEmploymentRequirement").value,
        notes: document.getElementById("listingNotes").value.trim()
      })
    });

    showSuccess();
  } catch (error) {
    setStatus(listingStatus, error.message || "Impossible d’enregistrer le logement.", "error");
  } finally {
    submitListingBtn.disabled = false;
    submitListingBtn.textContent = "Enregistrer mon logement";
  }
}

if (accountForm) {
  accountForm.addEventListener("submit", submitAccount);
}

if (listingForm) {
  listingForm.addEventListener("submit", submitListing);
}

if (backToStep1Btn) {
  backToStep1Btn.addEventListener("click", () => setStep(1));
}

if (goToClientPortalBtn) {
  goToClientPortalBtn.addEventListener("click", () => {
    window.location.href = "/client.html";
  });
}

if (listingAvailability) {
  listingAvailability.addEventListener("change", () => {
    const isCustom = listingAvailability.value === "custom";
    listingAvailabilityCustomWrap.style.display = isCustom ? "flex" : "none";
    document.getElementById("listingAvailabilityCustom").required = isCustom;
  });
}

if (propertyTypeButtons) {
  propertyTypeButtons.querySelectorAll(".choice-pill").forEach((button) => {
    button.addEventListener("click", () => {
      propertyTypeButtons.querySelectorAll(".choice-pill").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById("listingType").value = button.dataset.value;
    });
  });
}

(async function init() {
  await loadSessionUser().catch(() => {});
  await loadLocations().catch(() => {});
  await validateInvitation();
})();
