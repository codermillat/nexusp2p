import React, { useState } from 'react';
import { useChatConnection } from './hooks/useChatConnection';
import VideoStage from './components/VideoStage';
import ChatBox from './components/ChatBox';
import Button from './components/Button';
import ErrorBoundary from './components/ErrorBoundary';
import { ConnectionStatus } from './types';
import { Video, VideoOff, Mic, MicOff, Network, AlertCircle, SkipForward, Square, Info, Volume2, VolumeX, PhoneOff, Loader2, X, Camera, MessageCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    status,
    localStream,
    remoteStream,
    messages,
    initializeMedia,
    startSearch,
    stopSearch,
    endCall,
    skipToNext,
    sendMessage,
    toggleVideo,
    toggleAudio,
    toggleRemoteAudio,
    isVideoEnabled,
    isAudioEnabled,
    isRemoteAudioEnabled,
    isInitializing,
    latency,
    callStartTime,
    error
  } = useChatConnection();

  const [errorVisible, setErrorVisible] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  React.useEffect(() => {
    if (error) {
      setErrorVisible(true);
    }
  }, [error]);

  // Count unread messages when chat is closed
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const unreadCount = isMobileChatOpen ? 0 : messages.length - lastSeenCount;

  const openMobileChat = () => {
    setIsMobileChatOpen(true);
    setLastSeenCount(messages.length);
  };

  const closeMobileChat = () => {
    setIsMobileChatOpen(false);
    setLastSeenCount(messages.length);
  };

  const dismissError = () => {
    setErrorVisible(false);
  };

  const handlePreviewCamera = async () => {
    await initializeMedia();
  };

  const handleMainAction = () => {
    if (status === ConnectionStatus.IDLE || status === ConnectionStatus.ERROR) {
      startSearch();
    } else if (status === ConnectionStatus.SEARCHING) {
      stopSearch();
    } else if (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING) {
      skipToNext();
    }
  };

  const handleStop = () => {
    stopSearch();
  };

  const handleEndCall = () => {
    endCall();
  };

  const isConnected = status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING;
  const isSearching = status === ConnectionStatus.SEARCHING;
  const isIdle = status === ConnectionStatus.IDLE || status === ConnectionStatus.ERROR;
  const isCallActive = status === ConnectionStatus.CONNECTED;
  const hasLocalStream = !!localStream;

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden">

      {/* Compact Header */}
      <header className="flex justify-between items-center py-2 px-3 md:py-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 rounded-full"></div>
            <div className="relative bg-slate-900 border border-white/10 p-1.5 md:p-2 rounded-xl">
              <Network className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-1">
              Nexus<span className="text-indigo-400">P2P</span>
            </h1>
            <p className="text-[8px] md:text-[10px] text-slate-400 font-mono uppercase tracking-wider hidden sm:block">Distributed Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Chat Button */}
          <button
            onClick={openMobileChat}
            className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-white/10 transition-all"
            aria-label="Open chat"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full border text-[10px] md:text-xs font-mono ${status === ConnectionStatus.CONNECTED ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            status === ConnectionStatus.SEARCHING ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
              status === ConnectionStatus.CONNECTING ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' :
                status === ConnectionStatus.ERROR ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                  'bg-slate-800 border-white/5 text-slate-400'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
              status === ConnectionStatus.SEARCHING ? 'bg-amber-500 animate-pulse' :
                status === ConnectionStatus.CONNECTING ? 'bg-blue-500 animate-pulse' :
                  status === ConnectionStatus.ERROR ? 'bg-red-500' :
                    'bg-slate-600'
              }`} />
            <span className="uppercase">{status}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 px-2 md:px-6 min-h-0 overflow-hidden">

        {/* Video Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden">

          {/* Video Stage */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <VideoStage
              localStream={localStream}
              remoteStream={remoteStream}
              status={status}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              isRemoteAudioEnabled={isRemoteAudioEnabled}
              latency={latency}
              callStartTime={callStartTime}
            />

            {/* Error Toast */}
            {error && errorVisible && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-950/90 text-red-200 border border-red-500/20 px-3 py-2 rounded-lg shadow-xl z-50 backdrop-blur-md max-w-[90%]">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs font-medium truncate">{error}</span>
                <button
                  onClick={dismissError}
                  className="p-0.5 hover:bg-red-500/20 rounded-full transition-colors shrink-0"
                  aria-label="Dismiss error"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            )}

            {/* Loading Overlay */}
            {isInitializing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-40">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <p className="text-slate-300 text-xs font-medium">Accessing camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="shrink-0 p-2 md:p-3 bg-slate-900/50 border-t border-white/5">

            {/* Compact Disclaimer for Idle */}
            {isIdle && (
              <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] md:text-xs text-indigo-200/70">
                <Info className="w-3 h-3 shrink-0 text-indigo-400" />
                <p className="line-clamp-2">
                  <strong className="text-indigo-300">18+:</strong> Direct P2P connection. Your IP is visible to peers. Unmoderated.
                </p>
              </div>
            )}

            <div className="flex justify-center items-center gap-2 md:gap-4">
              {/* Media Controls */}
              <div className="flex gap-1.5 md:gap-2">
                {!hasLocalStream && isIdle && (
                  <button
                    onClick={handlePreviewCamera}
                    disabled={isInitializing}
                    className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/20"
                    title="Preview Camera"
                    aria-label="Preview Camera"
                  >
                    <Camera className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}

                <button
                  onClick={toggleVideo}
                  className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all ${isVideoEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-white/10'
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/20'
                    }`}
                  title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                  aria-label={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all ${isAudioEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-white/10'
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/20'
                    }`}
                  title={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
                  aria-label={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
                </button>

                {isCallActive && (
                  <button
                    onClick={toggleRemoteAudio}
                    className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all ${isRemoteAudioEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-white/10'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/20'
                      }`}
                    title={isRemoteAudioEnabled ? "Mute Remote" : "Unmute Remote"}
                    aria-label={isRemoteAudioEnabled ? "Mute Remote" : "Unmute Remote"}
                  >
                    {isRemoteAudioEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                )}
              </div>

              {/* Main Actions */}
              <div className="flex gap-1.5 md:gap-2">
                {isSearching && (
                  <Button
                    onClick={handleStop}
                    variant="secondary"
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 px-3"
                  >
                    <Square className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" />
                    <span className="hidden sm:inline ml-1.5">Stop</span>
                  </Button>
                )}

                {isCallActive && (
                  <Button
                    onClick={handleEndCall}
                    variant="danger"
                    size="sm"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    aria-label="End call"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  size="md"
                  onClick={handleMainAction}
                  disabled={isInitializing}
                  className={`px-4 md:px-6 font-semibold text-sm md:text-base ${isConnected
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/30'
                    }`}
                >
                  {isInitializing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {isIdle && !isInitializing && 'Start'}
                  {isInitializing && 'Wait...'}
                  {isSearching && 'Scanning...'}
                  {isConnected && (
                    <span className="flex items-center">
                      <SkipForward className="w-4 h-4 mr-1" /> Next
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar - Desktop only */}
        <div className="hidden md:flex w-80 lg:w-96 shrink-0 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
          <ChatBox
            messages={messages}
            onSendMessage={sendMessage}
            status={status}
          />
        </div>
      </main>

      {/* Minimal Footer - Desktop only */}
      <footer className="hidden md:block py-2 text-center shrink-0">
        <div className="flex justify-center items-center gap-4 text-xs">
          <span className="text-slate-600">NexusP2P © {new Date().getFullYear()}</span>
          <span className="text-slate-700">·</span>
          <a href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">Privacy</a>
          <a href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">Terms</a>
          <a href="/about" className="text-slate-500 hover:text-slate-300 transition-colors">About</a>
        </div>
      </footer>

      {/* Mobile Chat Overlay */}
      {isMobileChatOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-lg">
          {/* Mobile Chat Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Chat</h2>
              {status === ConnectionStatus.CONNECTED && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Live</span>
              )}
            </div>
            <button
              onClick={closeMobileChat}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-white/10"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 min-h-0">
            <ChatBox
              messages={messages}
              onSendMessage={sendMessage}
              status={status}
            />
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[128px]"></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
