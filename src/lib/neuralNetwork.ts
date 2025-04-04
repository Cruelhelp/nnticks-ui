
// Neural Network Implementation for NNticks
// This is a simplified version for the frontend
// The actual model training happens on the server side

// Interface for NN Configuration 
export interface NNConfiguration {
  learningRate: number;
  epochs: number;
  layers: number[];
  activationFunction: 'relu' | 'sigmoid' | 'tanh';
}

// Default NN configuration
export const DEFAULT_NN_CONFIG: NNConfiguration = {
  learningRate: 0.01,
  epochs: 50,
  layers: [64, 32, 2], // Input features, hidden layer, output classes
  activationFunction: 'relu'
};

// Prediction types
export type PredictionType = 'rise' | 'fall' | 'even' | 'odd';
export type PredictionTimePeriod = 1 | 3 | 5 | 10;

// Interface for prediction results
export interface PredictionResult {
  type: PredictionType;
  period: PredictionTimePeriod;
  confidence: number;
  timestamp: Date;
  startPrice?: number;
}

// Network model structure for saving/loading
export interface NetworkModel {
  config: NNConfiguration;
  weights: number[][][];
  biases: number[][];
  accuracy: number;
  timestamp: string;
  version: string;
}

// Simple ReLU function implementation
function relu(x: number): number {
  return Math.max(0, x);
}

// Sigmoid activation function
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Tanh activation function
function tanh(x: number): number {
  return Math.tanh(x);
}

// Get activation function based on configuration
function getActivationFunction(type: string): (x: number) => number {
  switch (type) {
    case 'relu': return relu;
    case 'sigmoid': return sigmoid;
    case 'tanh': return tanh;
    default: return relu;
  }
}

// Simple indicator calculation
export class Indicators {
  // Calculate RSI (Relative Strength Index)
  static calculateRSI(data: number[], periods: number = 14): number {
    if (data.length < periods) {
      return 50; // Default for insufficient data
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= periods; i++) {
      const change = data[data.length - i] - data[data.length - i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / periods;
    const avgLoss = losses / periods;

    if (avgLoss === 0) {
      return 100;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }

  // Calculate Moving Average
  static calculateMA(data: number[], periods: number = 20): number {
    if (data.length < periods) {
      return data[data.length - 1]; // Return last value if insufficient data
    }

    const sum = data.slice(-periods).reduce((a, b) => a + b, 0);
    return sum / periods;
  }

  // Calculate Bollinger Bands (returns [middle, upper, lower])
  static calculateBollingerBands(data: number[], periods: number = 20, stdDev: number = 2): [number, number, number] {
    if (data.length < periods) {
      const lastValue = data[data.length - 1];
      return [lastValue, lastValue * 1.1, lastValue * 0.9]; // Estimate if insufficient data
    }

    const slice = data.slice(-periods);
    const ma = slice.reduce((a, b) => a + b, 0) / periods;
    
    // Calculate standard deviation
    const variance = slice.reduce((a, b) => a + Math.pow(b - ma, 2), 0) / periods;
    const sd = Math.sqrt(variance);
    
    return [ma, ma + (stdDev * sd), ma - (stdDev * sd)];
  }
}

export class NeuralNetwork {
  private config: NNConfiguration;
  private isTraining: boolean = false;
  private lastPrediction: PredictionResult | null = null;
  private trainingProgress: number = 0;
  private modelAccuracy: number = 0;
  private weights: number[][][] = []; // Layer weights
  private biases: number[][] = []; // Layer biases
  private modelVersion: string = "1.0.0";
  private trainingData: { inputs: number[], outputs: number[], result: string }[] = [];
  private onProgressCallback: ((progress: number) => void) | null = null;

  constructor(config: NNConfiguration = DEFAULT_NN_CONFIG) {
    this.config = { ...config };
    this.initializeNetwork();
  }

  // Initialize network with random weights and biases
  private initializeNetwork(): void {
    // Initialize weights and biases based on layer configuration
    const { layers } = this.config;
    
    this.weights = [];
    this.biases = [];
    
    // Create weights between layers
    for (let i = 0; i < layers.length - 1; i++) {
      const layerWeights: number[][] = [];
      
      for (let j = 0; j < layers[i]; j++) {
        const neuronWeights: number[] = [];
        
        for (let k = 0; k < layers[i + 1]; k++) {
          // Initialize with small random values
          neuronWeights.push((Math.random() * 2 - 1) * 0.1);
        }
        
        layerWeights.push(neuronWeights);
      }
      
      this.weights.push(layerWeights);
      
      // Initialize biases for next layer
      const layerBiases: number[] = [];
      for (let j = 0; j < layers[i + 1]; j++) {
        layerBiases.push((Math.random() * 2 - 1) * 0.1);
      }
      
      this.biases.push(layerBiases);
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<NNConfiguration>): void {
    const oldLayers = [...this.config.layers];
    this.config = { ...this.config, ...newConfig };
    
    // If layer structure changed, reinitialize network
    if (JSON.stringify(oldLayers) !== JSON.stringify(this.config.layers)) {
      this.initializeNetwork();
    }
  }

  // Get current configuration
  getConfig(): NNConfiguration {
    return { ...this.config };
  }

  // Get training status
  getTrainingStatus(): { isTraining: boolean; progress: number; accuracy: number } {
    return {
      isTraining: this.isTraining,
      progress: this.trainingProgress,
      accuracy: this.modelAccuracy
    };
  }

  // Get model information
  getModelInfo(): { 
    config: NNConfiguration; 
    accuracy: number; 
    version: string; 
    lastUpdated: Date;
  } {
    return {
      config: { ...this.config },
      accuracy: this.modelAccuracy,
      version: this.modelVersion,
      lastUpdated: new Date()
    };
  }

  // Prediction function that works immediately with current tick data
  async predict(
    tickData: number[], 
    type: PredictionType = 'rise', 
    period: PredictionTimePeriod = 3, 
    currentPrice: number = 0
  ): Promise<PredictionResult> {
    // This is a simplified implementation
    // In a real application, this would use TensorFlow.js or call a backend API
    
    if (tickData.length < 10) {
      throw new Error("Insufficient data for prediction");
    }

    // Calculate some basic features (simplified)
    const lastPrice = tickData[tickData.length - 1];
    const rsi = Indicators.calculateRSI(tickData);
    const ma = Indicators.calculateMA(tickData);
    
    // Generate a pseudo-confidence score based on indicators
    // This is just for demonstration - a real NN would compute this
    let trend = 0;
    
    // Check price relative to moving average
    if (lastPrice > ma) {
      trend += 1; // Price above MA suggests uptrend
    } else {
      trend -= 1; // Price below MA suggests downtrend
    }
    
    // Check RSI values
    if (rsi > 70) {
      trend -= 1; // Overbought condition
    } else if (rsi < 30) {
      trend += 1; // Oversold condition
    }
    
    // Calculate volatility as a factor
    const recentPrices = tickData.slice(-10);
    const priceChanges = recentPrices.map((price, i) => 
      i > 0 ? Math.abs(price - recentPrices[i-1]) : 0
    );
    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const volatilityFactor = Math.min(avgChange / lastPrice * 100, 0.3);
    
    // Simulate the activation function from our "neural network"
    const activation = getActivationFunction(this.config.activationFunction);
    
    // Compute pseudo-confidence (between 0.5 and 1.0)
    let confidence = 0.5 + (Math.abs(trend) * 0.15) + (volatilityFactor * 0.5);
    
    // Introduce some randomness to simulate real prediction variability
    confidence = Math.min(0.98, Math.max(0.51, confidence + (Math.random() * 0.1 - 0.05)));
    
    // For type-specific predictions
    let adjustedConfidence = confidence;
    
    if (type === 'rise' && trend < 0) {
      // Lower confidence for rise prediction when trend is down
      adjustedConfidence = Math.max(0.51, confidence - 0.2); 
    } else if (type === 'fall' && trend > 0) {
      // Lower confidence for fall prediction when trend is up
      adjustedConfidence = Math.max(0.51, confidence - 0.2);
    }
    
    // Create prediction result
    const prediction: PredictionResult = {
      type: type,
      period: period,
      confidence: adjustedConfidence,
      timestamp: new Date(),
      startPrice: currentPrice || lastPrice
    };
    
    // Store last prediction
    this.lastPrediction = prediction;
    
    return prediction;
  }

  // Enhanced train function that supports progress tracking
  async train(
    historicalData: number[], 
    options?: { 
      maxEpochs?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<number> {
    if (historicalData.length < 100) {
      throw new Error("Insufficient data for training");
    }
    
    this.isTraining = true;
    this.trainingProgress = 0;
    this.trainingData = [];
    this.onProgressCallback = options?.onProgress || null;
    
    // Simulate epochs
    const maxEpochs = options?.maxEpochs || this.config.epochs;
    
    for (let epoch = 0; epoch < maxEpochs; epoch++) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update progress
      this.trainingProgress = (epoch + 1) / maxEpochs;
      
      // Notify progress callback if provided
      if (this.onProgressCallback) {
        this.onProgressCallback(this.trainingProgress);
      }
      
      // Create synthetic training example using real data
      const sampleIndex = Math.floor(Math.random() * (historicalData.length - 20));
      const inputData = historicalData.slice(sampleIndex, sampleIndex + 10);
      const outputData = historicalData.slice(sampleIndex + 10, sampleIndex + 20);
      const result = outputData[outputData.length - 1] > inputData[inputData.length - 1] ? "rise" : "fall";
      
      // Store training data
      this.trainingData.push({
        inputs: inputData,
        outputs: outputData,
        result
      });
      
      // Simulate accuracy improvements
      const baseAccuracy = 0.6; // Starting accuracy
      const maxImprovement = 0.3; // Maximum possible improvement
      const diminishingReturns = 1 - Math.exp(-epoch / (maxEpochs * 0.4)); // Diminishing returns function
      
      this.modelAccuracy = baseAccuracy + (maxImprovement * diminishingReturns);
      
      // Add some random fluctuations
      this.modelAccuracy += (Math.random() * 0.04 - 0.02);
      
      // Clamp to realistic values
      this.modelAccuracy = Math.min(0.95, Math.max(0.6, this.modelAccuracy));
      
      // Update model version
      this.modelVersion = `1.0.${epoch + 1}`;
    }
    
    this.isTraining = false;
    return this.modelAccuracy;
  }

  // Export model to JSON
  exportModel(): NetworkModel {
    return {
      config: { ...this.config },
      weights: this.weights,
      biases: this.biases,
      accuracy: this.modelAccuracy,
      timestamp: new Date().toISOString(),
      version: this.modelVersion
    };
  }

  // Import model from JSON
  importModel(model: NetworkModel): boolean {
    try {
      this.config = { ...model.config };
      this.weights = model.weights;
      this.biases = model.biases;
      this.modelAccuracy = model.accuracy;
      this.modelVersion = model.version;
      return true;
    } catch (error) {
      console.error("Error importing model:", error);
      return false;
    }
  }

  // Save model to file
  saveModelToFile(): void {
    const model = this.exportModel();
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nnticks-model-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Load model from file
  loadModelFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target?.result) {
            throw new Error("Failed to read file");
          }
          
          const modelData = JSON.parse(event.target.result as string) as NetworkModel;
          const success = this.importModel(modelData);
          resolve(success);
        } catch (error) {
          console.error("Error loading model from file:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  // Get model statistics
  getModelStats(): { accuracy: number; config: NNConfiguration; trainingData: any[] } {
    return {
      accuracy: this.modelAccuracy,
      config: this.config,
      trainingData: this.trainingData
    };
  }
}

// Create and export a singleton instance
export const neuralNetwork = new NeuralNetwork();
