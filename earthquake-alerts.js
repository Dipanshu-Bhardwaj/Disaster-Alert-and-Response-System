// Function to handle "Enter" key press
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

// Function to calculate distance between two lat/lng points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Function to fetch earthquake data and sort based on proximity to user location
async function fetchEarthquakeData() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/earthquakes?min_magnitude=4.0"
    );
    const data = await response.json();

    const tableBody = document.querySelector("#earthquake-table tbody");

    // Clear existing rows
    tableBody.innerHTML = "";

    if (data.error) {
      alert(data.error);
      return;
    }

    // Access the features array
    const earthquakes = data.features;

    // Check if the features array is empty
    if (earthquakes.length === 0) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML =
        "<td colspan='4'>No significant earthquakes found in the past 3 days.</td>";
      tableBody.appendChild(noDataRow);
      return;
    }

    // Get the user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          // Sort earthquakes by distance from user's location
          earthquakes.forEach((earthquake) => {
            const earthquakeLat = earthquake.geometry.coordinates[1];
            const earthquakeLon = earthquake.geometry.coordinates[0];
            earthquake.distance = calculateDistance(
              userLat,
              userLon,
              earthquakeLat,
              earthquakeLon
            );

            // Add marker for each earthquake on the map
            const marker = L.marker([earthquakeLat, earthquakeLon])
              .addTo(map)
              .bindPopup(
                `${earthquake.properties.place}<br>Magnitude: ${earthquake.properties.mag}`
              )
              .on("click", function () {
                // When a marker is clicked, zoom to its location on the map
                map.setView([earthquakeLat, earthquakeLon], 10);
              });
          });

          // Sort earthquakes by distance (ascending)
          earthquakes.sort((a, b) => a.distance - b.distance);

          // Limit to top 10 earthquakes
          const topEarthquakes = earthquakes.slice(0, 10);

          // Populate table with sorted data (top 10)
          topEarthquakes.forEach((earthquake) => {
            const row = document.createElement("tr");
            const location = earthquake.properties.place || "Unknown location";
            const magnitude = earthquake.properties.mag || "Unknown magnitude";
            const time = formatTime(earthquake.properties.time);
            const distance = earthquake.distance.toFixed(2); // Distance in km

            row.innerHTML = `
                        <td>${location}</td>
                        <td>${magnitude}</td>
                        <td>${time}</td>
                    `;
            tableBody.appendChild(row);

            // Add click event to each row to zoom in on the map
            row.addEventListener("click", function () {
              map.setView(
                [
                  earthquake.geometry.coordinates[1],
                  earthquake.geometry.coordinates[0],
                ],
                10
              );
            });
          });
        },
        function (error) {
          alert("Error getting location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }

    // Target the first element with the class "earthquake-data"
    const earthquakeDataElement = document.querySelector(".earthquake-data");
    if (earthquakeDataElement) {
      earthquakeDataElement.style.display = "block";
    }
    // Initialize Leaflet map
    const map = L.map("map").setView([0, 0], 2); // Start with a global view, zoom level 2

    // Add a tile layer to the map (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", ).addTo(map);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

// Function to format the time in "29 Dec, 6:48 PM" format
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

function showForm() {
    // Show the modal after 10 seconds
    setTimeout(() => {
        const modal = document.getElementById("user-form-modal");
        modal.style.display = "block"; // Show the modal
        const earthquake_data = document.querySelector(".earthquake-data")
        earthquake_data.style.display = "none";
        document.body.style.overflow = "hidden";
    }, 5000);

    // Close the modal when the user clicks the close button
    const closeButton = document.querySelector(".close-btn");
    closeButton.addEventListener("click", function () {
        const modal = document.getElementById("user-form-modal");
        const earthquake_data = document.querySelector(".earthquake-data")
        earthquake_data.style.display = "block";
        document.body.style.overflow = "visible";
        modal.style.display = "none"; // Hide the modal
    });

    // Close the modal when the user clicks outside of it
    window.addEventListener("click", function (event) {
        const modal = document.getElementById("user-form-modal");
        if (event.target === modal) {
          const earthquake_data = document.querySelector(".earthquake-data")
          earthquake_data.style.display = "block";
          document.body.style.overflow = "visible";
          modal.style.display = "none"; // Hide the modal
        }
    });

    // Handle form submission
    const form = document.getElementById("user-details-form");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        alert("Form submitted successfully!");
        const modal = document.getElementById("user-form-modal");
        const earthquake_data = document.querySelector(".earthquake-data")
        earthquake_data.style.display = "block";
        document.body.style.overflow = "visible";
        modal.style.display = "none"; // Hide the modal after submission
    });
};

document.addEventListener("DOMContentLoaded", function () {
    fetchEarthquakeData();
    showForm();
    const form = document.getElementById("user-details-form");
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Collect form data
        const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            contact_no: document.getElementById("contact").value,
            city: document.getElementById("city").value,
            country: document.getElementById("country").value
        };

        try {
            // Send data to FastAPI endpoint
            const response = await fetch("http://127.0.0.1:8000/save-user-details", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (response.ok) {
                // Hide the modal after successful submission
                document.getElementById("user-form-modal").style.display = "none";
            } else {
                alert("Error: " + result.detail);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("An error occurred while submitting the form.");
        }
    });
});
