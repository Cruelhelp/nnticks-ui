
import { PersistentWebSocketService } from '@/services/PersistentWebSocketService';

declare global {
  interface Window {
    persistentWebSocket?: {
      connect: () => boolean;
      disconnect: () => boolean;
    };
  }
}

export {};
