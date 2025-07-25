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
    if (password.length < 6) {
      alert("Lozinka mora imati najmanje 6 karaktera!");
      return false;
    }
    return true;
  }

  // SIGNUP
  if (document.title === "SignUp") {
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("typeEmailX").value.trim();
        const password = document.getElementById("typePasswordX").value;

        if (!validateForm(email, password)) return;

        fetch(`${API_BASE_URL}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        })
          .then((response) =>
            response.json().then((data) => ({ status: response.status, body: data }))
          )
          .then(({ status, body }) => {
            alert(body.msg);
            if (status === 201 && body.status === "success") {
              signupForm.reset();
              window.location.href = "login.html";
            } else if (status === 409) {
              alert(`${body.msg} Pokušajte se prijaviti ili koristite drugi email.`);
            } else if (status === 500) {
              alert(`Greška na serveru: ${body.msg}`);
            } else {
              alert(body.msg || "Nepoznata greška. Pokušajte ponovo.");
            }
          })
          .catch((error) => {
            console.error("Greška prilikom registracije:", error);
            alert("Došlo je do greške. Provjerite konekciju ili pokušajte ponovo.");
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
