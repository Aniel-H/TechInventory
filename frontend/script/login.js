document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "http://yourdomain.com";
  const token = localStorage.getItem("auth_token");
  if (token) {
    // Korisnik je već prijavljen, preusmjeri na index.html
    window.location.href = "index.html";
  }

  // Funkcija za validaciju forme (email i lozinka)
  function validateForm(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password) {
      alert("Sva polja su obavezna!");
      return false;
    }
    if (!emailRegex.test(email)) {
      alert("Unesite važeću email adresu!");
      return false;
    }
    return true;
  }

  // LOGIN
  if (document.title === "LogIn") {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("typeEmailX").value.trim();
        const password = document.getElementById("typePasswordX").value;

        if (!validateForm(email, password)) return;

        fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              if (data.token) {
                localStorage.setItem("auth_token", data.token);
              }
              if (data.redirect) {
                window.location.href = data.redirect;
              } else {
                window.location.href = "index.html";
              }
            } else {
              alert(data.msg || "Greška pri prijavi.");
            }
          })
          .catch((error) => {
            console.error("Greška prilikom logina:", error);
            alert("Došlo je do greške. Pokušajte ponovo.");
          });
      });
    }
  }
});

const passwordInput = document.getElementById("typePasswordX");
const showPasswordCheckbox = document.getElementById("showPassword");

if (passwordInput && showPasswordCheckbox) {
  showPasswordCheckbox.addEventListener("change", function () {
    passwordInput.type = this.checked ? "text" : "password";
  });
}
