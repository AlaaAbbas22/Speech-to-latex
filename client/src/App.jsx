import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import 'katex/dist/katex.min.css'; // Import Katex CSS for LaTeX rendering
import { BlockMath } from 'react-katex'; // Import the katex component for rendering

const socket = io("http://127.0.0.1:4000");

export default function LiveTranscription() {
  const [fullTranscription, setFullTranscription] = useState("");
  const [backendResponse, setBackendResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const { transcript, resetTranscript } = useSpeechRecognition();
  
  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("transcription_chunk", (data) => {
      console.log(data);
      setBackendResponse(data.text); // LaTeX from backend
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    return () => {
      socket.off("connect");
      socket.off("transcription_chunk");
      socket.off("disconnect");
    };
  }, []);

  const startRecording = () => {
    setRecording(true);
    SpeechRecognition.startListening();
  };

  const stopRecording = () => {
    setRecording(false);
    SpeechRecognition.stopListening();
    
    // Append the current transcript to the existing transcription text
    setFullTranscription( transcript);
    resetTranscript(); // Reset for the next recording session
  };

  // Update local transcription with real-time transcript without overwriting
  useEffect(() => {
    if (transcript) {
      setFullTranscription(transcript);
    }
  }, [transcript]);

  const handleInputChange = (e) => {
    setFullTranscription(e.target.value);
  };

  const sendToBackend = () => {
    socket.emit("audio_chunk", fullTranscription);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex p-6 space-x-8">
      {/* Left Panel */}
      <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-extrabold text-blue-800">Live Transcription</h1>
        
        <button 
          onClick={recording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-lg text-lg font-medium ${recording ? "bg-red-600 text-white" : "bg-green-600 text-white"} transition duration-300 ease-in-out transform hover:scale-105`}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>

        <div className="w-full">
          <h2 className="text-xl font-semibold text-gray-700">Transcription:</h2>
          <textarea
            value={fullTranscription}
            onChange={handleInputChange}
            placeholder="Start speaking or type here..."
            rows="6"
            className="w-full p-4 border border-gray-300 rounded-lg mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition ease-in-out duration-300"
          />
        </div>
        
        <button 
          onClick={sendToBackend}
          className="bg-blue-700 text-white px-6 py-3 mt-6 rounded-lg font-medium transition duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-800"
        >
          Convert
        </button>
      </div>

      {/* Right Panel */}
      <div className="w-2/3 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700">Backend Response:</h2>
        <div className="p-6 mt-4 bg-white border border-gray-300 rounded-lg shadow-lg text-black">
          {backendResponse ? (
            <BlockMath math={backendResponse} /> // Renders LaTeX response
          ) : (
            <p className="text-gray-500">No response yet...</p>
          )}
        </div>
      </div>
    </div>
  );
}
