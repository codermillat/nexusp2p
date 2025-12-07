export enum ConnectionStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  SEARCHING = 'SEARCHING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'stranger' | 'system';
  text: string;
  timestamp: number;
}

export interface PeerSignal {
  peerId: string;
  timestamp: number;
}

export interface SignalingState {
  status: ConnectionStatus;
  error?: string;
}