
// This is a backward compatibility hook that uses our PersistentWebSocketService
import { usePersistentWebSocket } from './usePersistentWebSocket';

// Export both the renamed hook and the original for backward compatibility
export const useWebSocket = usePersistentWebSocket;
export const useWebSocketClient = usePersistentWebSocket;
