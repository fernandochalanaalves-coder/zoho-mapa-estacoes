let map;

function initMap() {
  console.log("Google Maps inicializado");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.9167, lng: -23.5167 }, // Praia
    zoom: 11,
    mapTypeId: "roadmap"
  });

  // Exemplo de marcador fixo (teste)
  new google.maps.Marker({
    position: { lat: 14.9167, lng: -23.5167 },
    map,
    title: "Praia - Teste"
  });
}
