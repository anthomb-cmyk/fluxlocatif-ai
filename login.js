const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY = "sb_publishable_103-rw3MwM7k2xUeMMUodg_fRr9vUD4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginStatus = document.getElementById("loginStatus");

function getPostLoginDestination() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/";
  return next.startsWith("/") ? next : "/";
}

async function waitForSession(maxAttempts = 10, delayMs = 150) {
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

function setLoginStatus(message = "", type = "") {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.className = "login-status";
  if (type) loginStatus.classList.add(type);
}

async function redirectIfLoggedIn() {
  const session = await waitForSession(1, 0);

  if (session) {
    const destination = getPostLoginDestination();
    window.location.replace(destination);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginStatus("", "");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setLoginStatus(error.message, "error");
        return;
      }

      const session = await waitForSession();

      if (!session) {
        setLoginStatus("Connexion réussie, mais la session n’a pas pu être confirmée. Réessayez.", "error");
        return;
      }

      const destination = getPostLoginDestination();
      window.location.replace(destination);
    } catch (error) {
      setLoginStatus(error.message || "Erreur de connexion.", "error");
    }
  });
}

redirectIfLoggedIn();
