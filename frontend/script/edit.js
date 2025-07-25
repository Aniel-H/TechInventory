document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "http://yourdomain.com";

  let selectedId = null;
  const editModal = document.getElementById("editModal");

  function showMessage(msg, isError = false) {
    const msgBox = document.getElementById("editMessageBox");
    if (!msgBox) return;
    msgBox.textContent = msg;
    msgBox.style.color = isError ? "red" : "green";
    msgBox.style.display = "block";
    setTimeout(() => {
      msgBox.style.display = "none";
    }, 3000);
  }

  function showEditLoader() {
    document.getElementById("editLoader").style.display = "block";
  }
  function hideEditLoader() {
    document.getElementById("editLoader").style.display = "none";
  }

  function loadSelectOptions() {
    fetch(`${API_BASE_URL}/kategorije`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          const select = document.getElementById("editKategorija");
          select.innerHTML = '<option value="">-- Odaberi kategoriju --</option>';
          data.data.forEach(k => {
            const opt = document.createElement("option");
            opt.value = k.id;
            opt.textContent = k.naziv;
            select.appendChild(opt);
          });
        }
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/proizvodjaci`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          const select = document.getElementById("editProizvodjac");
          select.innerHTML = '<option value="">-- Nepoznat --</option>';
          data.data.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.naziv;
            select.appendChild(opt);
          });
        }
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/lokacije`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          const select = document.getElementById("editLokacija");
          select.innerHTML = '<option value="">-- Odaberi lokaciju --</option>';
          data.data.forEach(l => {
            const opt = document.createElement("option");
            opt.value = l.id;
            opt.textContent = l.naziv;
            select.appendChild(opt);
          });
        }
      })
      .catch(console.error);
  }

  loadSelectOptions();

  window.editItem = function (id) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      showMessage("Niste prijavljeni!", true);
      return;
    }

    fetch(`${API_BASE_URL}/oprema/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Greška pri dohvaćanju podataka");
        return res.json();
      })
      .then(data => {
        const item = data.data;

        selectedId = item.id || id;

        document.getElementById("idArtikla").value = selectedId;
        document.getElementById("editNaziv").value = item.naziv || "";
        document.getElementById("editKategorija").value = item.kategorija_id || "";
        document.getElementById("editProizvodjac").value = item.proizvodjac_id || "";
        document.getElementById("editLokacija").value = item.lokacije_id || "";
        document.getElementById("editStanje").value = item.stanje || "NOVO";
        document.getElementById("editStatus").value = item.status != null ? item.status : "1";
        document.getElementById("editCijena").value = item.cijena || "";

        editModal.style.display = "flex";
      })
      .catch(err => {
        console.error("Greška:", err);
        showMessage("Greška pri učitavanju podataka za uređivanje.", true);
      });
  };

  function closeEditModal() {
    editModal.style.display = "none";
    selectedId = null;
  }

  document.getElementById("closeEditModal")?.addEventListener("click", closeEditModal);
  document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);

  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal();
    }
  });

  function validateItemForm(naziv, kategorija, lokacije_id, cijena) {
    if (!naziv || !kategorija || !lokacije_id || isNaN(cijena) || cijena <= 0) {
      showMessage("Sva obavezna polja moraju biti popunjena i cijena mora biti veća od 0!", true);
      return false;
    }
    return true;
  }

  document.getElementById("editConfirmBtn")?.addEventListener("click", () => {
    if (!selectedId) {
      showMessage("Nije odabran artikal za uređivanje.", true);
      return;
    }

    const naziv = document.getElementById("editNaziv").value.trim();
    const kategorija = document.getElementById("editKategorija").value;
    const proizvodjac_id = document.getElementById("editProizvodjac").value || null;
    const lokacije_id = document.getElementById("editLokacija").value;
    const stanje = document.getElementById("editStanje").value;
    const status = document.getElementById("editStatus").value;
    const cijena = parseFloat(document.getElementById("editCijena").value);

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
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          showMessage(data.msg || "Greška pri uređivanju artikla.", true);
          return;
        }
        showMessage(data.msg || "Artikal je ažuriran.");
        closeEditModal();
        if (typeof fetchItems === "function") fetchItems(currentPage);
        window.location.reload();
      })
      .catch(err => {
        console.error("Greška prilikom uređivanja artikla:", err);
        showMessage("Došlo je do greške. Pokušajte ponovo.", true);
      });
  });
});