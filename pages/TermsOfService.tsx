import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ArrowLeft, FileText, AlertTriangle, Users, Ban, Scale } from 'lucide-react';

const TermsOfService: React.FC = () => {
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
                        <FileText className="w-3 h-3" />
                        LEGAL
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
                    <p className="text-slate-400">Last updated: December 8, 2024</p>
                </div>

                <div className="prose prose-invert prose-slate max-w-none">
                    <section className="mb-12 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-amber-200 m-0">Important Notice</h2>
                        </div>
                        <p className="text-amber-100/80 leading-relaxed">
                            By using NexusP2P, you acknowledge that this is an <strong>unmoderated, peer-to-peer platform</strong>.
                            You may encounter content or behavior that is offensive, inappropriate, or harmful.
                            Use at your own discretion and risk.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-300">
                            By accessing or using NexusP2P ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, do not use the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Users className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-semibold text-white m-0">Age Requirement</h3>
                            </div>
                            <p className="text-slate-300 text-sm">
                                You must be at least <strong className="text-white">18 years of age</strong> to use NexusP2P.
                                By using this Service, you represent and warrant that you are 18 years of age or older.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Prohibited Conduct</h2>
                        <p className="text-slate-300 mb-4">You agree NOT to use NexusP2P to:</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300">Share, display, or transmit any illegal content including child sexual abuse material (CSAM)</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300">Harass, threaten, stalk, or intimidate other users</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300">Record or distribute conversations without consent</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300">Engage in fraud, scams, or deceptive practices</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300">Attempt to exploit, hack, or disrupt the Service or other users</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300">Violate any applicable local, state, national, or international law</span>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Nature of the Service</h2>
                        <p className="text-slate-300 mb-4">You understand and acknowledge that:</p>
                        <ul className="space-y-2 text-slate-300">
                            <li>• NexusP2P is an <strong className="text-white">unmoderated</strong> platform</li>
                            <li>• We do not monitor, screen, or filter users or content</li>
                            <li>• We cannot control what other users may say or do</li>
                            <li>• You may encounter content that is offensive or disturbing</li>
                            <li>• You are solely responsible for your interactions with other users</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer of Warranties</h2>
                        <p className="text-slate-300">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                            EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
                            SECURE, OR ERROR-FREE.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <Scale className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-semibold text-white m-0">Legal Limitation</h3>
                            </div>
                            <p className="text-slate-300 text-sm">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL NEXUSP2P, ITS OPERATORS,
                                OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                                OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Indemnification</h2>
                        <p className="text-slate-300">
                            You agree to indemnify and hold harmless NexusP2P and its operators from any claims,
                            damages, losses, or expenses arising from your use of the Service or violation of these Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Open Source</h2>
                        <p className="text-slate-300">
                            NexusP2P is open source software licensed under the MIT License. The source code is available
                            on GitHub. This license applies to the software only, not to user-generated content or behavior.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
                        <p className="text-slate-300">
                            We reserve the right to modify these Terms at any time. Continued use of the Service
                            after changes constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
                        <p className="text-slate-300">
                            For questions about these Terms, please open an issue on our{' '}
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
                        <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfService;
