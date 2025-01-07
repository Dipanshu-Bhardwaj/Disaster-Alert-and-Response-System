let map;
let weatherChart;
const weatherBackgrounds = {
  Clear: "assets/sunny.jpg",
  Clouds: "assets/cloudy.jpg",
  Rain: "assets/rainy.jpg",
  Snow: "assets/snowy.jpg",
  Thunderstorm: "assets/thunderstorm.jpg",
  Drizzle: "assets/drizzle.jpg",
  Mist: "assets/mist.jpg",
  Fog: "assets/fog.jpg",
  Haze: "assets/haze.jpg",
  Night: "assets/clear-night.jpg",
};

var unit = "C";

function changeUnit() {
  if (unit == "C") {
    unit = "F";
    let city = localStorage.getItem("lastFetchedCity");
    fetchCityCoordinates(city);
  } else {
    unit = "C";
    let city = localStorage.getItem("lastFetchedCity");
    fetchCityCoordinates(city);
  }
}

function getWeatherInfo(latitude, longitude) {
  const suggestionBox = document.getElementById("suggestion-box");
  suggestionBox.style.display = "none"; // Hide the suggestion box

  let requestBody = {
    latitude,
    longitude,
  };

  // If unit is 'c', add unit information to the body
  if (unit === "C") {
    requestBody.unit = "metric"; // Metric for Celsius
  } else if (unit === "F") {
    requestBody.unit = "imperial"; // Imperial for Fahrenheit
  }

  // Send the latitude and longitude to your API for weather information
  fetch("http://127.0.0.1:5000/api/location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => response.json())
    .then((data) => {
      // Check the current page location
      const currentPage = window.location.pathname;

      if (currentPage.includes("location.html")) {
        displayWeatherData(data);
      } else if (currentPage.includes("weather-forecasts.html")) {
        displayForecastData(data);
      }
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

// Function to handle forecast data for location.html
function displayWeatherData(data) {
  const latitude = data.coord.lat;
  const longitude = data.coord.lon;
  const temperatureCelsius = data.main.temp.toFixed(0);
  const feelsLikeCelsius = data.main.feels_like.toFixed(0);
  const weatherDescription = data.weather[0].description;
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;

  // Convert sunrise and sunset timestamps to human-readable time
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "numeric",
      hour12: true, // Ensures 12-hour format with AM/PM
    }
  );

  const sunset = new Date(data.sys.sunrise * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true, // Ensures 12-hour format with AM/PM
  });

  document.getElementById("city-name").textContent =
    data.name + ", " + data.sys.country;
  document.getElementById("temp").textContent = temperatureCelsius;
  document.getElementById("feels-like").textContent = feelsLikeCelsius;
  document.getElementById("weather-description").textContent =
    weatherDescription;
  document.getElementById("humidity").textContent = humidity;
  document.getElementById("wind-speed").textContent = windSpeed;
  document.getElementById("pressure").textContent = data.main.pressure;
  document.getElementById("sunrise-time").textContent = sunrise;
  document.getElementById("sunset-time").textContent = sunset;

  // Show the first box after receiving weather data
  document.querySelector(".first-box").style.display = "block";

  // setting the city name in local Storage
  localStorage.setItem("lastFetchedCity", data.name);

  // Fade in the inner-box
  const cover_fade = document.querySelector("#cover");
  cover_fade.style.transform = "translate3d(0, 535px, 0)";

  const features = document.querySelector("#features");
  features.style.transform = "translate3d(0, 535px, 0)";
  features.style.marginTop = "0";

  const tagline_clone = document.querySelector("#tagline_clone");
  tagline_clone.style.marginTop = "575px";
  tagline_clone.style.marginBottom = "-575px";

  const extra_features = document.querySelector(".extra-features");
  extra_features.style.marginTop = "575px";

  // Create and display the weather map
  createWeatherMap(latitude, longitude);

  // Set background based on weather conditions
  const weatherCondition = data.weather[0].main; // Example: "Clear", "Clouds", "Rain"
  const isNight = new Date().getHours() > 18 || new Date().getHours() < 6; // Simple night-time check
  updateWeatherBackground(weatherCondition, isNight);
}

// Function to handle forecast data for weather-forecasts.html
function displayForecastData(data) {
  const latitude = data.coord.lat;
  const longitude = data.coord.lon;
  const weatherDescription = data.weather[0].description;
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;
  const pressure = data.main.pressure;
  const visibility = data.visibility;
  const temperature = data.main.temp.toFixed(0);
  const feelsLike = data.main.feels_like.toFixed(0);
  const dewPoint = temperature - (100 - humidity) / 5;

  const weatherDate = new Date(data.dt * 1000);
  const options = {
    month: "short", // Abbreviated month name (e.g., Dec)
    day: "numeric", // Numeric day (e.g., 28)
    hour: "numeric", // Hour with AM/PM
    minute: "numeric", // Minutes
    hour12: true, // Use 12-hour clock
  };

  // Format the date and time
  const dateTime = new Intl.DateTimeFormat("en-US", options).format(
    weatherDate
  );

  // Convert sunrise and sunset timestamps to human-readable time
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();

  localStorage.setItem("lastFetchedCity", data.name);

  document.getElementById("city-name").textContent =
    data.name + ", " + data.sys.country;
  document.getElementById("temp").textContent = temperature + "°" + unit;
  document.getElementById("feels-like").textContent =
    "Feels Like: " + feelsLike + "°" + unit;
  document.getElementById("weather-description").textContent =
    weatherDescription;
  document.getElementById("date-time").textContent = dateTime;
  document.getElementById("dew-point").textContent =
    "Dew point : " + dewPoint.toFixed(0) + "°" + unit;
  document.getElementById("visibility").textContent =
    "Visibility : " + visibility / 1000 + " km";
  document.getElementById("humidity").textContent =
    "Humidity : " + humidity + "%";
  document.getElementById("wind-speed").textContent = windSpeed + " m/s SSW";
  document.getElementById("pressure").textContent = pressure + " hPa";
  createWeatherMap(latitude, longitude);
  fetchWeatherForecast(latitude, longitude);
  // Fetch and render the data
  fetchWeatherData(latitude, longitude);
}

// Trigger function on button click or when geolocation is used
const currentPage = window.location.pathname;
if (currentPage.includes("location.html")) {
  document.getElementById("get-location-btn").onclick = function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          // Call the function with the current latitude and longitude
          getWeatherInfo(latitude, longitude);
        },
        function (error) {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };
} else if (currentPage.includes("weather-forecasts.html")) {
  document.getElementById("get-location-btn").onclick = function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          // Call the function with the current latitude and longitude
          getWeatherInfo(latitude, longitude);
        },
        function (error) {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  document.getElementById("get-location-btn-2").onclick = function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          // Call the function with the current latitude and longitude
          getWeatherInfo(latitude, longitude);
        },
        function (error) {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };
}

// Show the suggestion box when the user focuses on the search box
function showSuggestion() {
  const suggestionBox = document.getElementById("suggestion-box");
  suggestionBox.style.display = "block"; // Show the suggestion box
}

// Close the suggestion box if clicked outside of the search or suggestion box
document.addEventListener("click", (event) => {
  const suggestionBox = document.getElementById("suggestion-box");
  const searchBox = document.getElementById("search-box");

  if (
    !searchBox.contains(event.target) &&
    !suggestionBox.contains(event.target)
  ) {
    suggestionBox.style.display = "none";
  }
});

// Updated createWeatherMap function
function createWeatherMap(latitude, longitude) {
  const currentPage = window.location.pathname;

  if (currentPage.includes("location.html")) {
    document.querySelector(".inner-box").style.display = "block";
    document.querySelector("#cover").style.zIndex = "0";
  } else if (currentPage.includes("weather-forecasts.html")) {
    document.querySelector(".forecast").style.display = "block";
    document.querySelector(".extended-forecast").style.display = "block";
  }

  // Check if map already exists
  if (!map) {
    // Create the map if it doesn't exist
    map = L.map("map").setView([latitude, longitude], 10);

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    // OpenWeatherMap API key
    const apiKey = ""; // Replace with your OpenWeatherMap API key

    // Layers (Precipitation, Clouds, Pressure, Temperature, Wind)
    const precipitationLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      }
    );
    const cloudsLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      }
    );
    const pressureLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      }
    );
    const temperatureLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      }
    );
    const windLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      }
    );

    // Add a control to toggle between layers
    const overlays = {
      Precipitation: precipitationLayer,
      Clouds: cloudsLayer,
      Pressure: pressureLayer,
      Temperature: temperatureLayer,
      Wind: windLayer,
    };
    L.control.layers(null, overlays).addTo(map);

    // Set the initial layer to be displayed (Temperature layer)
    precipitationLayer.addTo(map);
  } else {
    // If map already exists, just update its view to the new coordinates
    map.setView([latitude, longitude], 10);
  }
}

// Function to handle "Enter" key press
function handleKeyPress(event) {
  if (event.key === "Enter") {
    const cityName = document.getElementById("search-box").value.trim();
    if (cityName) {
      fetchCityCoordinates(cityName);
    }
  }
}

function handleKeyPress_2(event) {
  if (event.key === "Enter") {
    const cityName = document.querySelector(".search-box-new").value.trim();
    if (cityName) {
      fetchCityCoordinates(cityName);
    }
  }
}

function clicked_search() {
  const cityName = document.querySelector(".search-box-new").value.trim();
  if (cityName) {
    fetchCityCoordinates(cityName);
  }
}
// Function to fetch city coordinates
function fetchCityCoordinates(cityName) {
  // OpenWeatherMap API key
  var apiKey = ""; // Replace with your OpenWeatherMap API key

  const geoApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    cityName
  )}&limit=1&appid=${apiKey}`;

  fetch(geoApiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        const cityData = data[0];
        const latitude = cityData.lat;
        const longitude = cityData.lon;
        getWeatherInfo(latitude, longitude);
      } else {
        fetchCityCoordinates("Delhi");
      }
    })
    .catch((error) => {
      console.error("Error fetching city coordinates:", error);
      alert(
        "Failed to fetch city coordinates. Please check your network or API key."
      );
    });
  localStorage.setItem("lastFetchedCity", cityName);
}

function updateWeatherBackground(weatherCondition, isNight = false) {
  const bodyElement = document.getElementById("cover");
  const tagline = document.getElementById("tagline");
  const features = document.getElementById("features");
  tagline.style.color = "white";
  features.style.marginTop = "5%";

  // Check for night-specific backgrounds
  if (isNight && weatherCondition === "Clear") {
    weatherCondition = "Night";
  }

  // Get the background image based on the weather condition
  const backgroundImage =
    weatherBackgrounds[weatherCondition] || "assets/sunny.jpg";

  // Update the background
  bodyElement.style.backgroundImage = `url(${backgroundImage})`;
  bodyElement.style.backgroundSize = "cover";
  bodyElement.style.backgroundPosition = "center";
}

// Add event listener for "Enter" key press
document
  .getElementById("search-box")
  .addEventListener("keydown", handleKeyPress);

// Show suggestions on focus
document.getElementById("search-box").addEventListener("focus", showSuggestion);

// weather-forecasts toggle button
const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const highlight = document.querySelector(".highlight");

function moveHighlightTo(button) {
  const buttonRect = button.getBoundingClientRect();
  const containerRect = button.parentElement.getBoundingClientRect();
  const offsetLeft = buttonRect.left - containerRect.left;

  highlight.style.transform = `translateX(${offsetLeft}px)`;
  button1.classList.remove("active");
  button2.classList.remove("active");
  button.classList.add("active");
}

if (currentPage.includes("weather-forecasts.html")) {
  // Add event listeners to toggle highlight
  button1.addEventListener("click", () => moveHighlightTo(button1));
  button2.addEventListener("click", () => moveHighlightTo(button2));
  // Initialize highlight position
  moveHighlightTo(button1);
}

if (window.location.pathname.endsWith("weather-forecasts.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    let city = localStorage.getItem("lastFetchedCity");

    if (!city) {
      city = "Delhi";
      localStorage.setItem("lastFetchedCity", city);
    }

    fetchCityCoordinates(city);
  });
}

// Function to fetch 8-day weather forecast
function fetchWeatherForecast(lat, lon) {
  var myUnit;
  const apiKey = ""; // Use your provided API key
  if (unit === "C") {
    myUnit = "metric";
  } else if (unit === "F") {
    myUnit = "imperial";
  }
  const url = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=8&units=${myUnit}&appid=${apiKey}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const dailyForecast = data.list; // `list` contains daily forecasts

      let forecastHTML = "";
      dailyForecast.forEach((day) => {
        const weatherDate = new Date(day.dt * 1000);

        // Define the options for the date format: Day of the week, Month, Day
        const options = { weekday: "short", month: "short", day: "numeric" };
        const dateTime = new Intl.DateTimeFormat("en-US", options).format(
          weatherDate
        );

        // Round and format temperatures for display
        const tempMax = Math.round(day.temp.max);
        const tempMin = Math.round(day.temp.min);
        const weatherDescription = day.weather[0].description;
        const icon = `http://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

        // Format the temperature as "Max/Min"
        const tempFormatted = `${tempMax}/${tempMin}°` + unit;

        // Detailed information for expandable section
        const windSpeed = day.speed;
        const pressure = day.pressure;
        const humidity = day.humidity;
        const dewPoint = tempMax - (100 - humidity) / 5;
        const sunrise = new Date(day.sunrise * 1000).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "numeric",
            hour12: true, // Ensures 12-hour format with AM/PM
          }
        );

        const sunset = new Date(day.sunset * 1000).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true, // Ensures 12-hour format with AM/PM
        });

        forecastHTML += `
                    <div class="forecast-day">
                        <div class="forecast-summary">
                            <p class="dateTimeforcast">${dateTime}</p>
                            <img src="${icon}" alt="${weatherDescription}" class="icon">
                            <p class="tempFormat">${tempFormatted}</p>
                            <p class="desc">${weatherDescription}</p>

                            <!-- Expandable Button -->
                            <span class="expand-toggle">&#9660;</span>
                        </div>

                        <!-- Expandable Content (hidden by default) -->
                        <div class="expandable-content">
                            <p><strong>Summary:</strong> Few clouds. Gentle Breeze.</p>
                            <p><strong>The high will be:</strong> ${tempMax}°${unit}, <strong>the low will be:</strong> ${tempMin}°${unit}</p>
                            <p><strong>Wind Speed:</strong> ${windSpeed} m/s, <strong>Pressure:</strong> ${pressure} hPa</p>
                            <p><strong>Humidity:</strong> ${humidity}%</p>
                            <p><strong>Dew Point:</strong> ${dewPoint}°${unit}</p>
                            <p><strong>Sunrise:</strong> ${sunrise}</p>
                            <p><strong>Sunset:</strong> ${sunset}</p>

                            <p><strong>Temperature Forecast:</strong></p>
                            <table>
                                <tr><th>Morning</th><th>Afternoon</th><th>Evening</th><th>Night</th></tr>
                                <tr>
                                    <td>${Math.round(
                                      day.temp.morn
                                    )}°${unit}</td>
                                    <td>${Math.round(day.temp.day)}°${unit}</td>
                                    <td>${Math.round(day.temp.eve)}°${unit}</td>
                                    <td>${Math.round(
                                      day.temp.night
                                    )}°${unit}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                `;
      });

      // Append the forecast HTML to the forecast container
      document.getElementById("forecast-container").innerHTML = forecastHTML;
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

if (currentPage.includes("weather-forecasts.html")) {
  document.body.addEventListener("click", function (event) {
    // Check if the clicked element or any of its ancestors is a '.forecast-summary'
    const summary = event.target.closest(".forecast-summary");

    if (summary) {
      const expandableContent = summary.nextElementSibling;
      const expandToggle = summary.querySelector(".expand-toggle");

      // Check if the clicked item is already expanded
      const isExpanded = expandableContent.classList.contains("show");

      // Hide all forecast-summary elements except the clicked one
      const allSummaries = document.querySelectorAll(".forecast-summary");
      allSummaries.forEach((content) => {
        if (content !== summary) {
          content.classList.add("hidden"); // Add hidden class to hide elements
        }
      });

      if (isExpanded) {
        // If the clicked item is already expanded, show all elements again
        allSummaries.forEach((content) => {
          content.classList.remove("hidden"); // Remove hidden class to show elements
        });

        // Also hide the expandable content and reset the toggle
        expandableContent.classList.remove("show");
        expandToggle.classList.remove("rotated");
      } else {
        // Otherwise, toggle the expandable content visibility for the clicked item
        expandableContent.classList.toggle("show");
        expandToggle.classList.toggle("rotated");
      }
    }
  });
}

async function fetchWeatherData(latitude, longitude) {
  var myUnit;
  if (unit === "C") {
    myUnit = "metric";
  } else if (unit === "F") {
    myUnit = "imperial";
  }
  const API_KEY = "";
  if (unit === "C") {
    myUnit = "metric";
  } else if (unit === "F") {
    myUnit = "imperial";
  }
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${myUnit}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Filter data for the next 2 days
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const filteredData = data.list.filter((item) => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate >= oneHourAgo && itemDate <= twoDaysLater;
    });

    // Extract data for the graph
    const labels = filteredData.map((item, index) => {
      const dateOptions = { month: "short", day: "numeric" }; // Format for date (e.g., "Dec 30")
      const timeOptions = { hour: "2-digit" }; // Format for time (e.g., "12 AM")
      const dateTime = new Date(item.dt * 1000);

      // Check if the time is midnight
      if (dateTime.getHours() === 2) {
        // Replace "12 AM" with the corresponding date
        return new Intl.DateTimeFormat("en-US", dateOptions).format(dateTime);
      }

      // Otherwise, return the formatted time
      return new Intl.DateTimeFormat("en-US", timeOptions).format(dateTime);
    });

    const temperatures = filteredData.map((item) => item.main.temp);
    const windSpeeds = filteredData.map((item) => item.wind.speed);
    const precipitation = filteredData.map((item) => item.pop || 0); // Probability of precipitation
    const weatherDescriptions = filteredData.map(
      (item) => item.weather[0].description
    );

    // Render the graph
    plotGraph(
      labels,
      temperatures,
      windSpeeds,
      precipitation,
      weatherDescriptions
    );
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

const yAxisConfig = () => {
  if (unit === "C") {
    return {
      min: 8, // Minimum value for Celsius
      max: 35, // Maximum value for Celsius
      ticks: {
        stepSize: 5, // Step size for Celsius
        callback: function (value) {
          if (value < 10 || value > 30) {
            return "";
          }
          return `${value}°C`; // Append °C to displayed values
        },
        font: {
          size: 12,
        },
        color: "#eb6e4b",
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    };
  } else if (unit === "F") {
    return {
      min: 46, // Minimum value for Fahrenheit
      max: 95, // Maximum value for Fahrenheit
      ticks: {
        stepSize: 10, // Step size for Fahrenheit
        callback: function (value) {
          if (value < 50 || value > 90) {
            return "";
          }
          return `${value}°F`; // Append °F to displayed values
        },
        font: {
          size: 12,
        },
        color: "#eb6e4b",
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    };
  }
};

function plotGraph(
  labels,
  temperatures,
  windSpeeds,
  precipitation,
  descriptions
) {
  const ctx = document.getElementById("weatherChart").getContext("2d");

  if (!weatherChart) {
    weatherChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels, // Time labels
        datasets: [
          {
            label: "", // Empty label to hide legend
            data: temperatures,
            borderColor: "#eb6e4b",
            fill: false,
            tension: 0.4, // Smoothing the line
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false, // Hide the legend
          },
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                const index = context.dataIndex;
                return `Condition: ${descriptions[index]}`;
              },
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            position: "top", // Place labels at the top
            grid: {
              drawBorder: false, // Remove the border below the labels
              display: false, // Hide vertical gridlines
            },
            ticks: {
              font: {
                size: 12,
              },
              padding: 10, // Adds space to the right of the ticks
            },
            offset: true, // Shift ticks to the right
          },
          y: yAxisConfig(),
        },
        layout: {
          padding: {
            top: 20, // Extra space for top labels
            bottom: 70, // Extra space for wind speed text and horizontal line
          },
        },
        elements: {
          point: {
            radius: 0, // Remove dots from the graph
          },
          line: {
            borderWidth: 2, // Line thickness
          },
        },
      },
      plugins: [
        {
          id: "windSpeedText",
          afterDraw: function (chart) {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const chartAreaBottom = chart.chartArea.bottom; // Bottom of the chart area
            const yPosition = chartAreaBottom + 40; // Position for wind speed text
            const lineYPosition = yPosition - 35; // Position for the horizontal line
            const descriptionYPosition = yPosition - 20; // Position for the description text (above wind speed)

            // Draw the horizontal line above the wind speed text
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, lineYPosition); // Start the line just above the wind speed text
            ctx.lineTo(chart.chartArea.right, lineYPosition); // End the line at the right side of the chart
            ctx.strokeStyle = "rgba(128, 128, 128, 0.2)"; // Grey line with 0.5 opacity
            ctx.lineWidth = 1; // Line thickness
            ctx.stroke();
            ctx.restore();

            // Draw the descriptions above the wind speed text
            ctx.save();
            ctx.font = "10px Arial";
            ctx.fillStyle = "#333"; // Text color
            ctx.textAlign = "center";

            // Loop through each tick on the x-axis to place description text
            xAxis.ticks.forEach((tick, index) => {
              const x = xAxis.getPixelForTick(index); // Get the x-coordinate for each tick
              const descriptionText = descriptions[index] || ""; // Get description for the label
              ctx.fillText(descriptionText, x, descriptionYPosition); // Draw the description text above the wind speed
            });

            ctx.restore();

            // Draw the wind speed text
            ctx.save();
            ctx.font = "10px Arial";
            ctx.fillStyle = "#333"; // Text color
            ctx.textAlign = "center";

            // Loop through each tick on the x-axis to place wind speed text
            xAxis.ticks.forEach((tick, index) => {
              const x = xAxis.getPixelForTick(index); // Get the x-coordinate for each tick
              const windSpeedText = `${windSpeeds[index]} m/s`; // Get wind speed for the label
              ctx.fillText(windSpeedText, x, yPosition); // Draw the text below the graph
            });

            ctx.restore();
          },
        },
      ],
    });
  } else {
    // Update the existing chart
    weatherChart.data.labels = labels;
    weatherChart.data.datasets[0].data = temperatures;
    weatherChart.options.scales.y = yAxisConfig();
    weatherChart.update();
  }
}

// chatbot
const header = document.getElementById("chat-header");
const chatBox = document.getElementById("chat-box");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");

function bot_clicked() {
  chatBox.style.display = chatBox.style.display === "none" ? "block" : "none";
};

if (currentPage.includes("location.html")) {
  sendButton.addEventListener("click", async () => {
    const userMessage = chatInput.value;
    if (!userMessage.trim()) return;

    // Append user message to chat
    chatMessages.innerHTML += `<div style="margin: 5px 0; text-align: right;"><strong>You:</strong> ${userMessage}</div>`;
    chatInput.value = "";

    // Fetch bot response
    try {
      const response = await fetch("http://127.0.0.1:8000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: userMessage }),
      });
      const data = await response.json();
      const botMessage = data.reply;

      // Append bot message to chat
      chatMessages.innerHTML += `<div style="margin: 5px; text-align: justify;padding: 0 10px 0 0;"><img src="./logo.png" class="logo_bot"><pre style="white-space: pre-wrap;">${botMessage}</pre></div>`;
      chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    } catch (error) {
      chatMessages.innerHTML += `<div style="margin: 5px 0; text-align: left; color: red;"><strong>Error:</strong> Could not fetch reply.</div>`;
    }
  });
}

async function startchat() {
  const userMessage = "hi";

  try {
    const response = await fetch("http://127.0.0.1:8000/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: userMessage }),
    });
    const data = await response.json();
    const botMessage = data.reply;

    // Append bot message to chat
    chatMessages.innerHTML += `<div style="margin: 5px; text-align: justify;padding: 0 10px 0 0;"><img src="./logo.png" class="logo_bot"><pre style="white-space: pre-wrap;">${botMessage}</pre></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
  } catch (error) {
    chatMessages.innerHTML += `<div style="margin: 5px 0; text-align: left; color: red;"><strong>Error:</strong> Could not fetch reply.</div>`;
  }
};

if (currentPage.includes("location.html")) {
  setTimeout(() => {
    bot_clicked()
    startchat()
  }, 5000);
}
