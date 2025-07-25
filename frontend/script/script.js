document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "http://yourdomain.com";

  let currentPage = 1;
  let totalPages = 1;
  let selectedId = null;

  // Provjera autentifikacije za zaštićene stranice (Inventar i Unos Artikla)
  const protectedPages = ["Inventar", "Unos Artikla"];
  if (protectedPages.includes(document.title)) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
  }
  const confirmBtn = document.getElementById("confirmDelete");

  const modal = document.getElementById("deleteModal");
  const closeBtn = modal ? modal.querySelector(".close") : null;
  const cancelBtn = document.getElementById("cancelDelete");
  const confirmEditBtn = document.getElementById("confirmEdit");

  const editModal = document.getElementById("editModal");
  const closeEditBtn = editModal ? editModal.querySelector(".close") : null;
  const cancelEditBtn = document.getElementById("cancelEdit");
  
  const imageModal = document.getElementById("imageModal");
  const cancelImageBtn = document.getElementById("cancelImage");

  // DELETE modal funkcionalnost
  if (modal && closeBtn && cancelBtn && confirmBtn) {
    closeBtn.onclick = () => (modal.style.display = "none");
    cancelBtn.onclick = () => (modal.style.display = "none");

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };

    confirmBtn.onclick = () => {
      fetch(`${API_BASE_URL}/delete/${selectedId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      })
        .then((res) => res.json())
        .then(() => {
          fetchItems(currentPage);
        })
        .catch((err) => {
          console.error("Greška:", err);
          alert("Došlo je do greške pri slanju zahtjeva.");
        });

      modal.style.display = "none";
    };
  }

  // EDIT modal funkcionalnost
  if (editModal && closeEditBtn && cancelEditBtn && confirmEditBtn) {
    closeEditBtn.addEventListener("click", closeEditModal);
    cancelEditBtn.addEventListener("click", closeEditModal);

    window.addEventListener("click", (event) => {
      if (event.target === editModal) {
        editModal.style.display = "none";
      }
    });

    confirmEditBtn.addEventListener("click", () => {
      const naziv = document.getElementById("editNaziv").value.trim();
      const kategorija = document.getElementById("editKategorija").value;
      const proizvodjac_id = document.getElementById("editProizvodjac").value;
      const lokacije_id = document.getElementById("editLokacija").value;
      const cijena = parseFloat(document.getElementById("editCijena").value);

      if (!validateItemForm(naziv, kategorija, lokacije_id, cijena)) return;

      if (idArtikla == null || idArtikla.value.trim() === "") {
        alert("Nije odabrano ništa za uređivanje.");
        return;
      }

      fetch(`${API_BASE_URL}/edit/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
        body: JSON.stringify({ naziv, kategorija, proizvodjac_id, lokacije_id, cijena }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.msg);
          if (data.status === "success") {
            closeEditModal();
            fetchItems(currentPage);
          }
        })
        .catch((error) => {
          console.error("Greška pri uređivanju artikla:", error);
          alert("Došlo je do greške. Pokušajte ponovo.");
        });
    });
  }
function editItem(id) {
  const token = localStorage.getItem("auth_token");
  const editModal = document.getElementById("editModal");

  fetch(`${API_BASE_URL}/oprema/${id}`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
  },
})
.then(res => {



      const item = data.data;
      document.getElementById("editNaziv").value = item.naziv || "";
      document.getElementById("editKategorija").value = item.kategorija_id || "";
      document.getElementById("editProizvodjac").value = item.proizvodjac_id || "";
      document.getElementById("editLokacija").value = item.lokacije_id || "";
      document.getElementById("editStanje").value = item.stanje || "";
      document.getElementById("editStatus").value = item.status || "1";
      document.getElementById("editCijena").value = item.cijena || "";

      selectedId = id;
      editModal.style.display = "flex";
    })
    .catch((err) => {
      console.error("Greška:", err);
      alert("Greška pri učitavanju podataka za uređivanje.");
    });
}

  if (editConfirmBtn) {
    editConfirmBtn.onclick = () => {
      
      if (idArtikla == null || idArtikla.value.trim() === "") {
        alert("Nije odabrano ništa za uređivanje.");
        return;
      }

      const naziv = document.getElementById("editNaziv").value.trim();
      const kategorija = document.getElementById("editKategorija").value;
      const proizvodjac_id = document.getElementById("editProizvodjac").value || null;
      const lokacije_id = document.getElementById("editLokacija").value;
      const stanje = document.getElementById("editStanje").value;
      const status = document.getElementById("editStatus").value;
      const cijena = parseFloat(document.getElementById("editCijena").value);
      const datumOdFilter = document.getElementById("datumOdFilter");
      const datumDoFilter = document.getElementById("datumDoFilter");

      const params = new URLSearchParams();

      if (datumOdFilter && datumOdFilter.value) {
          params.append("datum_od", datumOdFilter.value);
      }
      if (datumDoFilter && datumDoFilter.value) {
          params.append("datum_do", datumDoFilter.value);
      }

      if (!validateItemForm(naziv, kategorija, lokacije_id, cijena)) return;

      fetch(`${API_BASE_URL}/oprema/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          naziv,
          kategorija,
          proizvodjac_id,
          lokacije_id,
          stanje,
          status,
          cijena,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.msg || "Artikal je ažuriran.");
          if (data.status === "success") {
            closeEditModal();
            fetchItems(currentPage);
          }
        })
        .catch((err) => {
          console.error("Edit submit error:", err);
        });
    };
  }

  function loadSelectOptions() {
  fetch('http://127.0.0.1:5000/kategorije').then(r => r.json()).then(data => {
    if(data.status === 'success') {
      const select = document.getElementById('editKategorija');
      select.innerHTML = '<option value="">-- Odaberi kategoriju --</option>';
      data.data.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.naziv;
        select.appendChild(opt);
      });
    }
  });
  // isto za proizvodjaci i lokacije
  fetch('http://127.0.0.1:5000/proizvodjaci').then(r => r.json()).then(data => {
    if(data.status === 'success') {
      const select = document.getElementById('editProizvodjac');
      select.innerHTML = '<option value="">-- Nepoznat --</option>';
      data.data.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.naziv;
        select.appendChild(opt);
      });
    }
  });

  fetch('http://127.0.0.1:5000/lokacije').then(r => r.json()).then(data => {
    if(data.status === 'success') {
      const select = document.getElementById('editLokacija');
      select.innerHTML = '<option value="">-- Odaberi lokaciju --</option>';
      data.data.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.naziv;
        select.appendChild(opt);
      });
    }
  });
}

// pozovi ovo jednom na učitavanju stranice:
loadSelectOptions();


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

  async function openEditModal(id) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Niste prijavljeni!");
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:5000/oprema/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json();
      alert(errData.msg || "Greška pri dohvaćanju podataka.");
      return;
    }

    const json = await res.json();
    const artikal = json.data;

    // Popuni polja forme (pretpostavljam da ti inputi imaju id-e po imenu)
    document.getElementById('edit-naziv').value = artikal.naziv || '';
    document.getElementById('edit-cijena').value = artikal.cijena || '';
    document.getElementById('edit-kategorija').value = artikal.kategorija_id || '';
    document.getElementById('edit-proizvodjac').value = artikal.proizvodjac_id || '';
    document.getElementById('edit-lokacije').value = artikal.lokacije_id || '';
    document.getElementById('edit-stanje').value = artikal.stanje || '';
    document.getElementById('edit-status').value = artikal.status || '';

    // Opcionalno: prikaži sliku ako postoji
    if (artikal.slika) {
      document.getElementById('edit-slika-preview').src = `http://127.0.0.1:5000/images/${artikal.slika}`;
      document.getElementById('edit-slika-preview').style.display = 'block';
    } else {
      document.getElementById('edit-slika-preview').style.display = 'none';
    }

    // Otvori modal (ovisno o frameworku, npr. Bootstrap)
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();

  } catch (error) {
    console.error('Greška:', error);
    alert('Greška pri komunikaciji sa serverom.');
  }
}

  // Funkcija za validaciju forme za unos ili uređivanje artikla
  function validateItemForm(naziv, kategorija, lokacije_id, cijena) {
    if (!naziv || !kategorija || !lokacije_id || isNaN(cijena) || cijena <= 0) {
      alert("Sva obavezna polja moraju biti popunjena i cijena mora biti veća od 0!");
      return false;
    }
    return true;
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
        const slikaInput = document.getElementById("slika");

        if (!validateItemForm(naziv, kategorija, lokacije_id, cijena)) return;

        const formData = new FormData();
        formData.append("naziv", naziv);
        formData.append("kategorija", kategorija);
        if (proizvodjac_id) formData.append("proizvodjac_id", proizvodjac_id);
        formData.append("lokacije_id", lokacije_id);
        formData.append("cijena", cijena);
        if (slikaInput && slikaInput.files.length > 0) {
          formData.append("slika", slikaInput.files[0]);
        }

        fetch(`${API_BASE_URL}/unos`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
          body: formData,
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

  if (confirmEditBtn) {
    confirmEditBtn.onclick = function () {
      if (selectedId) {
        editItem(selectedId);
      } else {
        alert("Greška: ID nije odabran.");
      }
    };
  }


  

  // INVENTORY PAGE (index.html) - prikaz i filtriranje artikala + paginacija
  if (document.title === "Inventar") {
    const searchFilter = document.getElementById("searchFilter");
    const kategorijaFilter = document.getElementById("kategorijaFilter");
    const lokacijaFilter = document.getElementById("lokacijaFilter");
    const cijenaOdFilter = document.getElementById("cijenaOdFilter");
    const cijenaDoFilter = document.getElementById("cijenaDoFilter");
    const sortFilter = document.getElementById("sortFilter");
    const opremaTable = document.getElementById("opremaTable");
    const filterStanja = document.getElementById("filterStanja");
    const filterStatus = document.getElementById("filterStatus");
    
    function fetchItems(page = 1) {
      currentPage = page;

      const params = new URLSearchParams();

      params.append("page", currentPage);
      params.append("per_page", 20);

      fetch(`${API_BASE_URL}/oprema?${params.toString()}`, { credentials: "include" })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            totalPages = data.total_pages || 1;

            opremaTable.innerHTML = "";
            if (data.data.length === 0) {
              opremaTable.innerHTML = "<tr><td id='NoAr' colspan='9'>Nema artikala za prikaz.</td></tr>";
            } else {
              data.data.forEach((item) => {

                function prikaziNaziv(item) {
                    console.log(item.proizvodjac);
                  const p = item.proizvodjac;
                  if (
                    p &&
                    p !== "0" &&
                    p !== 0 &&
                    p !== null &&
                    p !== undefined &&
                    p !== "" &&
                    String(p).toLowerCase() !== "null" &&
                    String(p).toLowerCase() !== "undefined"
                  ) {
                    return p + " " + item.naziv;
                  }
                  return item.naziv;
                }

                const row = document.createElement("tr");
                row.innerHTML = `
                <tr>
                  <td>
                    <button class="img-btn" onclick="imageModal(this)">
                      <img src="${API_BASE_URL}/images/${item.slika}" alt="${item.naziv}" style="max-width: 100px; max-height: 100px;">
                    </button>
                  </td>
                  <td>${prikaziNaziv(item)}</td>
                  <td>${item.kategorija || "N/A"}</td>
                  <td>${!isNaN(parseFloat(item.cijena)) ? parseFloat(item.cijena).toFixed(2) + " KM" : "N/A"}</td>
                  <td>${item.lokacija || "NEPOZNATA"}</td>
                  <td>${item.datum_objave || "N/A"}</td>
                  <td>${prikaziStanje(item.stanje) || "N/A"}</td>
                  <td class="${item.status == 1 ? 'text-green' : 'text-red'}">
                    ${item.status == 1 ? "Ima na stanju" : "Nema na stanju"}
                  </td>
                  <td class="actions">
                    <button id="delete-btn" class="delete-btn" onclick="deleteItem(${item.id})">Obriši</button>
                    <button id="edit-btn" class="edit-btn" onclick="editItem(${item.id})">Uredi</button>
                  </td>
                </tr>
                `;
                opremaTable.appendChild(row);
              });
            }

            document.getElementById("currentPage").textContent = `${currentPage} / ${totalPages}`;
            document.getElementById("prevPage").disabled = currentPage <= 1;
            document.getElementById("nextPage").disabled = currentPage >= totalPages;
          } else {
            alert(data.msg || "Greška pri dohvaćanju podataka.");
          }
        })
        .catch((error) => {
          console.error("Greška pri dohvatanju opreme:", error);
        });
    }

    document.getElementById("prevPage").addEventListener("click", () => {
      if (currentPage > 1) fetchItems(currentPage - 1);
    });

    document.getElementById("nextPage").addEventListener("click", () => {
      if (currentPage < totalPages) fetchItems(currentPage + 1);
    });

    fetchItems();
  }

  // Tema toggle
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

  // Logout funkcija
  document.getElementById("logoutLink")?.addEventListener("click", function (event) {
    event.preventDefault();
    fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then(() => {
        localStorage.removeItem("auth_token");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Greška prilikom odjave:", error);
        alert("Došlo je do greške. Pokušajte ponovo.");
      });
  });

  // Pomoćne funkcije za modal
  window.deleteItem = function (id) {
    selectedId = id;
    modal.style.display = "block";
  };

  window.editItem = function (id) {
    selectedId = id;
    editModal.style.display = "block";
    // bez fetch logike
  };

  // Korak 3: Povezivanje dugmadi "Uredi" iz tabele sa modalom i popunjavanje forme
document.querySelectorAll(".editBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-id");
    selectedId = id;  // možeš koristiti globalnu varijablu da pamtiš koji se uređuje

    fetch(`${API_BASE_URL}/oprema/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) throw new Error("Greška pri dohvaćanju podataka");
        return res.json();
      })
      .then((data) => {
        // Popuni polja u modal formi
        document.getElementById("idArtikla").value = data.id;

        document.getElementById("editNaziv").value = data.naziv;
        document.getElementById("editKategorija").value = data.kategorija_id;
        document.getElementById("editProizvodjac").value = data.proizvodjac_id || "";
        document.getElementById("editLokacija").value = data.lokacija_id;
        document.getElementById("editStanje").value = data.stanje;
        document.getElementById("editStatus").value = data.status;
        document.getElementById("editCijena").value = data.cijena;

        // Prikazi modal i koristi flex da centriras
        editModal.style.display = "flex";
      })
      .catch((err) => {
        console.error("Greška pri dohvatu artikla za edit:", err);
        alert("Ne mogu učitati podatke artikla.");
      });
  });
});

});

 function prikaziStanje(stanje) {
  if (!stanje) return '';
  const stanjeUpper = stanje.toUpperCase();

  if (stanjeUpper === 'KORISTENO') return 'KORIŠTENO';
  if (stanjeUpper === 'NOVO') return 'NOVO';

  return stanjeUpper;  // uvijek velika slova, bez obzira što je u bazi
}



function imageModal(button) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const captionText = document.getElementById("caption");

  if (!button || !modal || !modalImg || !captionText) return;

  const img = button.querySelector("img");
  if (!img) return;

  modal.style.display = "block";
  modalImg.src = img.src;
  modalImg.alt = img.alt || "Slika artikla";
  captionText.textContent = img.alt || "Slika artikla";

  const closeBtn = modal.querySelector(".close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const cancelBtn = document.getElementById("cancelEditBtn");
    cancelBtn.addEventListener("click", closeEditModal);
  });
