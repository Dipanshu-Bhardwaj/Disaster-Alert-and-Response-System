from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from databases import Database
from aiosmtplib import send
from email.message import EmailMessage
from openai import OpenAI

app = FastAPI()

# Allow CORS for all origins (or specific origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific origins like ["http://127.0.0.1:5500"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database URL
DATABASE_URL = ""
database = Database(DATABASE_URL)

# Event handlers for startup and shutdown
async def startup():
    await database.connect()

async def shutdown():
    await database.disconnect()

# Register the event handlers with add_event_handler
app.add_event_handler("startup", startup)
app.add_event_handler("shutdown", shutdown)

class UserDetails(BaseModel):
    name: str
    email: EmailStr
    contact_no: str
    city: str
    country: str

async def send_welcome_email(user: UserDetails):
    try:
        # Create the email message
        message = EmailMessage()
        message["From"] = ""  # Your email address
        message["To"] = user.email
        message["Subject"] = "Welcome to Our Service"
        message.set_content(f"""
        Hi {user.name},

        Welcome to our platform! We're excited to have you on board.

        Regards,
        Team SkyTracker
        """)

        # Send the email
        await send(
            message,
            hostname="smtp.gmail.com",  # Update based on your SMTP provider
            port=587,
            start_tls=True,
            username="",
            password="", 
        )
    except Exception as e:
        print("Failed to send email:", e)
        raise HTTPException(status_code=500, detail="Failed to send email")

# Endpoint to fetch earthquake data
@app.get("/earthquakes")
def get_earthquakes(min_magnitude: float = 4.0):
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    now = datetime.now(tz=timezone.utc)
    past_three_days = now - timedelta(days=3)

    params = {
        "format": "geojson",
        "starttime": past_three_days.isoformat(),
        "endtime": now.isoformat(),
        "minmagnitude": min_magnitude,
    }

    response = requests.get(url, params=params, verify=False)
    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=500, detail="Failed to fetch earthquake data")
 
# Pydantic model for user details
class UserDetails(BaseModel):
    name: str
    email: EmailStr
    contact_no: str
    city: str
    country: str

# Endpoint to save user details
@app.post("/save-user-details")
async def save_user_details(user: UserDetails):
    query = """
        INSERT INTO "SkyTracker".user_details (name, email, contact_no, city, country)
        VALUES (:name, :email, :contact_no, :city, :country)
    """
    try:
        await database.execute(query, user.model_dump())
        await send_welcome_email(user)
        return {"message": "User details saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error saving details: {str(e)}")


client = OpenAI(
  api_key=""
)
class Query(BaseModel):
    user_input: str

@app.post("/chatbot")
async def chatbot(query: Query):
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            store=True,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant specialized in answering as a weather forecast agent and safety advisor. "
                        "When responding, provide concise answers. If the response exceeds 20 words, organize the answer into clear, "
                        "actionable bullet points, no more than 5."
                    )
                },
                {"role": "user", "content": query.user_input},
            ],
        )

        reply = completion.choices[0].message.content
        reply = reply.replace("**", "")  # Clean unnecessary bold markers

        if len(reply.split()) > 20:
            # Split reply into lines
            sentences = reply.split("\n")

            # Process each line for formatting
            formatted_lines = []
            for line in sentences:
                if line.strip():  # Skip empty lines
                    if line.startswith("- "):  # Detect bullet points
                        line = line[2:]  # Remove leading '- '
                        if ":" in line:
                            # Split at ':' for strong formatting
                            colon_index = line.find(":")
                            strong_part = line[:colon_index].strip()
                            rest_of_line = line[colon_index + 1:].strip()
                            formatted_line = f"<li><strong>{strong_part}</strong>: {rest_of_line}</li>"
                        else:
                            formatted_line = f"<li>{line.strip()}</li>"  # No ':' case
                        formatted_lines.append(formatted_line)
                    else:
                        formatted_lines.append(f"<strong>{line}</strong>\n\n")

            # Combine into an unordered list
            bullet_points = "<ul>\n" + "\n".join(formatted_lines[:5]) + "\n</ul>"

            return {"reply": bullet_points}
        else:
            # Simple response for short replies
            return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
