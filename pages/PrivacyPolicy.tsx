import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ArrowLeft, Shield, Lock, Eye, Server, Globe } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-4">
                        <Shield className="w-3 h-3" />
                        LEGAL
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                    <p className="text-slate-400">Last updated: December 8, 2024</p>
                </div>

                <div className="prose prose-invert prose-slate max-w-none">
                    <section className="mb-12 p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <Lock className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-white m-0">Our Privacy Commitment</h2>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                            NexusP2P is built with privacy as a core principle. We operate on a <strong className="text-white">zero-knowledge architecture</strong> -
                            we don't collect, store, or have access to your personal data, conversations, or video streams.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Don't Collect</h2>
                        <p className="text-slate-300 mb-4">Unlike traditional video chat services, NexusP2P does NOT collect:</p>
                        <ul className="space-y-2 text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No personal information</strong> - No names, emails, or phone numbers required</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No account data</strong> - No registration or login needed</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No video/audio recordings</strong> - Streams go directly between peers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No chat logs</strong> - Messages are not stored on any server</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No tracking cookies</strong> - We don't use analytics or tracking</span>
                            </li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. How the Technology Works</h2>
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Server className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-semibold text-white m-0">Peer-to-Peer Architecture</h3>
                            </div>
                            <p className="text-slate-300 text-sm">
                                NexusP2P uses WebRTC technology to create direct connections between users. Your video, audio, and
                                messages travel directly from your device to the other person's device without passing through our servers.
                            </p>
                        </div>
                        <p className="text-slate-300">
                            <strong className="text-white">Signaling servers</strong> are used only to help establish the initial connection.
                            Once connected, all communication is peer-to-peer.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Information Visible to Peers</h2>
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Eye className="w-5 h-5 text-amber-400" />
                                <h3 className="font-semibold text-amber-200 m-0">Important Notice</h3>
                            </div>
                            <p className="text-amber-100/80 text-sm">
                                Due to the peer-to-peer nature of WebRTC, the person you connect with may be able to see your IP address.
                                This is inherent to how direct connections work on the internet.
                            </p>
                        </div>
                        <p className="text-slate-300">
                            If you require additional privacy, we recommend using a VPN service before connecting.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
                        <p className="text-slate-300 mb-4">NexusP2P uses the following third-party services:</p>
                        <ul className="space-y-2 text-slate-300">
                            <li><strong className="text-white">STUN/TURN Servers:</strong> For NAT traversal (Google, OpenRelay)</li>
                            <li><strong className="text-white">MQTT Broker:</strong> For matchmaking signaling (HiveMQ)</li>
                            <li><strong className="text-white">Hosting:</strong> Vercel (static file hosting only)</li>
                        </ul>
                        <p className="text-slate-300 mt-4">
                            These services only facilitate connection establishment and do not have access to your communications.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
                        <p className="text-slate-300">
                            Since we don't collect data, there is nothing to retain. All session data exists only in your browser's
                            memory and is cleared when you close the page.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Children's Privacy</h2>
                        <p className="text-slate-300">
                            NexusP2P is intended for users 18 years and older. We do not knowingly facilitate connections involving minors.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
                        <p className="text-slate-300">
                            We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated date.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
                        <p className="text-slate-300">
                            For privacy-related questions, please open an issue on our{' '}
                            <a href="https://github.com" className="text-indigo-400 hover:text-indigo-300 underline">GitHub repository</a>.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8">
                <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">© 2024 NexusP2P. Open source under MIT License.</p>
                    <div className="flex gap-6 text-sm">
                        <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
