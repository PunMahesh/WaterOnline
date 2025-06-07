import os
import requests
import sqlite3
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()
ai_routes = Blueprint("ai_routes", __name__)

GITHUB_MODEL_ENDPOINT = "https://models.github.ai/inference/chat/completions"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Content-Type": "application/json"
}

DB_PATH = "data/chat.db"

def get_recent_history(user_id, limit=10):
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute(
            "SELECT role, content from chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?",
            (user_id, limit)
        )
        rows = cur.fetchall()
        return [{"role": role, "content": content} for role,content in reversed(rows)]
    
def save_message(user_id, role, content):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)",
            (user_id, role, content)
        )
        conn.commit()
        

@ai_routes.route("/api/ask", methods=["POST"])
def ask():
    data = request.get_json()
    prompt = data.get("prompt", "")
    user_id = data.get("user_id")

    if not user_id or not prompt:
        return jsonify({"error": "Missing user_id or prompt"}), 400
    
    #GET past messages
    messages = get_recent_history(user_id)
    messages.append({"role": "user", "content": prompt})

    try:
        response = requests.post(
            GITHUB_MODEL_ENDPOINT,
            headers=HEADERS,
            json={
                "model": "openai/gpt-4.1",
                "messages": messages,
                "temperature": 1,
                "top_p": 1
            }
        )

        if response.status_code != 200:
            return jsonify({"error": f"Request failed: {response.status_code}", "details": response.json()}), 500

        result = response.json()
        ai_routes = result.get("choices")[0]['message']['content']

        save_message(user_id, "user", prompt)
        save_message(user_id, "assistant", ai_routes)

        return jsonify({"response": ai_routes})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
