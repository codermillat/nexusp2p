import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import mqtt from 'mqtt';
import { ConnectionStatus, ChatMessage } from '../types';

// Use a public reliable broker with WSS support
const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
const TOPIC_LOBBY = 'nexusp2p-global-lobby-v4';

// Connection timeouts (in ms)
const PEER_INIT_TIMEOUT = 15000;
const STREAM_HANDSHAKE_TIMEOUT = 15000;
const CONNECTION_ATTEMPT_TIMEOUT = 8000;
const MQTT_RECONNECT_ATTEMPTS = 3;

// Free public STUN servers are essential for P2P connections to work 
// across different networks (NAT traversal).
const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  },
  debug: 0 // Set to 2 or 3 for verbose debugging logs
};

// Browser compatibility check
const checkBrowserSupport = (): { supported: boolean; error?: string } => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, error: 'Your browser does not support camera/microphone access.' };
  }
  if (!window.RTCPeerConnection) {
    return { supported: false, error: 'Your browser does not support WebRTC peer connections.' };
  }
  return { supported: true };
};

export const useChatConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Media States
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);

  // Connection Stats
  const [latency, setLatency] = useState<number | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  // Refs for persistence without re-renders
  const peerRef = useRef<Peer | null>(null);
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const myPeerIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreRemoteIdsRef = useRef<Set<string>>(new Set());
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ConnectionStatus>(ConnectionStatus.IDLE);
  const mqttReconnectAttempts = useRef(0);

  // Keep statusRef in sync with status state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Helper to safely clear all intervals and timeouts
  const clearAllTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // 1. Initialize Local Media with enhanced error handling
  const initLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    // Check browser support first
    const browserCheck = checkBrowserSupport();
    if (!browserCheck.supported) {
      setError(browserCheck.error || 'Browser not supported');
      setStatus(ConnectionStatus.ERROR);
      return null;
    }

    setIsInitializing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      setError(null);
      return stream;
    } catch (err: unknown) {
      console.error("Failed to get media", err);

      // Provide specific error messages based on error type
      let errorMessage = "Could not access camera/microphone.";

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Camera/microphone permission denied. Please allow access and try again.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = "No camera or microphone found. Please connect a device.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = "Camera/microphone is already in use by another application.";
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = "Camera does not meet the required specifications.";
        } else if (err.name === 'TypeError') {
          errorMessage = "Invalid media constraints specified.";
        }
      }

      setError(errorMessage);
      setStatus(ConnectionStatus.ERROR);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      });
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      });
    }
  }, []);

  const toggleRemoteAudio = useCallback(() => {
    setIsRemoteAudioEnabled((prev) => !prev);
  }, []);

  // 2. Initialize PeerJS with proper error handling and timeout
  const initPeer = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      if (peerRef.current && !peerRef.current.destroyed) {
        if (peerRef.current.id) {
          resolve(peerRef.current.id);
        } else {
          reject(new Error('Peer exists but has no ID'));
        }
        return;
      }

      // Set a timeout for peer initialization
      const initTimeout = setTimeout(() => {
        reject(new Error('PeerJS initialization timed out. Please check your network connection.'));
      }, PEER_INIT_TIMEOUT);

      let peer: Peer;

      try {
        peer = new Peer(PEER_CONFIG);
      } catch (err) {
        clearTimeout(initTimeout);
        reject(new Error('Failed to create PeerJS instance'));
        return;
      }

      peer.on('open', (id) => {
        clearTimeout(initTimeout);
        console.log('My Peer ID:', id);
        myPeerIdRef.current = id;
        peerRef.current = peer;
        resolve(id);
      });

      peer.on('call', (call) => {
        // BUSY STATE LOGIC:
        // If we are already connected or connecting to someone else, reject this call.
        if (currentCallRef.current && currentCallRef.current.open) {
          console.log("Busy, rejecting call from:", call.peer);
          call.close();
          return;
        }

        // Only answer if we are actually searching or idle (waiting)
        if (localStreamRef.current) {
          console.log("Receiving call from:", call.peer);

          // Clear timeouts since we are now establishing a connection
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }

          stopMatchmakingSignaling();
          setStatus(ConnectionStatus.CONNECTING);
          call.answer(localStreamRef.current);
          handleCall(call);
        }
      });

      peer.on('connection', (conn) => {
        if (dataConnRef.current && dataConnRef.current.open) {
          conn.close();
          return;
        }
        console.log("Receiving data connection from:", conn.peer);
        handleDataConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('PeerJS error:', err);

        // Handle initialization errors
        if (!peerRef.current || peerRef.current.destroyed) {
          clearTimeout(initTimeout);
          reject(new Error(`PeerJS error: ${err.type || 'unknown'}`));
          return;
        }

        // Handle runtime errors
        if (err.type === 'peer-unavailable') {
          console.log('Peer unavailable, may have disconnected');
          handleRemoteDisconnect();
        } else if (err.type === 'network' || err.type === 'disconnected' || err.type === 'server-error') {
          setError('Network connection lost. Please try again.');
          handleRemoteDisconnect();
        } else if (err.type === 'browser-incompatible') {
          setError('Your browser is not fully compatible with WebRTC.');
          setStatus(ConnectionStatus.ERROR);
        }
      });

      peer.on('disconnected', () => {
        // Try to reconnect to PeerServer if strictly disconnected
        if (peerRef.current && !peerRef.current.destroyed) {
          console.log('Attempting to reconnect to PeerServer...');
          try {
            peerRef.current.reconnect();
          } catch (e) {
            console.error('Failed to reconnect:', e);
          }
        }
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
        peerRef.current = null;
        myPeerIdRef.current = null;
      });
    });
  }, []);

  // 3. Handle Active Call (Media) - Fixed stale closure issue
  const handleCall = useCallback((call: MediaConnection) => {
    // Cleanup previous call if exists
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }
    currentCallRef.current = call;

    // Safety timeout: If connection doesn't technically "open" or stream doesn't arrive in time
    // Using ref to avoid stale closure
    const streamTimeout = setTimeout(() => {
      if (statusRef.current === ConnectionStatus.CONNECTING) {
        console.log("Stream handshake timed out.");
        call.close();
        skipToNextInternal();
      }
    }, STREAM_HANDSHAKE_TIMEOUT);

    call.on('stream', (remoteStream) => {
      clearTimeout(streamTimeout);
      setRemoteStream(remoteStream);
      setStatus(ConnectionStatus.CONNECTED);
      setCallStartTime(Date.now());
      setIsRemoteAudioEnabled(true); // Reset remote audio mute state on new call
      setError(null); // Clear any previous errors
    });

    call.on('close', () => {
      clearTimeout(streamTimeout);
      handleRemoteDisconnect();
    });

    call.on('error', (e) => {
      clearTimeout(streamTimeout);
      console.error("Call error", e);
      setError('Call connection failed. Trying next peer...');
      handleRemoteDisconnect();
    });
  }, []);

  // Internal skip function without dependency on startSearch (avoids circular dep)
  const skipToNextInternal = useCallback(() => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'system',
        text: 'Connection failed. Searching for next peer...',
        timestamp: Date.now()
      }]);
    }
    // Cleanup and restart will be handled by startSearch
  }, []);

  // 4. Handle Data Connection (Chat & Stats) - Added open check
  const handleDataConnection = useCallback((conn: DataConnection) => {
    if (dataConnRef.current) {
      dataConnRef.current.close();
    }
    dataConnRef.current = conn;

    conn.on('data', (data: unknown) => {
      // Type guard for incoming data
      if (!data || typeof data !== 'object') return;

      const payload = data as { type?: string; text?: string; timestamp?: number };

      // Chat Messages
      if (payload.type === 'chat' && typeof payload.text === 'string') {
        // Basic XSS prevention (React handles this, but defense in depth)
        const sanitizedText = payload.text.slice(0, 1000); // Limit message length
        addMessage(sanitizedText, 'stranger');
      }

      // Latency Ping/Pong
      if (payload.type === 'ping' && typeof payload.timestamp === 'number') {
        if (conn.open) {
          conn.send({ type: 'pong', timestamp: payload.timestamp });
        }
      }
      if (payload.type === 'pong' && typeof payload.timestamp === 'number') {
        const rtt = Date.now() - payload.timestamp;
        if (rtt >= 0 && rtt < 60000) { // Sanity check
          setLatency(rtt);
        }
      }
    });

    conn.on('open', () => {
      // Start Ping Loop
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (conn.open) {
          conn.send({ type: 'ping', timestamp: Date.now() });
        }
      }, 2000);
    });

    conn.on('close', () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      setLatency(null);
    });

    conn.on('error', (err) => {
      console.log("Data connection error:", err);
    });
  }, []);

  const handleRemoteDisconnect = useCallback(() => {
    setRemoteStream(null);
    setCallStartTime(null);
    setLatency(null);
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (statusRef.current === ConnectionStatus.CONNECTED) {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        sender: 'system',
        text: 'Stranger disconnected.',
        timestamp: Date.now()
      }]);
    }

    currentCallRef.current = null;
    dataConnRef.current = null;

    // Stop status is IDLE, user must click Next to find someone else
    setStatus(ConnectionStatus.IDLE);
  }, []);

  // 5. Matchmaking Logic via MQTT - Added error handling and reconnection
  const startSearch = useCallback(async () => {
    // Clear any previous errors
    setError(null);

    // Cleanup previous state
    if (currentCallRef.current) currentCallRef.current.close();
    if (dataConnRef.current) dataConnRef.current.close();
    clearAllTimers();

    setRemoteStream(null);
    setMessages([]);
    setCallStartTime(null);
    setLatency(null);
    ignoreRemoteIdsRef.current.clear();
    mqttReconnectAttempts.current = 0;

    // Ensure Media
    if (!localStreamRef.current) {
      const stream = await initLocalStream();
      if (!stream) return; // Error handled in initLocalStream
    }

    // Ensure Peer
    try {
      if (!peerRef.current || peerRef.current.destroyed || !myPeerIdRef.current) {
        await initPeer();
      }
    } catch (err) {
      console.error('Failed to initialize peer:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize connection');
      setStatus(ConnectionStatus.ERROR);
      return;
    }

    setStatus(ConnectionStatus.SEARCHING);

    // Connect to MQTT Public Broker
    if (mqttClientRef.current) {
      mqttClientRef.current.end(true);
      mqttClientRef.current = null;
    }

    const connectMQTT = () => {
      const client = mqtt.connect(MQTT_BROKER_URL, {
        reconnectPeriod: 0, // We handle reconnection manually
        connectTimeout: 10000
      });
      mqttClientRef.current = client;

      client.on('connect', () => {
        console.log('Connected to Signaling Broker');
        mqttReconnectAttempts.current = 0;
        client.subscribe(TOPIC_LOBBY, (err) => {
          if (err) {
            console.error('Failed to subscribe to lobby:', err);
            setError('Failed to join matchmaking. Retrying...');
          }
        });

        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        const publishPresence = () => {
          if (myPeerIdRef.current && peerRef.current && !peerRef.current.disconnected) {
            const payload = JSON.stringify({
              peerId: myPeerIdRef.current,
              timestamp: Date.now()
            });
            client.publish(TOPIC_LOBBY, payload, { qos: 0 });
          }
        };

        publishPresence();
        heartbeatIntervalRef.current = setInterval(publishPresence, 1200);
      });

      client.on('error', (err) => {
        console.error('MQTT error:', err);
        mqttReconnectAttempts.current++;

        if (mqttReconnectAttempts.current < MQTT_RECONNECT_ATTEMPTS) {
          console.log(`Retrying MQTT connection (${mqttReconnectAttempts.current}/${MQTT_RECONNECT_ATTEMPTS})...`);
          setTimeout(connectMQTT, 2000);
        } else {
          setError('Could not connect to matchmaking server. Please try again later.');
          setStatus(ConnectionStatus.ERROR);
        }
      });

      client.on('offline', () => {
        console.log('MQTT went offline');
        if (statusRef.current === ConnectionStatus.SEARCHING) {
          setError('Lost connection to matchmaking. Reconnecting...');
        }
      });

      client.on('message', (topic, message) => {
        if (topic === TOPIC_LOBBY) {
          try {
            const data = JSON.parse(message.toString());
            const remotePeerId = data.peerId;
            const myId = myPeerIdRef.current;
            const timestamp = data.timestamp;

            // Validate data
            if (!remotePeerId || typeof remotePeerId !== 'string') return;
            if (!myId || remotePeerId === myId) return;
            if (typeof timestamp !== 'number') return;

            // Ignore stale signals (> 2000ms old) to prevent connecting to ghosts
            if (Date.now() - timestamp > 2000) return;

            // Ignore explicitly ignored IDs (people we just skipped or failed to connect to)
            if (ignoreRemoteIdsRef.current.has(remotePeerId)) return;

            // Deterministic Matchmaking: Higher ID calls Lower ID
            if (myId > remotePeerId) {
              console.log(`Match found! I (${myId}) am calling (${remotePeerId})`);
              initiateConnection(remotePeerId);
            }
          } catch (e) {
            // ignore malformed JSON
          }
        }
      });
    };

    connectMQTT();

  }, [initLocalStream, initPeer, clearAllTimers]);

  const initiateConnection = useCallback((remotePeerId: string) => {
    stopMatchmakingSignaling();
    setStatus(ConnectionStatus.CONNECTING);
    ignoreRemoteIdsRef.current.add(remotePeerId); // Don't try this person again immediately

    if (peerRef.current && localStreamRef.current) {
      try {
        const call = peerRef.current.call(remotePeerId, localStreamRef.current);
        if (!call) {
          throw new Error('Failed to create call');
        }
        handleCall(call);

        const conn = peerRef.current.connect(remotePeerId, { reliable: true });
        if (conn) {
          handleDataConnection(conn);
        }

        // Fail-safe: If connection stuck in "CONNECTING" for 8s, abort and retry
        connectionTimeoutRef.current = setTimeout(() => {
          console.log("Connection attempt timed out. Skipping to next.");
          if (call) call.close();
          if (conn) conn.close();
          skipToNext();
        }, CONNECTION_ATTEMPT_TIMEOUT);

      } catch (err) {
        console.error("Failed to initiate connection", err);
        setError('Failed to connect to peer. Trying next...');
        skipToNext();
      }
    }
  }, [handleCall, handleDataConnection]);

  const stopMatchmakingSignaling = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (mqttClientRef.current) {
      mqttClientRef.current.end(true);
      mqttClientRef.current = null;
    }
  }, []);

  const stopSearch = useCallback(() => {
    stopMatchmakingSignaling();
    if (currentCallRef.current) currentCallRef.current.close();
    if (dataConnRef.current) dataConnRef.current.close();
    clearAllTimers();

    setStatus(ConnectionStatus.IDLE);
    setRemoteStream(null);
    setCallStartTime(null);
    setLatency(null);
    setError(null);
  }, [stopMatchmakingSignaling, clearAllTimers]);

  const endCall = useCallback(() => {
    stopSearch();
  }, [stopSearch]);

  const skipToNext = useCallback(() => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'system',
        text: 'Skipped to next person.',
        timestamp: Date.now()
      }]);
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
    }
    // Clear timeout to prevent double-skip
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    // Small delay to ensure sockets clear
    setTimeout(() => startSearch(), 150);
  }, [startSearch]);

  // Rate-limited message sending (max 5 messages per second)
  const lastMessageTime = useRef(0);
  const messageCount = useRef(0);

  const sendMessage = useCallback((text: string) => {
    const now = Date.now();

    // Rate limiting: Reset counter every second
    if (now - lastMessageTime.current > 1000) {
      messageCount.current = 0;
      lastMessageTime.current = now;
    }

    // Max 5 messages per second
    if (messageCount.current >= 5) {
      setError('Slow down! Too many messages.');
      return;
    }

    if (dataConnRef.current && dataConnRef.current.open && text.trim()) {
      const sanitizedText = text.trim().slice(0, 1000); // Limit message length
      const msg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'me',
        text: sanitizedText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);

      try {
        dataConnRef.current.send({ type: 'chat', text: sanitizedText });
        messageCount.current++;
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('Failed to send message. Connection may be lost.');
      }
    }
  }, []);

  const addMessage = useCallback((text: string, sender: 'me' | 'stranger' | 'system') => {
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: Date.now()
    }]);
  }, []);

  // Cleanup on unmount (Window close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopMatchmakingSignaling();
      if (peerRef.current) peerRef.current.destroy();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopMatchmakingSignaling();
      clearAllTimers();
      if (peerRef.current) peerRef.current.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopMatchmakingSignaling, clearAllTimers]);

  return {
    status,
    localStream,
    remoteStream,
    messages,
    error,
    isVideoEnabled,
    isAudioEnabled,
    isRemoteAudioEnabled,
    isInitializing,
    latency,
    callStartTime,
    startSearch,
    stopSearch,
    endCall,
    skipToNext,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio
  };
};
