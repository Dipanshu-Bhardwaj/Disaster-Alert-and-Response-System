from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
 
app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

api_key = ''  # Replace with your actual API key

# Function to make API call to OpenWeatherMap and return weather data
def get_weather_data(lat, lon , unit):
    # Construct the API URL with the latitude, longitude, and API key
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units={unit}&appid={api_key}"

    # Make the GET request to the OpenWeatherMap API
    response = requests.get(url,verify=False)

    # Check if the response status is OK (200)
    if response.status_code == 200:
        # Return the JSON data received from OpenWeatherMap
        return response.json()
    else:
        return {'status': 'error', 'message': 'Unable to fetch weather data'}
    

@app.route('/api/location', methods=['POST'])
def get_location():
    try:
        # Get JSON data from the request
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data received'}), 400

        latitude = data.get('latitude')
        longitude = data.get('longitude')
        unit = data.get('unit')

        # Check if both latitude and longitude are present
        if not latitude or not longitude:
            return jsonify({'status': 'error', 'message': 'Missing latitude or longitude'}), 400

        # Fetch the weather data using the provided latitude and longitude
        weather_data = get_weather_data(latitude, longitude, unit)

        return jsonify(weather_data)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
