from datetime import datetime, timezone, timedelta
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
import joblib

# Load historical earthquake data
def load_historical_data():
    try:
        # Load the dataset with space as a delimiter
        df = pd.read_csv("Earthquake_Data.csv", delimiter=r"\s+", engine="python")
        
        # Rename relevant columns to match expected names
        df = df.rename(columns={
            "Date(YYYY/MM/DD)": "Date",
            "Time": "Time",
            "Latitude": "Latitude",
            "Longitude": "Longitude",
            "Depth": "Depth",
            "Mag": "Magnitude"
        })

        # Ensure only relevant columns
        df = df[["Date", "Time", "Latitude", "Longitude", "Depth", "Magnitude"]]

        # Handle missing or invalid data
        df = df.dropna()
        df = df[df["Magnitude"] > 0]

        # Feature engineering
        df["Datetime"] = pd.to_datetime(df["Date"] + " " + df["Time"])
        df["Year"] = df["Datetime"].dt.year
        df["Month"] = df["Datetime"].dt.month
        df["Day"] = df["Datetime"].dt.day
        df["Hour"] = df["Datetime"].dt.hour

        return df
    except Exception as e:
        print(f"Error loading historical data: {e}")
        return pd.DataFrame()

# Train the model and save it
def train_and_save_model():
    df = load_historical_data()
    if df.empty:
        print("No historical data available for training.")
        return None

    # Select features and target
    features = ["Latitude", "Longitude", "Depth", "Magnitude", "Year", "Month", "Day", "Hour"]
    df["Target"] = (df["Magnitude"] > 4.5).astype(int)  # Significant quakes
    X = df[features]
    y = df["Target"]

    # Train the model
    model = RandomForestClassifier(random_state=42)
    model.fit(X, y)

    # Evaluate the model
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]
    print(classification_report(y, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y, y_proba):.2f}")

    # Save the model
    joblib.dump((model, features), "earthquake_model.pkl")
    print("Model trained and saved successfully.")

# Train and save the model
train_and_save_model()
