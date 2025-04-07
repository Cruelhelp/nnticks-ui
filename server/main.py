from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import json
import socket
import uvicorn
from neural_network import NeuralNetwork
import numpy as np
from contextlib import contextmanager

app = FastAPI()
nn = NeuralNetwork([10, 16, 1])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/train")
async def train_network(data: Dict[str, List[float]]):
    try:
        if "ticks" not in data:
            raise HTTPException(status_code=400, detail="Missing ticks data")

        if not data["ticks"]:
            raise HTTPException(status_code=400, detail="Empty ticks data")
            
        if not all(isinstance(x, (int, float)) for x in data["ticks"]):
            raise HTTPException(status_code=400, detail="Invalid tick data types")

        result = await asyncio.wait_for(nn.train(data["ticks"]), timeout=30.0)
        return {"success": True, "result": result}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Training timeout")
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"Training error: {str(e)}")
        return {"success": False, "error": "Internal server error during training"}

@app.post("/api/predict")
async def predict(data: Dict[str, List[float]]):
    try:
        if "input" not in data:
            raise HTTPException(status_code=400, detail="Missing input data")

        prediction = nn.predict(data["input"])
        return {"success": True, "prediction": prediction}
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return {"success": False, "error": "Internal server error during prediction"}

@app.get("/api/model")
async def get_model():
    try:
        model_data = nn.export_model()
        return {"success": True, "model": model_data}
    except Exception as e:
        print(f"Model export error: {str(e)}")
        return {"success": False, "error": "Failed to export model"}

def find_free_port(preferred_port: int = 5000, fallback_start: int = 8000, max_attempts: int = 20) -> int:
    # First try the preferred port
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(('0.0.0.0', preferred_port))
            return preferred_port
    except OSError:
        # If preferred port is taken, try fallback ports
        for port in range(fallback_start, fallback_start + max_attempts):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                    sock.bind(('0.0.0.0', port))
                    return port
            except OSError:
                continue
    raise RuntimeError(f"Could not find a free port in range {fallback_start}-{fallback_start + max_attempts}")

if __name__ == "__main__":
    try:
        port = find_free_port()
        print(f"Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"Failed to start server: {e}")