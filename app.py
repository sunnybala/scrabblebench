from flask import Flask, send_from_directory, request, jsonify
import requests
import json

app = Flask(__name__, static_folder='static')

# Serve index.html
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Example API route
@app.route('/api/echo', methods=['POST'])
def echo():
    data = request.json
    return jsonify({"you_sent": data})

@app.route('/api/solver', methods=['POST'])
def solver():
    data = request.json
    print("Received data:", data)  # Debugging line to see the received data

    headers = {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
    }

    json_data = {
    'board': data['board'],
    'characters': data['characters'],
    'game': 'scrabble',
    'locale': 'en-US',
    }

    print(json.dumps(json_data))

    response = requests.post('http://localhost:3000/api/solve', headers=headers, json=json_data)
    return jsonify(response.json())



if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)