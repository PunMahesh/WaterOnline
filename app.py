from flask import Flask, request, jsonify, render_template
from ai_routes import ai_routes
import sqlite3

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', project_name='WaterOnline')

@app.route('/api/data', methods=['GET'])
def hello():
    return jsonify({'message': 'Hello, World!'})

@app.route("/api/water-data", methods=["GET"])
def get_water_data():
    try:
        conn = sqlite3.connect("data/water_quality.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM water")
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        conn.close()
        return jsonify([dict(zip(columns, row)) for row in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

app.register_blueprint(ai_routes)    

if __name__ == '__main__':
    app.run(debug=True)
