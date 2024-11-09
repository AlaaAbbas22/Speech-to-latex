from flask import Flask
from flask_socketio import SocketIO, emit
import whisper
from saytex import Saytex
import requests
import time

LLM_API_URL = "https://hflink-eastus-models-playground.azure-api.net/models/Phi-3-medium-128k-instruct/score"


def llm(message):
    prompt = f"Convert this text to latex. Return only the plain inner latex code only. \n{message}"
    data = {
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 50000,
        "temperature": 0.7,
        "top_p": 1
    }
    
    response = requests.post(LLM_API_URL, json=data)
    
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    else:
        raise Exception(f"Request failed with status code: {response.status_code}")



app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow CORS for testing

# Load the Whisper model
model = whisper.load_model("base")

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    print("Received audio chunk", data)
    # Convert to LaTeX using SayTeX
    #parser = Saytex()
    #latex_code = parser.to_latex(parser.to_saytex(data))
    #print(f"Converted to LaTeX: {latex_code}")
    while True:
        try:
            emit('transcription_chunk', {'text': llm(data)})
            break
        except:
            print("Waitin")
            time.sleep(5)

if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=4000)
