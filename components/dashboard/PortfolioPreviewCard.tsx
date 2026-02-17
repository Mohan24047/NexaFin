import React from 'react';
import { PieChart, DollarSign, ArrowRight } from 'lucide-react';

interface Allocation {
    asset: string;
    percent: number;
    amount: number;
    color: string;
}

interface PortfolioData {
    monthly_investment: number;
    allocation: Allocation[];
}

interface PortfolioPreviewCardProps {
    portfolio: PortfolioData | null;
    strategyType?: 'user' | 'ai';
}

export default function PortfolioPreviewCard({ portfolio, strategyType = 'ai' }: PortfolioPreviewCardProps) {
    if (!portfolio) {
        return null;
    }

    const formatCur = (n?: number | null) => {
        if (!n) return "$0";
        return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Your Smart Portfolio</h3>
                    <p className="text-sm text-gray-400">
                        {strategyType === 'user' ? 'User Investment Plan' : 'AI-Optimized Allocation Strategy'}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Investment Stat */}
                <div className="space-y-4">
                    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Monthly Contribution</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {formatCur(portfolio.monthly_investment)}
                        </div>
                    </div>
                </div>

                {/* Right: Allocation List */}
                <div className="space-y-3">
                    {portfolio.allocation.map((item, index) => (
                        <div key={index} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                                />
                                <span className="text-gray-300 text-sm font-medium">{item.asset}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-400 text-xs">{formatCur(item.amount)}</span>
                                <span className="text-white font-bold text-sm bg-gray-800 px-2 py-0.5 rounded">{item.percent}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    View Full Analysis <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
