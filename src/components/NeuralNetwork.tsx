
import React from 'react';
import NeuralNetworkSimulation from './NeuralNetworkSimulation';
import EpochManager from './EpochManager';

const NeuralNetwork: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Neural Network Visualization</h2>
        <p className="text-sm text-muted-foreground">View and interact with the neural network</p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NeuralNetworkSimulation />
        </div>
        
        <div>
          <EpochManager />
        </div>
      </div>
    </div>
  );
};

export default NeuralNetwork;
