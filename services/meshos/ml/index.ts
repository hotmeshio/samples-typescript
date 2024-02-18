import Redis from 'ioredis';
import { MeshOS } from '@hotmeshio/pluck';

import config from '../../../config';

export class CoordinateClassifier extends MeshOS {

  //every subclass is isolated in Redis by this
  namespace = 'ml';

  redisClass = Redis;

  redisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DATABASE,
  };

  inputSize: number = 2; // x and y
  outputSize: number = 4; // NW, NE, SW, SE
  hiddenSize: number = 5; // Adjustable size of the hidden layer

  // Initialize weights and biases
  weightsInputHidden: number[][] = Array(this.hiddenSize).fill([]).map(() => Array(this.inputSize).fill(0));
  weightsHiddenOutput: number[][] = Array(this.outputSize).fill([]).map(() => Array(this.hiddenSize).fill(0));
  biasesHidden: number[] = Array(this.hiddenSize).fill(0);
  biasesOutput: number[] = Array(this.outputSize).fill(0);

  // Mean Squared Error Loss Function
  mseLoss(output: number[], target: number[]): number {
    return output.reduce((sum, o, i) => sum + Math.pow(o - target[i], 2), 0) / output.length;
  }

  // Backpropagation
  backpropagate(input: number[], target: number[], learningRate: number): void {
    // Forward pass to calculate activations
    // Calculate hidden layer activations (using ReLU or similar function)
    let hidden = this.weightsInputHidden.map((weights, i) =>
      input.reduce((sum, inp, j) => sum + inp * weights[j], this.biasesHidden[i])
    );
    hidden = hidden.map(val => val > 0 ? val : 0); // ReLU activation

    // Calculate output layer activations (using softmax or similar function)
    let output = this.weightsHiddenOutput.map((weights, i) =>
      hidden.reduce((sum, h, j) => sum + h * weights[j], this.biasesOutput[i])
    );
    output = this.softmax(output);

    // Calculate output layer error (difference between predicted and target)
    let outputError = output.map((o, i) => o - target[i]);

    // Calculate hidden layer error (derivative of ReLU and weightsHiddenOutput)
    let hiddenError = this.weightsHiddenOutput.map(weights =>
      weights.reduce((sum, weight, i) => sum + outputError[i] * weight, 0)
    );
    hiddenError = hiddenError.map((h, i) => h * (hidden[i] > 0 ? 1 : 0)); // Derivative of ReLU

    // Update weights and biases for the hidden-output layer
    for (let i = 0; i < this.outputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weightsHiddenOutput[i][j] -= learningRate * outputError[i] * hidden[j];
      }
      this.biasesOutput[i] -= learningRate * outputError[i];
    }

    // Update weights and biases for the input-hidden layer
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.inputSize; j++) {
        this.weightsInputHidden[i][j] -= learningRate * hiddenError[i] * input[j];
      }
      this.biasesHidden[i] -= learningRate * hiddenError[i];
    }
  }

  // Training Method
  async train(data: Array<{ input: number[], label: string }>, epochs: number, learningRate: number): Promise<void> {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const { input, label } of data) {
        const target = this.oneHotEncode(label);
        const output = this.forwardPropagation(input);
        this.backpropagate(input, target, learningRate);
        // Optional: Log loss every few epochs
      }
    }
  }

  // One-Hot Encoding for Quadrant Labels
  oneHotEncode(label: string): number[] {
    switch (label) {
      case 'NW': return [1, 0, 0, 0];
      case 'NE': return [0, 1, 0, 0];
      case 'SW': return [0, 0, 1, 0];
      case 'SE': return [0, 0, 0, 1];
      default: throw new Error('Invalid label');
    }
  }

  // Forward Propagation
  forwardPropagation(input: number[]): number[] {
    // Calculate hidden layer activations
    let hidden = this.weightsInputHidden.map((weights, i) =>
      input.reduce((sum, inp, j) => sum + inp * weights[j], this.biasesHidden[i])
    );
    hidden = hidden.map(val => val > 0 ? val : 0); // ReLU activation

    // Calculate output layer activations
    let output = this.weightsHiddenOutput.map((weights, i) =>
      hidden.reduce((sum, h, j) => sum + h * weights[j], this.biasesOutput[i])
    );
    return this.softmax(output);
  }

  // Softmax Function
  softmax(arr: number[]): number[] {
    const max = Math.max(...arr);
    const exps = arr.map(val => Math.exp(val - max));
    const sumExps = exps.reduce((sum, val) => sum + val, 0);
    return exps.map(val => val / sumExps);
  }

  // Prediction Method
  async predict(x: number, y: number): Promise<string> {
    const input = [x, y];
    const probabilities = this.forwardPropagation(input);
    const quadrantIndex = probabilities.indexOf(Math.max(...probabilities));
    return ['NW', 'NE', 'SW', 'SE'][quadrantIndex];
  }
}

// Usage example:
// const classifier = new CoordinateClassifier();
// const trainingData = [
//   { input: [1, 1], label: 'NE' },
//   { input: [-1, 1], label: 'NW' },
//   // ... more training data
// ];
// await classifier.train(trainingData, 100, 0.01); // 100 epochs, learning rate of 0.01
// const quadrant = await classifier.predict(1, -2);
