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

function backtohome(){
    window.location.href = "location.html";
}