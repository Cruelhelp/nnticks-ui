
// This is a backward compatibility hook that uses our new PersistentWebSocketService
import { usePersistentWebSocket } from './usePersistentWebSocket';

// Re-export with the old interface for backward compatibility
export const useWebSocket = usePersistentWebSocket;
