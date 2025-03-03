// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
});

// OPTIONAL: Step 2 - Create the 'street' tile layer as a second background of the map.
let street = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors, Humanitarian OpenStreetMap Team"
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [20, 0],
  zoom: 2,
  layers: [basemap] // Default layer
});

// Then add the 'basemap' tile layer to the map.
basemap.addTo(map);

// Create layer groups for earthquakes and tectonic plates
let earthquakes = new L.LayerGroup();
let tectonicPlates = new L.LayerGroup();

// Define baseMaps and overlays for the layer control
let baseMaps = {
  "Basemap": basemap,
  "Street": street
};

let overlays = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": tectonicPlates
};

// Add a control to the map that will allow the user to change which layers are visible.
L.control.layers(baseMaps, overlays).addTo(map);

// Make a request that retrieves the earthquake geoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

  // Function to return style data for each earthquake
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 0.8,
      fillColor: getColor(feature.geometry.coordinates[2]), // Depth
      color: "#000",
      radius: getRadius(feature.properties.mag),
      stroke: true,
      weight: 0.5
    };
  }

  // Function to determine color based on depth
  function getColor(depth) {
    return depth > 90 ? "#ff0000" :
           depth > 70 ? "#ff6600" :
           depth > 50 ? "#ffcc00" :
           depth > 30 ? "#ccff33" :
           depth > 10 ? "#66ff66" :
                        "#00ff00";
  }

  // Function to determine radius based on magnitude
  function getRadius(magnitude) {
    return magnitude === 0 ? 1 : magnitude * 4;
  }

  // Add a GeoJSON layer for earthquakes
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: styleInfo,
    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        `<h3>Magnitude: ${feature.properties.mag}</h3>
        <h3>Depth: ${feature.geometry.coordinates[2]} km</h3>
        <hr><p>${feature.properties.place}</p>`
      );
    }
  }).addTo(earthquakes);

  earthquakes.addTo(map);

  // Create a legend control object.
  let legend = L.control({ position: "bottomright" });

  // Add details to the legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend"),
        depthLevels = [-10, 10, 30, 50, 70, 90],
        colors = ["#00ff00", "#66ff66", "#ccff33", "#ffcc00", "#ff6600", "#ff0000"];

    div.innerHTML += "<h4>Depth (km)</h4>";

    for (let i = 0; i < depthLevels.length; i++) {
      div.innerHTML +=
        '<i style="background:' + colors[i] + '"></i> ' +
        depthLevels[i] + (depthLevels[i + 1] ? "&ndash;" + depthLevels[i + 1] + "<br>" : "+");
    }
    return div;
  };

  // Finally, add the legend to the map.
  legend.addTo(map);

  // OPTIONAL: Step 2 - Load Tectonic Plate GeoJSON data
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
    .then(function (plate_data) {
      L.geoJson(plate_data, {
        color: "#ff5733",
        weight: 2
      }).addTo(tectonicPlates);

      tectonicPlates.addTo(map);
    });
});
