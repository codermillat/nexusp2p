import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import mqtt from 'mqtt';
import { ConnectionStatus, ChatMessage } from '../types';
import {
  MQTT_CONFIG,
  TIMEOUT_CONFIG,
  MEDIA_CONFIG,
  CHAT_CONFIG,
  DEBUG_MODE,
  getIceConfig,
  FALLBACK_ICE_CONFIG
} from '../config';

// Destructure config values
const { brokerUrl: MQTT_BROKER_URL, lobbyTopic: TOPIC_LOBBY, reconnectAttempts: MQTT_RECONNECT_ATTEMPTS } = MQTT_CONFIG;
const { peerInit: PEER_INIT_TIMEOUT, streamHandshake: STREAM_HANDSHAKE_TIMEOUT, connectionAttempt: CONNECTION_ATTEMPT_TIMEOUT } = TIMEOUT_CONFIG;

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
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreRemoteIdsRef = useRef<Set<string>>(new Set());
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ConnectionStatus>(ConnectionStatus.IDLE);
  const mqttReconnectAttempts = useRef(0);
  const isSearchingRef = useRef(false);
  const autoReconnectRef = useRef(true); // Track if we should auto-reconnect on disconnect

  // Track desired video/audio state
  const desiredVideoEnabledRef = useRef(true);
  const desiredAudioEnabledRef = useRef(true);

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
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Initialize media WITHOUT starting search
  const initializeMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const browserCheck = checkBrowserSupport();
    if (!browserCheck.supported) {
      setError(browserCheck.error || 'Browser not supported');
      return null;
    }

    setIsInitializing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: MEDIA_CONFIG.video,
        audio: MEDIA_CONFIG.audio
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      stream.getVideoTracks().forEach((track) => {
        track.enabled = desiredVideoEnabledRef.current;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = desiredAudioEnabledRef.current;
      });

      setIsVideoEnabled(desiredVideoEnabledRef.current);
      setIsAudioEnabled(desiredAudioEnabledRef.current);
      setError(null);

      return stream;
    } catch (err: unknown) {
      console.error("Failed to get media", err);

      let errorMessage = "Could not access camera/microphone.";

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Camera/microphone permission denied. Please allow access.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = "No camera or microphone found.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = "Camera/microphone is in use by another app.";
        }
      }

      setError(errorMessage);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    desiredVideoEnabledRef.current = !desiredVideoEnabledRef.current;
    setIsVideoEnabled(desiredVideoEnabledRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = desiredVideoEnabledRef.current;
      });
    }
  }, []);

  const toggleAudio = useCallback(() => {
    desiredAudioEnabledRef.current = !desiredAudioEnabledRef.current;
    setIsAudioEnabled(desiredAudioEnabledRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = desiredAudioEnabledRef.current;
      });
    }
  }, []);

  const toggleRemoteAudio = useCallback(() => {
    setIsRemoteAudioEnabled((prev) => !prev);
  }, []);

  // Stop MQTT matchmaking
  const stopMatchmakingSignaling = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (mqttClientRef.current) {
      try {
        mqttClientRef.current.end(true);
      } catch (e) {
        // ignore
      }
      mqttClientRef.current = null;
    }
  }, []);

  // Send a signal to remote peer (skip, disconnect, etc.)
  const sendSignal = useCallback((signalType: 'skip' | 'disconnect' | 'end') => {
    if (dataConnRef.current && dataConnRef.current.open) {
      try {
        dataConnRef.current.send({ type: 'signal', signal: signalType });
      } catch (e) {
        console.log('Failed to send signal:', e);
      }
    }
  }, []);

  // Initialize PeerJS with dynamic TURN credentials
  const initPeer = useCallback(async () => {
    return new Promise<string>(async (resolve, reject) => {
      if (peerRef.current && !peerRef.current.destroyed && peerRef.current.id) {
        resolve(peerRef.current.id);
        return;
      }

      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (e) { }
        peerRef.current = null;
      }

      const initTimeout = setTimeout(() => {
        reject(new Error('Connection timed out. Check your network.'));
      }, PEER_INIT_TIMEOUT);

      // Fetch dynamic TURN credentials
      let iceConfig;
      try {
        iceConfig = await getIceConfig();
        console.log('🔐 Using dynamic TURN credentials');
      } catch (e) {
        console.warn('⚠️ Using fallback ICE config');
        iceConfig = FALLBACK_ICE_CONFIG;
      }

      const peerConfig = {
        config: iceConfig,
        debug: DEBUG_MODE ? 2 : 0,
      };

      let peer: Peer;

      try {
        peer = new Peer(peerConfig);
      } catch (err) {
        clearTimeout(initTimeout);
        reject(new Error('Failed to create connection'));
        return;
      }

      let resolved = false;

      peer.on('open', (id) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(initTimeout);
        console.log('My Peer ID:', id);
        myPeerIdRef.current = id;
        peerRef.current = peer;
        resolve(id);
      });

      peer.on('call', (call) => {
        if (!isSearchingRef.current) {
          console.log("Not searching, rejecting call from:", call.peer);
          call.close();
          return;
        }

        if (currentCallRef.current && currentCallRef.current.open) {
          console.log("Busy, rejecting call from:", call.peer);
          call.close();
          return;
        }

        if (localStreamRef.current) {
          console.log("Receiving call from:", call.peer);

          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }

          stopMatchmakingSignaling();
          isSearchingRef.current = false;
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

        if (!resolved) {
          resolved = true;
          clearTimeout(initTimeout);
          reject(new Error(`Connection error: ${err.type || 'unknown'}`));
          return;
        }

        if (err.type === 'peer-unavailable') {
          console.log('Peer unavailable');
        } else if (err.type === 'network' || err.type === 'disconnected' || err.type === 'server-error') {
          setError('Network connection lost.');
          handleRemoteDisconnect(true); // Auto reconnect
        }
      });

      peer.on('disconnected', () => {
        if (peerRef.current && !peerRef.current.destroyed) {
          console.log('Reconnecting to server...');
          try {
            peerRef.current.reconnect();
          } catch (e) {
            console.error('Reconnect failed:', e);
          }
        }
      });

      peer.on('close', () => {
        console.log('Peer closed');
        peerRef.current = null;
        myPeerIdRef.current = null;
      });
    });
  }, [stopMatchmakingSignaling]);

  // Handle Active Call (Media)
  const handleCall = useCallback((call: MediaConnection) => {
    if (currentCallRef.current && currentCallRef.current !== call) {
      currentCallRef.current.close();
    }
    currentCallRef.current = call;

    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
    }

    // Access the underlying RTCPeerConnection for ICE monitoring
    const peerConnection = (call as any).peerConnection as RTCPeerConnection | undefined;

    if (peerConnection && DEBUG_MODE) {
      console.log('📡 ICE Connection monitoring enabled');

      // Monitor ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        console.log('🔗 ICE Connection State:', peerConnection.iceConnectionState);

        if (peerConnection.iceConnectionState === 'failed') {
          console.error('❌ ICE Connection Failed - TURN server may be required');
          setError('Connection failed. Trying relay...');
        }

        if (peerConnection.iceConnectionState === 'disconnected') {
          console.log('⚠️ ICE Disconnected - attempting recovery');
        }

        if (peerConnection.iceConnectionState === 'connected') {
          console.log('✅ ICE Connected successfully');
        }
      };

      // Monitor ICE gathering state
      peerConnection.onicegatheringstatechange = () => {
        console.log('📥 ICE Gathering State:', peerConnection.iceGatheringState);
      };

      // Monitor ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateType = event.candidate.type; // 'host', 'srflx', 'relay'
          console.log(`🎯 ICE Candidate: ${candidateType}`, event.candidate.address || '');

          if (candidateType === 'relay') {
            console.log('✅ TURN relay candidate found - cross-network should work');
          }
        }
      };

      // Monitor signaling state
      peerConnection.onsignalingstatechange = () => {
        console.log('📶 Signaling State:', peerConnection.signalingState);
      };
    }

    streamTimeoutRef.current = setTimeout(() => {
      if (statusRef.current === ConnectionStatus.CONNECTING) {
        console.log("Stream handshake timed out.");

        // Log ICE state on timeout for debugging
        if (peerConnection && DEBUG_MODE) {
          console.log('⏰ Timeout ICE State:', peerConnection.iceConnectionState);
          console.log('⏰ Timeout Gathering State:', peerConnection.iceGatheringState);
        }

        call.close();
        if (isSearchingRef.current || statusRef.current === ConnectionStatus.CONNECTING) {
          handleRemoteDisconnect(true);
        }
      }
    }, STREAM_HANDSHAKE_TIMEOUT);

    call.on('stream', (stream) => {
      console.log("✅ Received remote stream");
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      setRemoteStream(stream);
      setStatus(ConnectionStatus.CONNECTED);
      setCallStartTime(Date.now());
      setIsRemoteAudioEnabled(true);
      setError(null);
      autoReconnectRef.current = true; // Enable auto-reconnect when connected
    });

    call.on('close', () => {
      console.log("Call closed");
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
      if (currentCallRef.current === call) {
        // Auto-reconnect when call closes (unless we manually stopped)
        handleRemoteDisconnect(autoReconnectRef.current);
      }
    });

    call.on('error', (e) => {
      console.error("Call error", e);
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
      if (currentCallRef.current === call) {
        setError('Call failed.');
        handleRemoteDisconnect(true);
      }
    });
  }, []);

  // Handle Data Connection (Chat & Stats & Signals)
  const handleDataConnection = useCallback((conn: DataConnection) => {
    if (dataConnRef.current && dataConnRef.current !== conn) {
      dataConnRef.current.close();
    }
    dataConnRef.current = conn;

    conn.on('data', (data: unknown) => {
      if (!data || typeof data !== 'object') return;

      const payload = data as { type?: string; text?: string; timestamp?: number; signal?: string };

      // Handle signals from remote peer
      if (payload.type === 'signal') {
        if (payload.signal === 'skip' || payload.signal === 'disconnect') {
          // Remote peer skipped or disconnected - auto search for next
          console.log('Remote peer signaled:', payload.signal);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'system',
            text: payload.signal === 'skip' ? 'Stranger skipped. Finding next...' : 'Stranger disconnected. Finding next...',
            timestamp: Date.now()
          }]);
          // Force reconnect
          handleRemoteDisconnect(true);
          return;
        }
        if (payload.signal === 'end') {
          // Remote peer ended the call - go to idle
          console.log('Remote peer ended call');
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'system',
            text: 'Stranger ended the call.',
            timestamp: Date.now()
          }]);
          handleRemoteDisconnect(false);
          return;
        }
      }

      // Chat Messages
      if (payload.type === 'chat' && typeof payload.text === 'string') {
        const sanitizedText = payload.text.slice(0, 1000);
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
        if (rtt >= 0 && rtt < 60000) {
          setLatency(rtt);
        }
      }
    });

    conn.on('open', () => {
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

  // Handle remote disconnect - with option to auto-reconnect
  const handleRemoteDisconnect = useCallback((shouldAutoReconnect: boolean = false) => {
    console.log('handleRemoteDisconnect, autoReconnect:', shouldAutoReconnect);

    // Clean up current connection
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }

    setRemoteStream(null);
    setCallStartTime(null);
    setLatency(null);

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    clearAllTimers();

    if (shouldAutoReconnect && localStreamRef.current) {
      // Auto-reconnect: go directly to searching
      console.log('Auto-reconnecting...');
      setStatus(ConnectionStatus.SEARCHING);
      // Small delay then start search
      setTimeout(() => {
        startSearchInternal();
      }, 300);
    } else {
      // Go to idle
      isSearchingRef.current = false;
      setStatus(ConnectionStatus.IDLE);
    }
  }, [clearAllTimers]);

  // Internal search function (used for auto-reconnect)
  const startSearchInternal = useCallback(() => {
    if (!localStreamRef.current) return;
    if (!peerRef.current || peerRef.current.destroyed || !myPeerIdRef.current) return;

    ignoreRemoteIdsRef.current.clear();
    mqttReconnectAttempts.current = 0;
    isSearchingRef.current = true;
    autoReconnectRef.current = true;
    setStatus(ConnectionStatus.SEARCHING);

    const connectMQTT = () => {
      if (!isSearchingRef.current) return;

      const client = mqtt.connect(MQTT_BROKER_URL, {
        reconnectPeriod: 0,
        connectTimeout: 10000,
        keepalive: 30
      });
      mqttClientRef.current = client;

      client.on('connect', () => {
        console.log('Connected to Signaling Broker');
        mqttReconnectAttempts.current = 0;

        client.subscribe(TOPIC_LOBBY, { qos: 0 }, (err) => {
          if (err) {
            console.error('Subscribe failed:', err);
          }
        });

        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        const publishPresence = () => {
          if (!isSearchingRef.current) return;
          if (myPeerIdRef.current && peerRef.current && !peerRef.current.disconnected) {
            const payload = JSON.stringify({
              peerId: myPeerIdRef.current,
              timestamp: Date.now()
            });
            client.publish(TOPIC_LOBBY, payload, { qos: 0 });
          }
        };

        publishPresence();
        heartbeatIntervalRef.current = setInterval(publishPresence, 1500);
      });

      client.on('error', (err) => {
        console.error('MQTT error:', err);
        mqttReconnectAttempts.current++;

        if (mqttReconnectAttempts.current < MQTT_RECONNECT_ATTEMPTS && isSearchingRef.current) {
          setTimeout(connectMQTT, 2000);
        } else if (isSearchingRef.current) {
          setError('Matchmaking failed. Try again.');
          setStatus(ConnectionStatus.ERROR);
          isSearchingRef.current = false;
        }
      });

      client.on('message', (topic, message) => {
        if (!isSearchingRef.current) return;
        if (topic !== TOPIC_LOBBY) return;

        try {
          const data = JSON.parse(message.toString());
          const remotePeerId = data.peerId;
          const myId = myPeerIdRef.current;
          const timestamp = data.timestamp;

          if (!remotePeerId || typeof remotePeerId !== 'string') return;
          if (!myId || remotePeerId === myId) return;
          if (typeof timestamp !== 'number') return;
          if (Date.now() - timestamp > 3000) return;
          if (ignoreRemoteIdsRef.current.has(remotePeerId)) return;

          if (myId > remotePeerId) {
            console.log(`Match found! Calling ${remotePeerId}`);
            initiateConnection(remotePeerId);
          }
        } catch (e) { }
      });
    };

    connectMQTT();
  }, []);

  // Main startSearch (called from UI)
  const startSearch = useCallback(async () => {
    setError(null);

    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }
    clearAllTimers();
    stopMatchmakingSignaling();

    setRemoteStream(null);
    setMessages([]);
    setCallStartTime(null);
    setLatency(null);

    if (!localStreamRef.current) {
      const stream = await initializeMedia();
      if (!stream) {
        setStatus(ConnectionStatus.ERROR);
        return;
      }
    }

    try {
      if (!peerRef.current || peerRef.current.destroyed || !myPeerIdRef.current) {
        await initPeer();
      }
    } catch (err) {
      console.error('Peer init failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus(ConnectionStatus.ERROR);
      return;
    }

    startSearchInternal();

  }, [initializeMedia, initPeer, clearAllTimers, stopMatchmakingSignaling, startSearchInternal]);

  const initiateConnection = useCallback((remotePeerId: string) => {
    if (!isSearchingRef.current) return;

    stopMatchmakingSignaling();
    isSearchingRef.current = false;
    setStatus(ConnectionStatus.CONNECTING);
    ignoreRemoteIdsRef.current.add(remotePeerId);

    if (peerRef.current && localStreamRef.current) {
      try {
        const call = peerRef.current.call(remotePeerId, localStreamRef.current);
        if (!call) {
          throw new Error('Call failed');
        }
        handleCall(call);

        const conn = peerRef.current.connect(remotePeerId, { reliable: true });
        if (conn) {
          handleDataConnection(conn);
        }

        connectionTimeoutRef.current = setTimeout(() => {
          if (statusRef.current === ConnectionStatus.CONNECTING) {
            console.log("Connection timed out");
            if (call) call.close();
            if (conn) conn.close();
            currentCallRef.current = null;
            dataConnRef.current = null;
            handleRemoteDisconnect(true); // Auto retry
          }
        }, CONNECTION_ATTEMPT_TIMEOUT);

      } catch (err) {
        console.error("Connection failed:", err);
        setError('Connection failed. Retrying...');
        handleRemoteDisconnect(true);
      }
    }
  }, [handleCall, handleDataConnection, stopMatchmakingSignaling, handleRemoteDisconnect]);

  // Stop search completely (go to idle, no auto-reconnect)
  const stopSearch = useCallback(() => {
    autoReconnectRef.current = false;
    isSearchingRef.current = false;
    stopMatchmakingSignaling();

    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }
    clearAllTimers();

    setStatus(ConnectionStatus.IDLE);
    setRemoteStream(null);
    setCallStartTime(null);
    setLatency(null);
    setError(null);
  }, [stopMatchmakingSignaling, clearAllTimers]);

  // End call - notify remote, then go to idle
  const endCall = useCallback(() => {
    // Send end signal to remote before disconnecting
    sendSignal('end');
    autoReconnectRef.current = false;

    // Small delay to ensure signal is sent
    setTimeout(() => {
      stopSearch();
    }, 100);
  }, [stopSearch, sendSignal]);

  // Skip to next - notify remote (they will also search), then search for new peer
  const skipToNext = useCallback(() => {
    // Send skip signal to remote - they will also start searching
    sendSignal('skip');

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'system',
      text: 'Skipped. Finding next...',
      timestamp: Date.now()
    }]);

    // Close current connections
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }

    clearAllTimers();
    setRemoteStream(null);
    setLatency(null);
    setCallStartTime(null);

    // Start searching for next peer
    setTimeout(() => {
      startSearchInternal();
    }, 200);
  }, [clearAllTimers, startSearchInternal, sendSignal]);

  // Rate-limited message sending
  const lastMessageTime = useRef(0);
  const messageCount = useRef(0);

  const sendMessage = useCallback((text: string) => {
    const now = Date.now();

    if (now - lastMessageTime.current > 1000) {
      messageCount.current = 0;
      lastMessageTime.current = now;
    }

    if (messageCount.current >= 5) {
      setError('Too many messages!');
      return;
    }

    if (dataConnRef.current && dataConnRef.current.open && text.trim()) {
      const sanitizedText = text.trim().slice(0, 1000);
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
        setError('Message failed.');
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

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendSignal('disconnect');
      isSearchingRef.current = false;
      stopMatchmakingSignaling();
      if (peerRef.current) peerRef.current.destroy();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendSignal('disconnect');
      isSearchingRef.current = false;
      stopMatchmakingSignaling();
      clearAllTimers();
      if (peerRef.current) peerRef.current.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopMatchmakingSignaling, clearAllTimers, sendSignal]);

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
    initializeMedia,
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
