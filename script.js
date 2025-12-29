/*************************************************
 * CONFIGURAÇÃO
 *************************************************/

const ACCESS_TOKEN = "COLOCA_AQUI_O_ACCESS_TOKEN"; // OAuth access token (1h)

const APP_OWNER = "moia.caboverde887";
const APP_NAME = "bionic-iii";

const REPORT_ESTACOES = "Lista_de_estacao";
const REPORT_MONIT = "Lista_monitorizacao_estacoes";

/*************************************************
 * MAPA
 *************************************************/

let map;
let markers = [];
let allStations = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.92, lng: -23.51 },
    zoom: 13,
  });

  loadData();
}

/*************************************************
 * API ZOHO CREATOR
 *************************************************/

async function fetchReport(reportName) {
  const url = `https://www.zohoapis.com/creator/v2/${APP_OWNER}/${APP_NAME}/report/${reportName}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Erro ao carregar ${reportName}`);
  }

  const json = await res.json();
  return json.data || [];
}

/*************************************************
 * CARREGAR DADOS
 *************************************************/

async function loadData() {
  try {
    showError("");

    const stations = await fetchReport(REPORT_ESTACOES);
    const visits = await fetchReport(REPORT_MONIT);

    allStations = normalizeData(stations, visits);

    drawStations(allStations);
    drawMarkers(allStations);
    fillFilters(allStations);

  } catch (err) {
    showError(err.message);
    console.error(err);
  }
}

/*************************************************
 * NORMALIZAÇÃO
 *************************************************/

function normalizeData(stations, visits) {
  return stations.map(st => {
    const stationVisits = visits.filter(v =>
      v.Linha_estacoes?.some(l => l.ID === st.ID)
    );

    stationVisits.sort((a, b) =>
      new Date(b.Inicio) - new Date(a.Inicio)
    );

    const lastVisit = stationVisits[0];

    return {
      id: st.ID,
      numero: st.Numero_estacao,
      tipo: st.Tipo_de_estacoes?.display_value || "-",
      lat: parseFloat(st.Latitude),
      lng: parseFloat(st.Longitude),
      local: st.Local || "-",
      estado: lastVisit?.Estado_da_estacao?.parent?.display_value || "Sem inspeção",
      ultimaInspecao: lastVisit ? lastVisit.Inicio.split(" ")[0] : "-",
    };
  });
}

/*************************************************
 * UI
 *************************************************/

function drawStations(list) {
  const container = document.getElementById("stationList");
  container.innerHTML = "";

  list.forEach(st => {
    const div = document.createElement("div");
    div.className = "station";
    div.innerHTML = `
      <div class="station-title">${st.numero} — ${st.tipo}</div>
      <div class="station-meta">${st.estado}</div>
    `;

    div.onclick = () => {
      map.setCenter({ lat: st.lat, lng: st.lng });
      map.setZoom(16);
    };

    container.appendChild(div);
  });
}

function drawMarkers(list) {
  markers.forEach(m => m.setMap(null));
  markers = [];

  list.forEach(st => {
    if (isNaN(st.lat) || isNaN(st.lng)) return;

    const marker = new google.maps.Marker({
      position: { lat: st.lat, lng: st.lng },
      map,
    });

    const info = new google.maps.InfoWindow({
      content: `
        <strong>${st.tipo}</strong><br/>
        Estado: ${st.estado}<br/>
        Última inspeção: ${st.ultimaInspecao}<br/>
        Local: ${st.local}
      `,
    });

    marker.addListener("click", () => info.open(map, marker));
    markers.push(marker);
  });
}

function fillFilters(list) {
  const tipos = [...new Set(list.map(s => s.tipo))];
  const estados = [...new Set(list.map(s => s.estado))];

  fillSelect("tipoFilter", tipos);
  fillSelect("estadoFilter", estados);
}

function fillSelect(id, values) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">Todos</option>`;
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  });
}

/*************************************************
 * ERROS
 *************************************************/

function showError(msg) {
  const box = document.getElementById("errorBox");
  if (!msg) {
    box.style.display = "none";
  } else {
    box.textContent = msg;
    box.style.display = "block";
  }
}

