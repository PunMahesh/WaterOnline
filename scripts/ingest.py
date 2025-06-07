import pandas as pd
import sqlite3
import os

# Make sure data folder exists
os.makedirs("data", exist_ok=True)

# Load your dataset
df = pd.read_csv("dataset/water_potability.csv")

# Clean column names
df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

# Drop missing rows
df = df.dropna()

# Save to SQLite
conn = sqlite3.connect("data/water_quality.db")
df.to_sql("water", conn, if_exists="replace", index=False)
conn.close()

print("✅ water_quality.db created!")
