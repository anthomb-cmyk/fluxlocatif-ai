const SUPABASE_URL = "https://nuuzkvgyolxbawvqyugu.supabase.co";
const SUPABASE_KEY = "sb_publishable_103-rw3MwM7k2xUeMMUodg_fRr9vUD4";

console.log("[login] init", {
  hasSupabaseUrl: Boolean(SUPABASE_URL),
  hasSupabaseAnonKey: Boolean(SUPABASE_KEY)
});

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
    console.log("[login] waitForSession result", {
      attempt: index + 1,
      hasSession: Boolean(data?.session),
      userId: data?.session?.user?.id || null,
      error: error ? { message: error.message, name: error.name } : null
    });

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
  console.log("[login] redirectIfLoggedIn start");
  const session = await waitForSession(1, 0);

  if (session) {
    const destination = getPostLoginDestination();
    console.log("[login] resolved redirect destination", {
      source: "redirectIfLoggedIn",
      destination,
      userId: session.user?.id || null
    });
    window.location.replace(destination);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginStatus("", "");

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    console.log("[login] submit start", {
      email,
      hasPassword: Boolean(password)
    });

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      console.log("[login] signInWithPassword result", {
        hasSession: Boolean(data?.session),
        userId: data?.session?.user?.id || null,
        error: error ? { message: error.message, name: error.name } : null
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
      console.log("[login] resolved redirect destination", {
        source: "submit",
        destination,
        userId: session.user?.id || null
      });
      window.location.replace(destination);
    } catch (error) {
      console.error("[login] caught error", {
        message: error.message || String(error),
        name: error.name || "Error"
      });
      setLoginStatus(error.message || "Erreur de connexion.", "error");
    }
  });
}

redirectIfLoggedIn();
