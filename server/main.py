
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
from neural_network import NeuralNetwork
import uvicorn
import socket

app = FastAPI()
nn = NeuralNetwork([10, 16, 1])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/train")
async def train_network(data: Dict[str, List[float]]):
    try:
        if "ticks" not in data:
            raise HTTPException(status_code=400, detail="Missing ticks data")
            
        session_id = data.get("sessionId")
        if not session_id:
            nn.initialize_network()  # Reset network for new session
            
        result = nn.train(data["ticks"])
        return {
            "success": True, 
            "result": {
                **result,
                "model": nn.export_model() if session_id else None
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/predict")
async def predict(data: Dict[str, List[float]]):
    try:
        if "input" not in data:
            raise HTTPException(status_code=400, detail="Missing input data")
            
        prediction = nn.predict(data["input"])
        return {"success": True, "prediction": prediction}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/model")
async def get_model():
    try:
        model_data = nn.export_model()
        return {"success": True, "model": model_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

def find_free_port(start_port: int = 5000, max_attempts: int = 10) -> int:
    for port in range(start_port, start_port + max_attempts):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('0.0.0.0', port))
            sock.close()
            return port
        except OSError:
            if port == start_port:
                print(f"Port {port} is in use, trying alternative ports...")
            continue
    raise RuntimeError(f"Could not find a free port in range {start_port}-{start_port + max_attempts}")

if __name__ == "__main__":
    try:
        port = find_free_port()
        print(f"Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"Failed to start server: {e}")
        # Try one more time with a different port range
        try:
            port = find_free_port(8000, 10)
            print(f"Retrying with port {port}")
            uvicorn.run(app, host="0.0.0.0", port=port)
        except Exception as e:
            print(f"Failed to start server: {e}")

if __name__ == "__main__":
    try:
        port = find_free_port()
        print(f"Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"Failed to start server: {e}")
