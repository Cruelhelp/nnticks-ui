
import numpy as np
from typing import List, Dict, Any
import json

class NeuralNetwork:
    def __init__(self, layers: List[int]):
        self.layers = layers
        self.weights = []
        self.biases = []
        self.initialize_network()
        
    def initialize_network(self):
        for i in range(len(self.layers) - 1):
            # He initialization
            scale = np.sqrt(2.0 / self.layers[i])
            self.weights.append(np.random.randn(self.layers[i], self.layers[i+1]) * scale)
            self.biases.append(np.zeros((1, self.layers[i+1])))
    
    def relu(self, x):
        return np.maximum(0, x)
    
    def relu_derivative(self, x):
        return np.where(x > 0, 1, 0)
    
    def normalize(self, data):
        if len(data) == 0:
            return []
        data = np.array(data)
        mean = np.mean(data)
        std = np.std(data) if np.std(data) != 0 else 1
        return (data - mean) / std
    
    def forward(self, x):
        activations = [x]
        for i in range(len(self.weights)):
            net = np.dot(activations[-1], self.weights[i]) + self.biases[i]
            activations.append(self.relu(net))
        return activations
    
    def train(self, data: List[float]) -> Dict[str, Any]:
        try:
            data = np.array(data, dtype=np.float32)
            if len(data) < self.layers[0]:
                raise ValueError(f"Input data length {len(data)} is less than required {self.layers[0]}")
            
            normalized_data = self.normalize(data)
            
            # Prepare training data
            X = np.array([normalized_data[i:i+self.layers[0]] 
                         for i in range(len(normalized_data)-self.layers[0])])
            y = normalized_data[self.layers[0]:]
            
            if len(X) == 0:
                raise ValueError("Not enough data points for training")
            
            # Training parameters
            learning_rate = 0.001
            batch_size = min(32, len(X))
            epochs = 100
            total_loss = 0
            
            # Training loop
            for epoch in range(epochs):
                epoch_loss = 0
                for i in range(0, len(X), batch_size):
                    batch_X = X[i:i+batch_size]
                    batch_y = y[i:i+batch_size]
                    
                    # Forward pass
                    activations = self.forward(batch_X)
                    
                    # Backward pass
                    delta = activations[-1] - batch_y.reshape(-1, 1)
                    for j in reversed(range(len(self.weights))):
                        self.weights[j] -= learning_rate * np.dot(activations[j].T, delta)
                        self.biases[j] -= learning_rate * np.mean(delta, axis=0)
                        if j > 0:
                            delta = np.dot(delta, self.weights[j].T) * self.relu_derivative(activations[j])
                    
                    epoch_loss += np.mean(np.square(delta))
                
                total_loss = epoch_loss / (len(X) / batch_size)
                
            return {
                "loss": float(total_loss),
                "samples_processed": len(X),
                "final_weights": [w.tolist() for w in self.weights],
                "final_biases": [b.tolist() for b in self.biases]
            }
            
        except Exception as e:
            print(f"Training error: {str(e)}")
            raise
    
    def predict(self, input_data: List[float]) -> List[float]:
        try:
            if len(input_data) != self.layers[0]:
                raise ValueError(f"Input length {len(input_data)} does not match expected {self.layers[0]}")
            
            normalized_input = self.normalize(input_data)
            activations = self.forward(normalized_input.reshape(1, -1))
            return activations[-1].flatten().tolist()
            
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            raise
    
    def export_model(self) -> Dict[str, Any]:
        return {
            "layers": self.layers,
            "weights": [w.tolist() for w in self.weights],
            "biases": [b.tolist() for b in self.biases]
        }
