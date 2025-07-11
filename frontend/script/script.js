document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "http://yourdomain.com";

  // Provjera autentifikacije za zaštićene stranice (Inventar i Unos Artikla)
  const protectedPages = ["Inventar", "Unos Artikla"];
  if (protectedPages.includes(document.title)) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
  }

  // Funkcija za validaciju login/signup forme
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

  // Funkcija za validaciju forme za unos artikla
  function validateItemForm(naziv, kategorija, lokacije_id, cijena) {
    if (!naziv || !kategorija || !lokacije_id || isNaN(cijena) || cijena <= 0) {
      alert("Sva obavezna polja moraju biti popunjena i cijena mora biti veća od 0!");
      return false;
    }
    return true;
  }

  // LOGIN - obrada prijave
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
          credentials: "include"
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

  // SIGNUP - obrada registracije
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
          credentials: "include"
        })
          .then((response) => response.json().then(data => ({ status: response.status, body: data })))
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

  // ADD ITEM - unos novog artikla
  if (document.title === "Unos Artikla") {
    const form = document.getElementById("addForm");
    if (form) {
      function populateSelect(url, selectId) {
        fetch(url, { credentials: "include" })
          .then((response) => response.json())
          .then((data) => {
            const select = document.getElementById(selectId);
            if (!select) return;
            select.innerHTML = `<option value="">-- Odaberi --</option>`;
            if (data.status === "success" && data.data) {
              data.data.forEach((item) => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.naziv;
                select.appendChild(option);
              });
            } else {
              console.error(`Greška pri popunjavanju ${selectId}:`, data.msg);
            }
          })
          .catch((error) => console.error(`Greška pri dohvatanju ${selectId}:`, error));
      }

      populateSelect(`${API_BASE_URL}/kategorije`, "kategorija");
      populateSelect(`${API_BASE_URL}/proizvodjaci`, "proizvodjac");
      populateSelect(`${API_BASE_URL}/lokacije`, "lokacija");

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const naziv = document.getElementById("naziv").value.trim();
        const kategorija = document.getElementById("kategorija").value;
        const proizvodjac_id = document.getElementById("proizvodjac").value || null;
        const lokacije_id = document.getElementById("lokacija").value;
        const cijena = parseFloat(document.getElementById("cijena").value);

        if (!validateItemForm(naziv, kategorija, lokacije_id, cijena)) return;

        fetch(`${API_BASE_URL}/unos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ naziv, kategorija, proizvodjac_id, lokacije_id, cijena })
        })
          .then((response) => response.json())
          .then((data) => {
            alert(data.msg);
            if (data.status === "success") {
              form.reset();
              window.location.href = "index.html";
            }
          })
          .catch((error) => {
            console.error("Greška pri unosu artikla:", error);
            alert("Došlo je do greške. Pokušajte ponovo.");
          });
      });
    }
  }

  // INVENTORY PAGE (index.html) - prikaz i filtriranje artikala
  if (document.title === "Inventar") {
    const kategorijaFilter = document.getElementById("kategorijaFilter");
    const lokacijaFilter = document.getElementById("lokacijaFilter");
    const datumOdFilter = document.getElementById("datumOdFilter");
    const datumDoFilter = document.getElementById("datumDoFilter");
    const cijenaOdFilter = document.getElementById("cijenaOdFilter");
    const cijenaDoFilter = document.getElementById("cijenaDoFilter");
    const sortFilter = document.getElementById("sortFilter");
    const opremaTable = document.getElementById("opremaTable");

    if (kategorijaFilter) {
      fetch(`${API_BASE_URL}/kategorije`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          kategorijaFilter.innerHTML = `<option value="">-- Sve --</option>`;
          if (data.status === "success") {
            data.data.forEach((item) => {
              const option = document.createElement("option");
              option.value = item.naziv;
              option.textContent = item.naziv;
              kategorijaFilter.appendChild(option);
            });
          } else {
            console.error("Greška pri dohvatu kategorija:", data.msg);
            alert("Greška pri učitavanju kategorija. Pokušajte ponovo.");
          }
        })
        .catch((err) => {
          console.error("Greška pri dohvatu kategorija:", err);
          alert("Greška pri učitavanju kategorija. Pokušajte ponovo.");
        });

      kategorijaFilter.addEventListener("change", fetchItems);
    }

    if (lokacijaFilter) {
      fetch(`${API_BASE_URL}/lokacije`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          lokacijaFilter.innerHTML = `<option value="">-- Sve --</option>`;
          if (data.status === "success") {
            data.data.forEach((item) => {
              const option = document.createElement("option");
              option.value = item.id;
              option.textContent = item.naziv;
              lokacijaFilter.appendChild(option);
            });
          } else {
            console.error("Greška pri dohvatu lokacija:", data.msg);
            alert("Greška pri učitavanju lokacija. Pokušajte ponovo.");
          }
        })
        .catch((err) => {
          console.error("Greška pri dohvatu lokacija:", err);
          alert("Greška pri učitavanju lokacija. Pokušajte ponovo.");
        });

      lokacijaFilter.addEventListener("change", fetchItems);
    }

    if (datumOdFilter) {
      datumOdFilter.addEventListener("change", fetchItems);
    }

    if (datumDoFilter) {
      datumDoFilter.addEventListener("change", fetchItems);
    }

    if (cijenaOdFilter) {
      cijenaOdFilter.addEventListener("change", fetchItems);
    }

    if (cijenaDoFilter) {
      cijenaDoFilter.addEventListener("change", fetchItems);
    }

    if (sortFilter) {
      sortFilter.addEventListener("change", fetchItems);
    }

    function fetchItems() {
      const params = new URLSearchParams();

      if (kategorijaFilter && kategorijaFilter.value) {
        params.append("kategorija", kategorijaFilter.value);
      }
      if (lokacijaFilter && lokacijaFilter.value) {
        params.append("lokacije_id", lokacijaFilter.value);
      }
      if (datumOdFilter && datumOdFilter.value) {
        params.append("datum_od", datumOdFilter.value);
      }
      if (datumDoFilter && datumDoFilter.value) {
        params.append("datum_do", datumDoFilter.value);
      }
      if (cijenaOdFilter && cijenaOdFilter.value) {
        params.append("cijena_od", cijenaOdFilter.value);
      }
      if (cijenaDoFilter && cijenaDoFilter.value) {
        params.append("cijena_do", cijenaDoFilter.value);
      }
      if (sortFilter && sortFilter.value) {
        const [sort, order] = sortFilter.value.split("_");
        if (sort) params.append("sort", sort);
        if (order) params.append("order", order);
      }

      console.log(`Slanje zahtjeva: ${API_BASE_URL}/oprema?${params.toString()}`);  // Debug
      fetch(`${API_BASE_URL}/oprema?${params.toString()}`, {
        credentials: "include"
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            opremaTable.innerHTML = "";
            if (data.data.length === 0) {
              opremaTable.innerHTML = "<tr><td colspan='4'>Nema artikala za prikaz.</td></tr>";
            } else {
              data.data.forEach((item) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                  <td>${item.naziv || "N/A"}</td>
                  <td>${item.kategorija || "N/A"}</td>
                  <td>${!isNaN(parseFloat(item.cijena)) ? parseFloat(item.cijena).toFixed(2) : "N/A"}</td>
                  <td>${item.lokacija || "N/A"}</td>
                `;
                opremaTable.appendChild(row);
              });
            }
          } else {
            console.error("Greška pri dohvatanju opreme:", data.msg);
            alert(data.msg || "Greška pri dohvatanju artikala.");
          }
        })
        .catch((error) => {
          console.error("Greška pri dohvatanju opreme:", error);
          alert("Došlo je do greške pri učitavanju artikala. Pokušajte ponovo.");
        });
    }

    fetchItems();

    document.getElementById("themeToggle")?.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark-theme") ? "dark" : "light"
      );
    });

    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-theme");
    }

    document.getElementById("logoutLink")?.addEventListener("click", function (event) {
      event.preventDefault();
      fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include"
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.msg || "Uspješno ste se odjavili.");
          if (data.status === "success") {
            localStorage.removeItem("auth_token");
            window.location.href = "login.html";
          }
        })
        .catch((error) => {
          console.error("Greška prilikom odjave:", error);
          alert("Došlo je do greške. Pokušajte ponovo.");
        });
    });
  }
});