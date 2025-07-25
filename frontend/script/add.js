document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("addForm");
  const porukaElem = document.getElementById("poruka");
  const token = localStorage.getItem("auth_token");
  const API_BASE_URL = "http://127.0.0.1:5000";

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Učitaj kategorije
  fetch(`${API_BASE_URL}/kategorije`, {
    headers: { "Authorization": "Bearer " + token }
  })
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("kategorija");
      data.data.forEach(k => {
        const option = document.createElement("option");
        option.value = k.id;
        option.textContent = k.naziv;
        select.appendChild(option);
      });
    });

  // Učitaj proizvođače
  fetch(`${API_BASE_URL}/proizvodjaci`, {
    headers: { "Authorization": "Bearer " + token }
  })
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("proizvodjac");
      data.data.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.naziv;
        select.appendChild(option);
      });
    });

  // Učitaj lokacije
  fetch(`${API_BASE_URL}/lokacije`, {
    headers: { "Authorization": "Bearer " + token }
  })
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("lokacija");
      data.data.forEach(lok => {
        const option = document.createElement("option");
        option.value = lok.id;
        option.textContent = lok.naziv;
        select.appendChild(option);
      });
    });

  // Funkcija za ponovno učitavanje opreme (implementiraj po potrebi)
  function ucitajOpremu() {
    // Ovdje možeš napisati kod za ponovno učitavanje liste opreme
    // npr. fetch i update DOM
    console.log("Pozvana funkcija ucitajOpremu()");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const naziv = document.getElementById("naziv").value.trim();
    const kategorija = document.getElementById("kategorija").value;
    const proizvodjacSelect = document.getElementById("proizvodjac");
    const proizvodjac = proizvodjacSelect.value.trim();
    const lokacije_id = document.getElementById("lokacija").value;
    const cijena = parseFloat(document.getElementById("cijena").value);
    const stanje = document.getElementById("stanje").value;
    const status = document.getElementById("status").checked ? 1 : 0;
    const slikaInput = document.getElementById("slika");

    if (!naziv || !kategorija || !lokacije_id || isNaN(cijena)) {
      porukaElem.textContent = "Sva obavezna polja moraju biti popunjena!";
      porukaElem.style.color = "red";
      setTimeout(() => {
        porukaElem.textContent = "";
      }, 4000);
      return;
    }

    const formData = new FormData();
    formData.append("naziv", naziv);
    formData.append("kategorija", kategorija);
    if (proizvodjac && proizvodjac !== "") {
      formData.append("proizvodjac_id", proizvodjac);
    }
    formData.append("lokacije_id", lokacije_id);
    formData.append("cijena", cijena);
    formData.append("stanje", stanje);
    formData.append("status", status);

    if (slikaInput.files.length > 0) {
      formData.append("slika", slikaInput.files[0]);
    }

    fetch("http://127.0.0.1:5000/unos", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + token
  },
  body: formData
})
.then(async (res) => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Raw odgovor:", text);
  // pokušaj parsirati JSON ako može
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Odgovor nije validan JSON");
  }
})
.then(data => {
  console.log("Parsed data:", data);
  document.getElementById("poruka").textContent = data.msg || "Artikal uspješno dodan!";
  document.getElementById("poruka").style.color = "green";
  form.reset();
  setTimeout(() => {
    document.getElementById("poruka").textContent = "";
  }, 4000);
})
.catch(err => {
  console.error("Fetch error ili parsiranje:", err);
  document.getElementById("poruka").textContent = err.message || "Došlo je do greške!";
  document.getElementById("poruka").style.color = "red";
  setTimeout(() => {
    document.getElementById("poruka").textContent = "";
  }, 4000);
});

  });
});
