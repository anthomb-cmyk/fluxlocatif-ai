const form = document.getElementById("loginForm");
const errorText = document.getElementById("loginError");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  errorText.textContent = "";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Erreur de connexion.");
    }

    localStorage.setItem("fluxlocatif_logged_in", "true");
    window.location.href = "/index.html";
  } catch (error) {
    errorText.textContent = error.message || "Connexion impossible.";
  }
});
