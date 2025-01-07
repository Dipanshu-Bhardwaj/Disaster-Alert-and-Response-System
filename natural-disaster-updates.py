from flask import Flask, jsonify, request
import requests
from requests_oauthlib import OAuth1
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/nasa', methods=['GET'])
def get_nasa_data():
    url = "https://eonet.gsfc.nasa.gov/api/v2.1/events?limit=1000"
    try:
        # Make the request to the NASA API
        response = requests.get(url, verify=False)
        response.raise_for_status()  # Raise an error for 4xx or 5xx responses
        
        # Parse JSON response
        try:
            data = response.json()
            return jsonify(data)  # Return JSON data to the client
        except ValueError:
            return jsonify({"error": "Non-JSON response from NASA API"}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=3000, debug=True)
