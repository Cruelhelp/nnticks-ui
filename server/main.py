
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
from neural_network import NeuralNetwork

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
        result = nn.train(data["ticks"])
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/predict")
async def predict(data: Dict[str, List[float]]):
    try:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
