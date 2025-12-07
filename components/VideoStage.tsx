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
    if (latency === null) return <Signal className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />;
    if (latency < 100) return <SignalHigh className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />;
    if (latency < 300) return <SignalMedium className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />;
    if (latency < 600) return <SignalLow className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />;
    return <SignalLow className="w-3 h-3 md:w-4 md:h-4 text-red-400" />;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">

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
            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-1.5 md:gap-2">
              <div className="bg-slate-900/60 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
                {getNetworkIcon()}
                <span className="text-[9px] md:text-[10px] font-mono text-slate-300">
                  {latency !== null ? `${latency}ms` : '--'}
                </span>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-400" />
                <span className="text-[9px] md:text-[10px] font-mono text-slate-100 font-medium">
                  {durationString}
                </span>
              </div>
            </div>

            {/* Remote Mute Indicator */}
            {!isRemoteAudioEnabled && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4 rounded-2xl border border-white/10 pointer-events-none">
                <MicOff className="w-6 h-6 md:w-8 md:h-8 text-white/80 mb-1.5" />
                <span className="text-xs md:text-sm font-medium text-white/90">MUTED</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full">

            {status === ConnectionStatus.SEARCHING && (
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-base md:text-xl font-medium text-white mb-1">Searching...</h3>
                <p className="text-slate-400 text-xs md:text-sm">Scanning for peers</p>
              </div>
            )}

            {status === ConnectionStatus.CONNECTING && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3 animate-pulse">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
                </div>
                <h3 className="text-base md:text-xl font-medium text-white">Connecting...</h3>
                <p className="text-slate-400 text-xs md:text-sm mt-1">Establishing P2P link</p>
              </div>
            )}

            {(status === ConnectionStatus.IDLE || status === ConnectionStatus.ERROR) && (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Compact Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] md:text-xs font-mono mb-3 md:mb-4">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                  READY
                </div>

                {/* Compact Title */}
                <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight text-center mb-3 md:mb-5">
                  Pure P2P.<br />
                  <span className="text-slate-500">No Logs.</span>
                </h2>

                {/* Feature Grid - Hidden on very small screens, compact on mobile */}
                <div className="hidden sm:grid grid-cols-3 gap-2 md:gap-3 w-full max-w-sm">
                  <div className="p-2 md:p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 mx-auto mb-1" />
                    <h4 className="font-medium text-white text-[10px] md:text-xs">Encrypted</h4>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <Globe className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mx-auto mb-1" />
                    <h4 className="font-medium text-white text-[10px] md:text-xs">Global</h4>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-400 mx-auto mb-1" />
                    <h4 className="font-medium text-white text-[10px] md:text-xs">Instant</h4>
                  </div>
                </div>
              </div>
            )}

            {status === ConnectionStatus.CONNECTED && !remoteStream && (
              <div className="text-slate-400 font-mono text-xs md:text-sm animate-pulse">
                Waiting for video...
              </div>
            )}
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        {localStream && (
          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-20 md:w-32 lg:w-48 aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-white/10 z-10">
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
                <VideoOff className="w-4 h-4 md:w-6 md:h-6 mb-0.5 opacity-50" />
                <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-wider">Off</span>
              </div>
            )}

            {/* Mic Off Indicator */}
            {!isAudioEnabled && (
              <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500/90 p-1 rounded-full backdrop-blur z-20 shadow-sm">
                <MicOff className="w-2 h-2 md:w-3 md:h-3 text-white" />
              </div>
            )}

            <div className="absolute bottom-0.5 left-1 md:bottom-1 md:left-2 text-[8px] md:text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">YOU</div>
          </div>
        )}
      </div>

    </div>
  );
};

export default VideoStage;
