let map;
let markers = [];
let allRecords = [];

/* =========================
   Google Maps
========================= */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.916, lng: -23.509 },
    zoom: 13,
    mapTypeControl: true,
  });

  console.log("Google Maps inicializado");
}

/* =========================
   Zoho SDK
========================= */
function waitForZohoSDK(retries = 20) {
  if (window.ZOHO && ZOHO.CREATOR) {
    console.log("Zoho SDK disponível");
    ZOHO.CREATOR.init().then(loadAllData);
    return;
  }

  if (retries <= 0) {
    showError("Zoho Creator SDK não carregou.");
    return;
  }

  console.log("A aguardar Zoho SDK...");
  setTimeout(() => waitForZohoSDK(retries - 1), 500);
}

waitForZohoSDK();

/* =========================
   Load Data
========================= */
function loadAllData() {
  clearMarkers();
  document.getElementById("panel").innerHTML = "";

  ZOHO.CREATOR.API.getAllRecords({
    appName: "bionic-iii",
    reportName: "Lista_estacao",
    page: 1,
    pageSize: 200,
  })
    .then((res) => {
      allRecords = res.data || [];
      drawUI(allRecords);
    })
    .catch((err) => {
      console.error(err);
      showError("Erro ao carregar dados do Zoho Creator.");
    });
}

/* =========================
   UI
========================= */
function drawUI(records) {
  records.forEach((rec) => {
    const lat = parseFloat(rec.Latitude);
    const lng = parseFloat(rec.Longitude);

    if (!lat || !lng) return;

    const marker = new google.maps.Marker({
      map,
      position: { lat, lng },
    });

    const info = `
      <strong>${rec.Numero_estacao || ""}</strong><br/>
      Tipo: ${rec.Tipo_de_estacoes?.display_value || "-"}<br/>
      Local: ${rec.Local || "-"}
    `;

    const infowindow = new google.maps.InfoWindow({ content: info });
    marker.addListener("click", () => infowindow.open(map, marker));

    markers.push(marker);

    const item = document.createElement("div");
    item.className = "station-item";
    item.innerHTML = `
      <div class="station-title">${rec.Numero_estacao || ""}</div>
      <div class="station-meta">
        ${rec.Tipo_de_estacoes?.display_value || ""}
      </div>
    `;
    item.onclick = () => {
      map.panTo({ lat, lng });
      map.setZoom(16);
      infowindow.open(map, marker);
    };

    document.getElementById("panel").appendChild(item);
  });
}

/* =========================
   Helpers
========================= */
function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

function showError(msg) {
  const box = document.getElementById("errorBox");
  box.textContent = msg;
  box.style.display = "block";
}
