import React, { useState } from 'react';
import { Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DEMO_PRESETS } from '@/lib/demoData';

interface InputSectionProps {
    onGenerate: (idea: string, title: string) => void;
    isLoading: boolean;
}

export default function InputSection({ onGenerate, isLoading }: InputSectionProps) {
    const [idea, setIdea] = useState('');
    const [title, setTitle] = useState('');

    const handleGenerate = () => {
        if (!idea.trim() || !title.trim()) return;
        onGenerate(idea, title);
    };

    const loadDemo = () => {
        const demoIdea = `${DEMO_PRESETS.STARTUP.companyName}: ${DEMO_PRESETS.STARTUP.description}`;
        setIdea(demoIdea);
        setTitle(DEMO_PRESETS.STARTUP.companyName);
        // Optional: auto-submit
        // onGenerate(demoIdea, DEMO_PRESETS.STARTUP.companyName); 
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 tracking-tight pb-2">
                    Build Your Startup Model
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Describe your business idea in detail using natural language. Our AI will generate a comprehensive financial simulation including revenue, burn rate, and survival probability.
                </p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-900 ring-1 ring-gray-800 rounded-xl p-2 md:p-3 flex flex-col gap-4 shadow-2xl">

                    {/* Startup Title Input */}
                    <div className="px-2 pt-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 uppercase tracking-wider">Startup Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. AI Legal Assistant"
                            className="w-full bg-gray-800/50 text-white placeholder-gray-600 px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex-grow">
                            <textarea
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="Describe your business model..."
                                className="w-full bg-transparent text-white placeholder-gray-500 text-lg px-4 py-3 focus:outline-none resize-none h-[80px] md:h-[60px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2 justify-center p-2">
                            <Button
                                onClick={handleGenerate}
                                isLoading={isLoading}
                                disabled={!title.trim() || !idea.trim()}
                                size="lg"
                                className="h-full min-h-[50px] px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Rocket className="w-5 h-5" />
                                Launch Simulation
                            </Button>
                            <button
                                onClick={loadDemo}
                                className="text-xs text-gray-500 hover:text-blue-400 flex items-center justify-center gap-1 transition-colors py-1"
                            >
                                <Sparkles className="w-3 h-3" />
                                Load Demo Idea
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Live Market Data
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    AI Growth Projection
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Investor Ready Export
                </span>
            </div>
        </div>
    );
};
