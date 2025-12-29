let map;
let markers = [];
let allRecords = [];

function showError(msg) {
  const box = document.getElementById("errorBox");
  box.style.display = "block";
  box.textContent = msg;
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.916, lng: -23.509 },
    zoom: 13,
    mapTypeId: "roadmap",
  });

  console.log("Google Maps inicializado");
}

function reloadData() {
  if (!window.ZOHO) {
    showError("Zoho SDK ainda não disponível.");
    return;
  }

  loadStations();
}

function loadStations() {
  ZOHO.CREATOR.API.getAllRecords({
    appName: "bionic-iii",
    reportName: "Lista_de_estacao",
    page: 1,
    pageSize: 200,
  })
    .then((res) => {
      allRecords = res.data || [];
      drawUI();
    })
    .catch((err) => {
      console.error(err);
      showError("Erro ao carregar estações.");
    });
}

function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

function drawUI() {
  clearMarkers();

  const panel = document.getElementById("panel");
  panel.innerHTML = "";

  allRecords.forEach((rec) => {
    if (!rec.Latitude || !rec.Longitude) return;

    const lat = parseFloat(rec.Latitude);
    const lng = parseFloat(rec.Longitude);

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
    });

    const info = new google.maps.InfoWindow({
      content: `
        <strong>${rec.Numero_estacao}</strong><br/>
        Tipo: ${rec.Tipo_de_estacoes?.display_value || "-"}<br/>
        Local: ${rec.Local || "-"}
      `,
    });

    marker.addListener("click", () => {
      info.open(map, marker);
    });

    markers.push(marker);

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <strong>${rec.Numero_estacao}</strong><br/>
      ${rec.Tipo_de_estacoes?.display_value || ""}
    `;
    div.onclick = () => {
      map.setCenter({ lat, lng });
      map.setZoom(17);
      info.open(map, marker);
    };

    panel.appendChild(div);
  });
}

/* ===== ZOHO EMBEDDED APP ===== */

ZOHO.embeddedApp.on("PageLoad", function () {
  console.log("Zoho Embedded App carregada");
  reloadData();
});

ZOHO.embeddedApp.init();
