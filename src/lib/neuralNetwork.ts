// Neural Network Implementation for NNticks
import { Indicators } from './indicators';

export interface NNConfiguration {
  learningRate: number;
  epochs: number;
  layers: number[];
  activationFunction: 'relu' | 'sigmoid' | 'tanh';
  batchSize: number;
  momentum: number;
  batchNormalization: boolean;
  dropout: number;
  optimizerType: string;
}

export const DEFAULT_NN_CONFIG: NNConfiguration = {
  learningRate: 0.001,
  epochs: 100,
  layers: [10, 32, 16, 1],
  activationFunction: 'relu',
  batchSize: 32,
  momentum: 0.9,
  batchNormalization: true,
  dropout: 0.2,
  optimizerType: 'adam'
};

export class NeuralNetwork {
  private weights: number[][][] = [];
  private biases: number[][] = [];
  private config: NNConfiguration;
  private lastLoss: number = 0;
  private modelAccuracy: number = 0;
  private weightMomentum: number[][][] = [];
  private biasMomentum: number[][] = [];
  private isTraining: boolean = false;

  constructor(config: NNConfiguration = DEFAULT_NN_CONFIG) {
    this.config = config;
    this.initializeNetwork();
  }

  private normalizeInput(input: number[]): number[] {
    const mean = input.reduce((a, b) => a + b) / input.length;
    const std = Math.sqrt(input.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / input.length);
    return input.map(x => (x - mean) / (std + 1e-8));
  }

  private initializeNetwork(): void {
    const { layers } = this.config;

    for (let i = 0; i < layers.length - 1; i++) {
      const layerWeights: number[][] = [];
      const limit = Math.sqrt(6 / (layers[i] + layers[i + 1]));

      for (let j = 0; j < layers[i]; j++) {
        const neuronWeights: number[] = [];
        for (let k = 0; k < layers[i + 1]; k++) {
          neuronWeights.push((Math.random() * 2 - 1) * limit);
        }
        layerWeights.push(neuronWeights);
      }
      this.weights.push(layerWeights);
      this.biases.push(new Array(layers[i + 1]).fill(0));
    }
  }

  private dropout(activation: number[], rate: number = 0.2): number[] {
    if (!this.isTraining) return activation;
    return activation.map(a => Math.random() > rate ? a / (1 - rate) : 0);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private forwardPass(input: number[]): number[] {
    let activation = input;

    for (let i = 0; i < this.weights.length; i++) {
      const newActivation: number[] = new Array(this.weights[i][0].length).fill(0);

      for (let j = 0; j < this.weights[i][0].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < this.weights[i].length; k++) {
          sum += activation[k] * this.weights[i][k][j];
        }
        newActivation[j] = this.relu(sum);
      }

      activation = newActivation;
    }

    return activation;
  }

  private backpropagate(input: number[], target: number[], learningRate: number): void {
    // Store activations and weighted inputs for each layer
    const activations: number[][] = [input];
    const weightedInputs: number[][] = [];

    // Forward pass storing intermediate values
    let activation = input;
    for (let i = 0; i < this.weights.length; i++) {
      const weighedInput: number[] = new Array(this.weights[i][0].length).fill(0);
      const newActivation: number[] = new Array(this.weights[i][0].length).fill(0);

      for (let j = 0; j < this.weights[i][0].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < this.weights[i].length; k++) {
          sum += activation[k] * this.weights[i][k][j];
        }
        weighedInput[j] = sum;
        newActivation[j] = this.relu(sum);
      }

      weightedInputs.push(weighedInput);
      activations.push(newActivation);
      activation = newActivation;
    }

    // Backward pass
    let delta = activations[activations.length - 1].map((a, i) => {
      const error = a - target[i];
      return error * this.reluDerivative(weightedInputs[weightedInputs.length - 1][i]);
    });

    // Update weights and biases for output layer
    for (let i = this.weights.length - 1; i >= 0; i--) {
      // Update weights
      for (let j = 0; j < this.weights[i].length; j++) {
        for (let k = 0; k < this.weights[i][j].length; k++) {
          this.weights[i][j][k] -= learningRate * delta[k] * activations[i][j];
        }
      }

      // Update biases
      for (let j = 0; j < this.biases[i].length; j++) {
        this.biases[i][j] -= learningRate * delta[j];
      }

      // Calculate delta for next layer
      if (i > 0) {
        const newDelta: number[] = new Array(this.weights[i - 1].length).fill(0);
        for (let j = 0; j < this.weights[i - 1].length; j++) {
          let sum = 0;
          for (let k = 0; k < delta.length; k++) {
            sum += delta[k] * this.weights[i][j][k];
          }
          newDelta[j] = sum * this.reluDerivative(weightedInputs[i - 1][j]);
        }
        delta = newDelta;
      }
    }
  }

  public async train(data: { input: number[], target: number[] }[]): Promise<number> {
    let { learningRate, epochs, batchSize } = this.config;
    const decayRate = 0.01;
    let totalLoss = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;

      // Shuffle data
      const shuffledData = [...data].sort(() => Math.random() - 0.5);

      // Process in batches
      for (let i = 0; i < shuffledData.length; i += batchSize) {
        const batch = shuffledData.slice(i, i + batchSize);

        for (const sample of batch) {
          // Forward pass
          const prediction = this.forwardPass(sample.input);

          // Calculate loss
          const loss = prediction.reduce((sum, p, j) => {
            return sum + Math.pow(p - sample.target[j], 2);
          }, 0) / prediction.length;

          epochLoss += loss;

          // Backpropagate
          this.backpropagate(sample.input, sample.target, learningRate);
        }
      }

      epochLoss /= data.length;
      this.lastLoss = epochLoss;

      // Calculate accuracy based on validation set (using 20% of data)
      const validationData = data.slice(-Math.floor(data.length * 0.2));
      let correct = 0;

      for (const sample of validationData) {
        const prediction = this.forwardPass(sample.input);
        if (Math.abs(prediction[0] - sample.target[0]) < 0.1) {
          correct++;
        }
      }

      this.modelAccuracy = correct / validationData.length;
    }

    return this.modelAccuracy;
  }

  public predict(marketData: number[]): number[] {
    if (marketData.length !== this.config.layers[0]) {
      throw new Error(`Input size must be ${this.config.layers[0]}`);
    }

    return this.forwardPass(marketData);
  }

  public getModelStats() {
    return {
      accuracy: this.modelAccuracy,
      lastLoss: this.lastLoss,
      config: this.config,
      weightsShape: this.weights.map(w => w.length)
    };
  }
}

export const neuralNetwork = new NeuralNetwork();