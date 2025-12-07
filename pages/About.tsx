import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ArrowLeft, Github, Globe, Zap, Shield, Users, Code, Heart } from 'lucide-react';

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to App</span>
                    </Link>
                    <Link to="/" className="flex items-center gap-2">
                        <Network className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-white">NexusP2P</span>
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-6">
                        <Globe className="w-3 h-3" />
                        ABOUT THE PROJECT
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Decentralized Video Chat<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                            For Everyone
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        NexusP2P is an open-source, serverless video chat application that connects people
                        directly through peer-to-peer technology. No accounts, no tracking, no middlemen.
                    </p>
                </div>
            </section>

            {/* Features */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Why NexusP2P?</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
                            <p className="text-slate-400">
                                No accounts required. No data collection. Your conversations stay between you and your peer.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Truly Serverless</h3>
                            <p className="text-slate-400">
                                Video and audio streams go directly between browsers. We never see or store your media.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Anonymous Connections</h3>
                            <p className="text-slate-400">
                                Meet random people from around the world. Skip to the next person anytime with one click.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                                <Code className="w-6 h-6 text-violet-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Open Source</h3>
                            <p className="text-slate-400">
                                100% open source under MIT License. Inspect the code, contribute, or host your own instance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Technology Stack</h2>
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-indigo-400 mb-1">WebRTC</div>
                                <div className="text-sm text-slate-400">Real-time P2P</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-emerald-400 mb-1">React</div>
                                <div className="text-sm text-slate-400">User Interface</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-amber-400 mb-1">PeerJS</div>
                                <div className="text-sm text-slate-400">WebRTC Wrapper</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-violet-400 mb-1">MQTT</div>
                                <div className="text-sm text-slate-400">Signaling</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">1</div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Click "Start"</h3>
                                <p className="text-slate-400 text-sm">Allow camera/microphone access and join the global matchmaking pool.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">2</div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Get Matched</h3>
                                <p className="text-slate-400 text-sm">Our signaling system pairs you with another random user who's also searching.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">3</div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Connect Directly</h3>
                                <p className="text-slate-400 text-sm">WebRTC establishes a direct peer-to-peer connection for video, audio, and chat.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">4</div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Chat or Skip</h3>
                                <p className="text-slate-400 text-sm">Stay and chat, or click "Next" to find someone else. Both users get matched to new peers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                        <h2 className="text-2xl font-bold text-white mb-4">Ready to Connect?</h2>
                        <p className="text-slate-400 mb-6">Start chatting with strangers from around the world in seconds.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                            >
                                <Zap className="w-4 h-4" />
                                Start Now
                            </Link>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                            >
                                <Github className="w-4 h-4" />
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8">
                <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-400" /> by the open source community
                    </p>
                    <div className="flex gap-6 text-sm">
                        <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default About;
