import React, { useEffect, useRef, useState } from 'react';
import { ConnectionStatus } from '../types';
import { VideoOff, MicOff, ShieldCheck, Globe, Zap, Signal, SignalHigh, SignalMedium, SignalLow, Clock } from 'lucide-react';

interface VideoStageProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: ConnectionStatus;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRemoteAudioEnabled?: boolean;
  latency?: number | null;
  callStartTime?: number | null;
}

const VideoStage: React.FC<VideoStageProps> = ({ 
    localStream, 
    remoteStream, 
    status, 
    isVideoEnabled, 
    isAudioEnabled,
    isRemoteAudioEnabled = true,
    latency = null,
    callStartTime = null
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [durationString, setDurationString] = useState("00:00");

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call Duration Timer
  useEffect(() => {
    if (!callStartTime || status !== ConnectionStatus.CONNECTED) {
        setDurationString("00:00");
        return;
    }

    const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setDurationString(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime, status]);

  // Network Quality Icon Helper
  const getNetworkIcon = () => {
    if (latency === null) return <Signal className="w-4 h-4 text-slate-500" />;
    if (latency < 100) return <SignalHigh className="w-4 h-4 text-emerald-400" />;
    if (latency < 300) return <SignalMedium className="w-4 h-4 text-emerald-400" />;
    if (latency < 600) return <SignalLow className="w-4 h-4 text-amber-400" />;
    return <SignalLow className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
      
      {/* Remote Video (Main Stage) */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        {status === ConnectionStatus.CONNECTED && remoteStream ? (
          <>
             <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={!isRemoteAudioEnabled}
                className="w-full h-full object-cover"
             />
             
             {/* Connection Stats Overlay */}
             <div className="absolute top-4 left-4 flex gap-2">
                 <div className="bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                    {getNetworkIcon()}
                    <span className="text-[10px] font-mono text-slate-300">
                        {latency !== null ? `${latency}ms` : '--'}
                    </span>
                 </div>
                 
                 <div className="bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-mono text-slate-100 font-medium">
                        {durationString}
                    </span>
                 </div>
             </div>
             
             {/* Remote Mute Indicator */}
             {!isRemoteAudioEnabled && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4 rounded-2xl border border-white/10 pointer-events-none">
                    <MicOff className="w-8 h-8 text-white/80 mb-2" />
                    <span className="text-sm font-medium text-white/90">REMOTE AUDIO MUTED</span>
                </div>
             )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
             
             {status === ConnectionStatus.SEARCHING && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Establishing Link...</h3>
                  <p className="text-slate-400 text-sm">Scanning distributed network for peers.</p>
                </div>
             )}

             {status === ConnectionStatus.CONNECTING && (
               <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Zap className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Handshake in Progress</h3>
                  <p className="text-slate-400 text-sm mt-2">Negotiating P2P encryption keys.</p>
               </div>
             )}

             {(status === ConnectionStatus.IDLE || status === ConnectionStatus.ERROR) && (
               <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    DECENTRALIZED NETWORK READY
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Pure Peer-to-Peer.<br/>
                    <span className="text-slate-500">No Servers. No Logs.</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
                     <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                        <h4 className="font-semibold text-white text-sm">Encrypted</h4>
                        <p className="text-slate-400 text-xs mt-1">Direct end-to-end stream.</p>
                     </div>
                     <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <Globe className="w-6 h-6 text-blue-400 mb-2" />
                        <h4 className="font-semibold text-white text-sm">Global</h4>
                        <p className="text-slate-400 text-xs mt-1">Connect worldwide.</p>
                     </div>
                     <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <Zap className="w-6 h-6 text-amber-400 mb-2" />
                        <h4 className="font-semibold text-white text-sm">Instant</h4>
                        <p className="text-slate-400 text-xs mt-1">No sign-up required.</p>
                     </div>
                  </div>
               </div>
             )}

             {status === ConnectionStatus.CONNECTED && !remoteStream && (
                <div className="text-slate-400 font-mono text-sm animate-pulse">
                   Waiting for peer video stream...
                </div>
             )}
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-white/10 z-10 transition-all hover:scale-105 group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover video-mirror ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}
            />
            {/* Camera Off Overlay */}
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                <VideoOff className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Camera Off</span>
              </div>
            )}
            
            {/* Mic Off Indicator */}
            {!isAudioEnabled && (
              <div className="absolute top-2 right-2 bg-red-500/90 p-1.5 rounded-full backdrop-blur z-20 shadow-sm">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">YOU</div>
          </div>
        )}
      </div>

    </div>
  );
};

export default VideoStage;
