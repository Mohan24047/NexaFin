'use client';

import Link from 'next/link';
import { ArrowRight, Bot, LayoutDashboard, Brain, TrendingUp, PieChart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { JobDashboard } from '@/components/dashboard/JobDashboard';
import { StartupDashboard } from '@/components/dashboard/StartupDashboard';

export default function Home() {
    const { profile } = useAuth();

    return (
        <ProtectedRoute>
            <div className="flex flex-col items-center">
                {/* Hero Section */}
                <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="z-10 max-w-4xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800 text-blue-400 text-sm font-medium mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Live Demo
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white">
                            Future of <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 bg-clip-text text-transparent">Finance</span>
                            <br /> is Generative.
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Build startups in seconds, simulate market crashes, track your portfolio, and get advice from a council of AI agents. All in one workspace.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Link href="/startup-builder">
                                <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500">
                                    Launch Startup Builder
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/agents">
                                <Button variant="secondary" size="lg" className="h-12 px-8 text-base">
                                    <Bot className="mr-2 h-4 w-4" />
                                    AI Council
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Conditional Dashboard */}
                {profile?.user_type === 'startup' ? (
                    <>
                        <div className="w-full max-w-7xl px-4 pb-4">
                            <StartupDashboard user={profile} />
                        </div>
                        {/* Startup Features Grid */}
                        <section className="w-full max-w-7xl px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Link href="/startup-builder" className="group">
                                <Card className="h-full hover:border-blue-500/50 transition-colors group-hover:bg-gray-900">
                                    <div className="h-12 w-12 bg-blue-900/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                                        <LayoutDashboard className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Startup Simulator</h3>
                                    <p className="text-gray-400">
                                        Generate full financial projections, P&L, and investor memos for any startup idea.
                                    </p>
                                </Card>
                            </Link>
                            <Link href="/agents" className="group">
                                <Card className="h-full hover:border-purple-500/50 transition-colors group-hover:bg-gray-900">
                                    <div className="h-12 w-12 bg-purple-900/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">AI Board Council</h3>
                                    <p className="text-gray-400">
                                        Simulate a debate between a CFO, VC, Risk Manager, and Trader on your financial decisions.
                                    </p>
                                </Card>
                            </Link>
                            <Link href="/personal-finance" className="group">
                                <Card className="h-full hover:border-pink-500/50 transition-colors group-hover:bg-gray-900">
                                    <div className="h-12 w-12 bg-pink-900/20 rounded-lg flex items-center justify-center mb-4 text-pink-400">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">Corporate Treasury</h3>
                                    <p className="text-gray-400">
                                        Manage operating accounts, payroll, and burn rate tracking.
                                    </p>
                                </Card>
                            </Link>
                        </section>
                    </>
                ) : profile ? (
                    <JobDashboard profile={profile} />
                ) : null}

            </div>
        </ProtectedRoute>
    );
}
