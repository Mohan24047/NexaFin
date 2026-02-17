'use client';

import React, { useState } from 'react';
import MultiAgentPanel from '@/components/agents/MultiAgentPanel';
import { AgentDebate } from '@/components/agents/AgentDebate';
import { Bot, MessageSquare } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AgentsPage() {
    const [mode, setMode] = useState<'analysis' | 'debate'>('analysis');

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">AI Financial Board</h1>
                        <p className="text-gray-400">Consult with a team of specialized AI agents.</p>
                    </div>

                    <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setMode('analysis')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                            ${mode === 'analysis' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}
                        `}
                        >
                            <Bot className="w-4 h-4" />
                            Analysis
                        </button>
                        <button
                            onClick={() => setMode('debate')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                            ${mode === 'debate' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}
                        `}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Live Debate
                        </button>
                    </div>
                </div>

                <div className="min-h-[600px]">
                    {mode === 'analysis' ? <MultiAgentPanel /> : <AgentDebate />}
                </div>
            </div>
        </ProtectedRoute>
    );
}
