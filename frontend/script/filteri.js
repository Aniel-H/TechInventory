document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "http://yourdomain.com";

  let currentPage = 1;
  let totalPages = 1;

  const searchFilter = document.getElementById("searchFilter");
  const kategorijaFilter = document.getElementById("kategorijaFilter");
  const lokacijaFilter = document.getElementById("lokacijaFilter");
  const cijenaOdFilter = document.getElementById("cijenaOdFilter");
  const cijenaDoFilter = document.getElementById("cijenaDoFilter");
  const sortFilter = document.getElementById("sortFilter");
  const filterStanja = document.getElementById("filterStanja");
  const filterStatus = document.getElementById("filterStatus");
  const opremaTable = document.getElementById("opremaTable");

  // Učitavanje opcija za filtere
  function populateSelectFilter(url, selectElement, placeholder, useNameAsValue = false) {
    fetch(url, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        if (data.status === "success") {
          data.data.forEach((item) => {
            const option = document.createElement("option");
            option.value = useNameAsValue ? item.naziv : item.id;
            option.textContent = item.naziv;
            selectElement.appendChild(option);
          });
        }
      })
      .catch((err) => console.error("Greška:", err));
  }

  if (kategorijaFilter)
    populateSelectFilter(`${API_BASE_URL}/kategorije`, kategorijaFilter, "-- Sve kategorije --", true);

  if (lokacijaFilter)
    populateSelectFilter(`${API_BASE_URL}/lokacije`, lokacijaFilter, "-- Sve lokacije --");

  // Dodavanje event listenera na filtere
  [
    searchFilter,
    kategorijaFilter,
    lokacijaFilter,
    cijenaOdFilter,
    cijenaDoFilter,
    sortFilter,
    filterStanja,
    filterStatus,
  ].forEach((el) => {
    if (el) {
      el.addEventListener("input", () => fetchItems(1));
      el.addEventListener("change", () => fetchItems(1));
    }
  });

  // Funkcija za dohvatanje i prikaz artikala
  function fetchItems(page = 1) {
    currentPage = page;

    const params = new URLSearchParams();

    if (searchFilter?.value.trim()) params.append("search", searchFilter.value.trim());
    if (filterStanja?.value) params.append("stanje", filterStanja.value);
    if (filterStatus?.value) params.append("status", filterStatus.value);
    if (kategorijaFilter?.value) params.append("kategorija", kategorijaFilter.value);
    if (lokacijaFilter?.value) params.append("lokacije_id", lokacijaFilter.value);
    if (cijenaOdFilter?.value) params.append("cijena_od", cijenaOdFilter.value);
    if (cijenaDoFilter?.value) params.append("cijena_do", cijenaDoFilter.value);
    if (sortFilter && sortFilter.value) {
        // Razdvoji na sve dijelove
        const parts = sortFilter.value.split("_");
        // zadnji dio je order (asc/desc)
        const order = parts.pop(); 
        // ostalo spajamo nazad u sort
        const sort = parts.join("_");
        if (sort) params.append("sort", sort);
        if (order) params.append("order", order);
    }
    if (!sortFilter.value) {
        sortFilter.value = "cijena_asc";
    }

    params.append("page", currentPage);
    params.append("per_page", 20);

    fetch(`${API_BASE_URL}/oprema?${params.toString()}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          totalPages = data.total_pages || 1;

          opremaTable.innerHTML = "";
          if (!data.data.length) {
            opremaTable.innerHTML = "<tr><td colspan='9'>Nema artikala za prikaz.</td></tr>";
            return;
          }

          data.data.forEach((item) => {

            function prikaziNaziv(item) {
              const p = item.proizvodjac;
                console.log(item.proizvodjac);
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
                <button class="delete-btn" id="deleteItem" onclick="deleteItem(${item.id})">Obriši</button>
                <button class="edit-btn" id="editItem" onclick="editItem(${item.id})">Uredi</button>
            </td>
            `;
            opremaTable.appendChild(row);
          });

          document.getElementById("currentPage").textContent = `${currentPage} / ${totalPages}`;
          document.getElementById("prevPage").disabled = currentPage <= 1;
          document.getElementById("nextPage").disabled = currentPage >= totalPages;
        } else {
          alert(data.msg || "Greška pri dohvatanju podataka.");
        }
      })
      .catch((err) => {
        console.error("Greška pri dohvatanju opreme:", err);
      });
  }

  // Navigacija stranica
  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) fetchItems(currentPage - 1);
  });

  document.getElementById("nextPage")?.addEventListener("click", () => {
    if (currentPage < totalPages) fetchItems(currentPage + 1);
  });

  fetchItems(); // učitaj odmah na početku
});
