import { Indicators } from './indicators';

export interface NNConfiguration {
  learningRate: number;
  epochs: number;
  layers: number[];
}

export const DEFAULT_NN_CONFIG: NNConfiguration = {
  learningRate: 0.001,
  epochs: 100,
  layers: [10, 16, 1]
};

export class NeuralNetwork {
  private weights: number[][][] = [];
  private biases: number[][] = [];
  private config: NNConfiguration;

  constructor(config: NNConfiguration = DEFAULT_NN_CONFIG) {
    this.config = config;
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    const { layers } = this.config;

    // Initialize weights and biases between layers
    for (let i = 0; i < layers.length - 1; i++) {
      const currentLayer: number[][] = [];
      const layerBiases: number[] = [];

      // Xavier/Glorot initialization
      const limit = Math.sqrt(2.0 / (layers[i] + layers[i + 1]));

      for (let j = 0; j < layers[i]; j++) {
        const neuronWeights: number[] = [];
        for (let k = 0; k < layers[i + 1]; k++) {
          neuronWeights.push((Math.random() * 2 - 1) * limit);
        }
        currentLayer.push(neuronWeights);
      }

      // Initialize biases for the next layer
      for (let j = 0; j < layers[i + 1]; j++) {
        layerBiases.push(0);
      }

      this.weights.push(currentLayer);
      this.biases.push(layerBiases);
    }
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private normalize(data: number[]): number[] {
    if (!data || data.length === 0) return [];

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
    ) || 1;

    return data.map(x => (x - mean) / std);
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

  public async train(data: number[], options?: { maxEpochs?: number; onProgress?: (progress: number) => void }): Promise<number> {
    if (!Array.isArray(data) || data.length < this.config.layers[0]) {
      throw new Error('Invalid input data');
    }

    const normalizedData = this.normalize(data);
    const batchSize = 32;
    const { learningRate } = this.config;
    const maxEpochs = options?.maxEpochs || this.config.epochs;
    let totalLoss = 0;

    try {
      // Prepare training data
      const inputs: number[][] = [];
      const targets: number[][] = [];

      for (let i = 0; i < normalizedData.length - this.config.layers[0]; i++) {
        inputs.push(normalizedData.slice(i, i + this.config.layers[0]));
        targets.push([normalizedData[i + this.config.layers[0]]]);
      }

      // Training loop
      for (let epoch = 0; epoch < maxEpochs; epoch++) {
        let epochLoss = 0;

        for (let i = 0; i < inputs.length; i += batchSize) {
          const batchInputs = inputs.slice(i, i + batchSize);
          const batchTargets = targets.slice(i, i + batchSize);

          let batchLoss = 0;
          for (let j = 0; j < batchInputs.length; j++) {
            const prediction = this.forwardPass(batchInputs[j]);
            batchLoss += Math.pow(prediction[0] - batchTargets[j][0], 2);

            // Update weights and biases
            let delta = prediction[0] - batchTargets[j][0];
            for (let k = this.weights.length - 1; k >= 0; k--) {
              for (let l = 0; l < this.weights[k].length; l++) {
                for (let m = 0; m < this.weights[k][l].length; m++) {
                  this.weights[k][l][m] -= learningRate * delta * batchInputs[j][l];
                }
              }
              for (let l = 0; l < this.biases[k].length; l++) {
                this.biases[k][l] -= learningRate * delta;
              }
            }
          }

          epochLoss += batchLoss / batchInputs.length;
        }

        epochLoss /= Math.ceil(inputs.length / batchSize);
        totalLoss = epochLoss;

        if (options?.onProgress) {
          options.onProgress((epoch + 1) / maxEpochs);
        }
      }
    } catch (error) {
      console.error('Training error:', error);
      throw error;
    }

    return totalLoss;
  }

  public predict(input: number[]): number[] {
    if (!Array.isArray(input) || input.length !== this.config.layers[0]) {
      throw new Error(`Input must be an array of length ${this.config.layers[0]}`);
    }

    const normalizedInput = this.normalize(input);
    return this.forwardPass(normalizedInput);
  }

  public getConfig() {
    return this.config;
  }

  public getModelStats() {
    return {
      layers: this.config.layers,
      weightsShape: this.weights.map(w => w.length),
      learningRate: this.config.learningRate
    };
  }
}

export const neuralNetwork = new NeuralNetwork();