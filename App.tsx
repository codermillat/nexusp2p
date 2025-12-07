import React from 'react';
import { useChatConnection } from './hooks/useChatConnection';
import VideoStage from './components/VideoStage';
import ChatBox from './components/ChatBox';
import Button from './components/Button';
import ErrorBoundary from './components/ErrorBoundary';
import { ConnectionStatus } from './types';
import { Video, VideoOff, Mic, MicOff, Network, AlertCircle, SkipForward, Square, Info, Volume2, VolumeX, PhoneOff, Loader2, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    status,
    localStream,
    remoteStream,
    messages,
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

  const [errorVisible, setErrorVisible] = React.useState(false);

  // Show error toast when error changes
  React.useEffect(() => {
    if (error) {
      setErrorVisible(true);
    }
  }, [error]);

  const dismissError = () => {
    setErrorVisible(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">

      <div className="flex flex-col h-screen md:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center py-4 px-4 md:px-0 mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 rounded-full"></div>
              <div className="relative bg-slate-900 border border-white/10 p-2 rounded-xl">
                <Network className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Nexus<span className="text-indigo-400">P2P</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Distributed Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${status === ConnectionStatus.CONNECTED ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
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
              <span>{status}</span>
            </div>
          </div>
        </header>

        {/* Main Interface */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 relative">

          {/* Video Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 border border-white/5 rounded-3xl p-1 md:p-2 shadow-2xl backdrop-blur-sm relative">
            <div className="flex-1 relative rounded-2xl overflow-hidden">
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

              {/* Error Toast - Improved with dismiss button */}
              {error && errorVisible && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-950/90 text-red-200 border border-red-500/20 px-4 py-3 rounded-lg shadow-xl z-50 backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                  <button
                    onClick={dismissError}
                    className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}

              {/* Loading Overlay for Initialization */}
              {isInitializing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-40">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-slate-300 text-sm font-medium">Accessing camera & microphone...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-2 p-2 md:p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col gap-4">

              {/* Disclaimer Text for Idle State */}
              {isIdle && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-200/70">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <p>
                    <strong className="text-indigo-300">Disclaimer:</strong> NexusP2P facilitates direct browser-to-browser connections.
                    Your IP address is visible to the connected peer. Interaction is unmoderated.
                    Users must be 18+. By connecting, you agree to treat others with respect.
                  </p>
                </div>
              )}

              <div className="flex justify-center items-center gap-4">
                {/* Media Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleVideo}
                    disabled={!localStream}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${!localStream ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-600' :
                        isVideoEnabled
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white ring-1 ring-white/10'
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/20'
                      }`}
                    title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                    aria-label={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleAudio}
                    disabled={!localStream}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${!localStream ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-600' :
                        isAudioEnabled
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white ring-1 ring-white/10'
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/20'
                      }`}
                    title={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
                    aria-label={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
                  >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  {/* Remote Audio Control - Only show when connected */}
                  {isCallActive && (
                    <button
                      onClick={toggleRemoteAudio}
                      className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${isRemoteAudioEnabled
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white ring-1 ring-white/10'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/20'
                        }`}
                      title={isRemoteAudioEnabled ? "Mute Remote User" : "Unmute Remote User"}
                      aria-label={isRemoteAudioEnabled ? "Mute Remote User" : "Unmute Remote User"}
                    >
                      {isRemoteAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Main Action */}
                <div className="flex gap-2 flex-1 md:flex-none justify-center">
                  {isSearching && (
                    <Button
                      onClick={handleStop}
                      variant="secondary"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5"
                    >
                      <Square className="w-4 h-4 mr-2" fill="currentColor" /> Stop
                    </Button>
                  )}

                  {/* End Call Button */}
                  {isCallActive && (
                    <Button
                      onClick={handleEndCall}
                      variant="danger"
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      aria-label="End call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    size="lg"
                    onClick={handleMainAction}
                    disabled={isInitializing}
                    className={`min-w-[180px] font-semibold tracking-wide shadow-lg shadow-indigo-900/20 ${isConnected
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/30'
                      }`}
                  >
                    {isInitializing && (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    )}
                    {isIdle && !isInitializing && 'Start Connection'}
                    {isInitializing && 'Initializing...'}
                    {isSearching && 'Scanning...'}
                    {isConnected && (
                      <div className="flex items-center">
                        <SkipForward className="w-5 h-5 mr-2" /> Next Peer
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Sidebar (Desktop) */}
          <div className="hidden md:block w-80 lg:w-96 shrink-0 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <ChatBox
              messages={messages}
              onSendMessage={sendMessage}
              status={status}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-slate-600 text-xs">
            NexusP2P &copy; {new Date().getFullYear()} &middot; Serverless &middot; Encrypted &middot; Open Source
          </p>
        </footer>

      </div>

      {/* Background Ambient Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[128px]"></div>
      </div>
    </div>
  );
};

// Wrap the app with Error Boundary
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
