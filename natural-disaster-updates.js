function handleKeyPress(event) {
  if (event.key === "Enter") {
    const cityName = document.getElementById("search-box").value.trim();
    if (cityName) {
      localStorage.setItem("lastFetchedCity", cityName);
      window.location.href = "weather-forecasts.html";
    }
  }
}

document
  .getElementById("search-box")
  .addEventListener("keydown", handleKeyPress);

const nasaEndpoint = "http://localhost:3000/nasa";
let globalDisasterData = [];

// Function to fetch data from NASA API
async function fetchData() {
  try {
      // Fetch data from NASA API
      const nasaResponse = await fetch(nasaEndpoint);
      if (!nasaResponse.ok) throw new Error('Failed to fetch data from NASA API');
      const nasaData = await nasaResponse.json();

      // Loop through each event and perform reverse geocoding for the first three events
      const combinedData = await Promise.all(
          nasaData.events.map(async (event, index) => {
              let eventType = "Unknown"; // Default type
              if (event.title.toLowerCase().includes("wildfire")) {
                  eventType = "WF";
              } else if (event.title.toLowerCase().includes("tropical cyclone")) {
                  eventType = "TC";
              } else if (event.title.toLowerCase().includes("flood")) {
                  eventType = "FL";
              } else if (event.title.toLowerCase().includes("earthquake")) {
                  eventType = "EQ";
              }

              const match = event.title.match(/\b\d+\b$/);
              const event_Id = match ? parseInt(match[0], 10) : null;
              const coordinates = event.geometries?.[0]?.coordinates ?? "unknown";

              let place = "Unknown"; // Default place
              if (index < 1000 && coordinates !== "unknown") {
                  place = await get_place_name(coordinates[1], coordinates[0]);
              }

              return {
                  disasterType: event.categories?.[0]?.title || "Unknown",
                  eventDate: event.geometries?.[0]?.date ? event.geometries[0].date.split("T")[0] : "Unknown",
                  eventType,
                  event_Id,
                  description: event.title,
                  place
              };
          })
      );

      // Render the data
      globalDisasterData = combinedData;
      createFilterButtons();
      renderDisasters(combinedData);
  } catch (error) {
      console.error("Error fetching data:", error);
  }
}


function renderDisasters(data) {
  const container = document.getElementById("disaster-list");
  container.innerHTML = `
    <ul class="responsive-table">
      ${data
        .map(
          (item) => `
        <li class="table-row">
          <div class="col col-1" data-label="Disaster Type">${item.disasterType}</div>
          <div class="col col-2" data-label="Description">${item.description}</div>
          <div class="col col-3" data-label="Date">${item.eventDate}</div>
          <div class="col col-4" data-label="Date">${item.place}</div>
          <div class="col col-5" data-label="Details">
            <button><a href="https://www.gdacs.org/report.aspx?eventid=${item.event_Id}&eventtype=${item.eventType}" target="_blank">Know More</a></button>
          </div>
        </li>
      `)
        .join("")}
    </ul>
  `;

  // Hide .container and show .navbar
  document.querySelector(".container").style.display = "none";
  document.querySelectorAll(".navbar").forEach(navbar => {
    navbar.style.setProperty("display", "block", "important");
  });
  
  // Show body and app div
  document.body.style.display = "block";
  document.getElementById("app").style.display = "block";
}

function filterDisasters(type) {
  const filteredData = globalDisasterData.filter(item => item.disasterType === type);
  renderDisasters(filteredData);
}

// Function to dynamically create filter buttons
function createFilterButtons() {
  const filtersContainer = document.getElementById("filters");

  // Get unique disaster types from the global data
  const disasterTypes = [...new Set(globalDisasterData.map(item => item.disasterType))];

  // Clear any existing filter buttons
  filtersContainer.innerHTML = '';

  // Create and append a button for each disaster type
  disasterTypes.forEach(type => {
    const button = document.createElement("button");
    button.textContent = type;
    button.onclick = () => filterDisasters(type);
    filtersContainer.appendChild(button);
  });
}

async function get_place_name(lat, lng) {
  const apiKey = "";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status !== 'OK') throw new Error(`API error: ${data.status}`);
      return data.results[2]?.formatted_address || "Unknown location";
  } catch (error) {
      console.error('Error fetching place name:', error);
      return "Unknown location";
  }
}


fetchData();