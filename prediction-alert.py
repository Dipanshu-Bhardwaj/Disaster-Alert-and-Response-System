import pandas as pd
import joblib
import requests
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.text import MIMEText
import httpx
import asyncio
from databases import Database

# Load the trained model
MODEL_PATH = "earthquake_model.pkl"
model, features = joblib.load(MODEL_PATH)

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = ""
EMAIL_PASSWORD = ""

DATABASE_URL = ""
database = Database(DATABASE_URL)

async def get_place_name(lat, lng):
    lat = float(lat)
    lng = float(lng)
    api_key = ""
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()  # Raise an exception for HTTP errors
            data = response.json()
            results = data.get('results', [])
            for result in results:
                if 'formatted_address' in result:
                    return result['formatted_address']
            
    except Exception as error:
        print(f"Error fetching place name: {error}")
        return "Unknown location"

def fetch_live_data():
    """Fetch live earthquake data from the USGS API."""
    BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    now_utc = datetime.now(timezone.utc)
    start_time = (now_utc - timedelta(days=2)).isoformat()
    end_time = now_utc.isoformat()
    params = {"format": "geojson", "starttime": start_time, "endtime": end_time, "minmagnitude": 2.0, "limit": 500}
    
    response = requests.get(BASE_URL, params=params,verify=False)
    if response.status_code == 200:
        data = response.json()
        earthquakes = []
        for feature in data['features']:
            properties = feature['properties']
            geometry = feature['geometry']['coordinates']
            event_time = datetime.fromtimestamp(properties['time'] / 1000, tz=timezone.utc)
            earthquakes.append({
                "Latitude": geometry[1],
                "Longitude": geometry[0],
                "Depth": geometry[2],
                "Magnitude": properties['mag'],
                "Year": int(event_time.year),
                "Month": int(event_time.month),
                "Day": int(event_time.day),
                "Hour": int(event_time.hour)
            })
        df = pd.DataFrame(earthquakes)
        print("Fetched live data:\n", df.head())  # Debugging: Print the data
        return df
    else:
        print(f"Error fetching live data: {response.status_code}, {response.text}")
        return pd.DataFrame()


async def send_notification(message, location):
    """Send an email notification based on metadata table entries."""
    try:
        # Extract the country name from the location (assuming last part is the country)
        country = location.split(",")[-1].strip()

        # Connect to the database
        await database.connect()

        # Query the metadata table for the country
        query = """SELECT email FROM "SkyTracker".user_details WHERE country = :country"""
        result = await database.fetch_one(query=query, values={"country": country})

        if result:
            email = result["email"]  # Get the email address from the result
            print(f"Found entry for country '{country}', sending notification to {email}")

            # Create the email
            msg = MIMEText(message)
            msg['Subject'] = "Earthquake Alert!"
            msg['From'] = EMAIL_ADDRESS
            msg['To'] = email

            # Send the email
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                server.sendmail(EMAIL_ADDRESS, email, msg.as_string())
                print("Notification sent!")

        else:
            print(f"No entry found for country '{country}'. Notification not sent.")

    except Exception as e:
        print(f"Error sending notification: {e}")

    finally:
        # Ensure the database connection is closed
        await database.disconnect()

async def monitor_earthquakes():
    """Fetch live data and predict significant earthquakes."""
    live_data = fetch_live_data()
    if live_data.empty:
        print("No new earthquake data available.")
        return
    
    # Ensure columns are integers
    for col in ["Year", "Month", "Day", "Hour"]:
        live_data[col] = live_data[col].astype(int)
    
    missing_features = [col for col in features if col not in live_data.columns]
    if missing_features:
        print(f"Missing columns in live data: {missing_features}")
        return
    
    predictions = model.predict_proba(live_data[features])[:, 1]
    live_data['significant_prob'] = predictions
    significant_events = live_data[live_data['significant_prob'] > 0.7]
    if not significant_events.empty:
        for _, event in significant_events.iterrows():
            location = await get_place_name(event['Latitude'], event['Longitude'])
            message = (
                f"Earthquake Alert!\n"
                f"Location: {location}\n"
                f"Magnitude: {event['Magnitude']}\n"
                f"Depth: {event['Depth']} km\n"
                f"Time: {int(event['Year'])}-{int(event['Month']):02d}-{int(event['Day']):02d} {int(event['Hour']):02d}:00 UTC\n"
                f"Significance Probability: {event['significant_prob'] * 100:.2f}%"
            )
            await send_notification(message,location)


# Start monitoring
if __name__ == "__main__":
    asyncio.run(monitor_earthquakes())