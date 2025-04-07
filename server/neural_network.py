
import numpy as np
from typing import List, Dict, Optional
import json

class NeuralNetwork:
    def __init__(self, layers: List[int]):
        self.layers = layers
        self.weights = []
        self.biases = []
        self.initialize_network()
        self.last_loss = None

    def initialize_network(self):
        for i in range(len(self.layers) - 1):
            # Xavier/Glorot initialization
            limit = np.sqrt(2.0 / (self.layers[i] + self.layers[i + 1]))
            self.weights.append(np.random.uniform(-limit, limit, (self.layers[i], self.layers[i + 1])))
            self.biases.append(np.zeros((1, self.layers[i + 1])))

    def relu(self, x: np.ndarray) -> np.ndarray:
        return np.maximum(0, x)

    def relu_derivative(self, x: np.ndarray) -> np.ndarray:
        return np.where(x > 0, 1, 0)

    def normalize(self, data: np.ndarray) -> np.ndarray:
        if len(data) == 0:
            return np.array([])
        return (data - np.mean(data)) / (np.std(data) + 1e-8)

    def forward_pass(self, input_data: np.ndarray) -> np.ndarray:
        activation = input_data
        activations = [activation]
        
        for i in range(len(self.weights)):
            activation = self.relu(np.dot(activation, self.weights[i]) + self.biases[i])
            activations.append(activation)
            
        return activations[-1]

    def train(self, data: List[float], epochs: int = 10) -> Dict:
        data = np.array(data)
        normalized_data = self.normalize(data)
        batch_size = 32
        learning_rate = 0.001
        total_loss = 0

        # Prepare training data
        X = np.array([normalized_data[i:i+self.layers[0]] for i in range(len(normalized_data)-self.layers[0])])
        y = normalized_data[self.layers[0]:]

        for epoch in range(epochs):
            epoch_loss = 0
            
            for i in range(0, len(X), batch_size):
                batch_X = X[i:i+batch_size]
                batch_y = y[i:i+batch_size]
                
                if len(batch_X) == 0:
                    continue

                # Forward pass
                predictions = self.forward_pass(batch_X)
                
                # Calculate loss
                loss = np.mean((predictions - batch_y.reshape(-1, 1)) ** 2)
                epoch_loss += loss

                # Backpropagation and weight updates
                error = predictions - batch_y.reshape(-1, 1)
                for j in range(len(self.weights) - 1, -1, -1):
                    delta = error * self.relu_derivative(predictions)
                    self.weights[j] -= learning_rate * np.dot(batch_X.T, delta)
                    self.biases[j] -= learning_rate * np.mean(delta, axis=0)

            epoch_loss /= (len(X) // batch_size)
            total_loss = epoch_loss
            self.last_loss = total_loss

        return {
            "loss": float(total_loss),
            "accuracy": float(1.0 / (1.0 + total_loss))
        }

    def predict(self, input_data: List[float]) -> List[float]:
        input_array = np.array(input_data)
        normalized_input = self.normalize(input_array)
        prediction = self.forward_pass(normalized_input.reshape(1, -1))
        return prediction.flatten().tolist()

    def export_model(self) -> Dict:
        return {
            "layers": self.layers,
            "weights": [w.tolist() for w in self.weights],
            "biases": [b.tolist() for b in self.biases]
        }

    def import_model(self, model_data: Dict):
        self.layers = model_data["layers"]
        self.weights = [np.array(w) for w in model_data["weights"]]
        self.biases = [np.array(b) for b in model_data["biases"]]
