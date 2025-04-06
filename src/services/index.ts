
// Re-export all services from this central file
export * from './core/WebSocketService';
export * from './core/EpochService';

// Legacy re-exports for backward compatibility
export { default as webSocketService } from './core/WebSocketService';
export { default as epochService } from './core/EpochService';
export { default as predictionService } from './PredictionService';
export { default as tickService } from './TickService';
export { default as trainingService } from './TrainingService';
export { default as epochCollectionService } from './EpochCollectionService';
export { default as persistentWebSocket } from './PersistentWebSocketService';
