import { TrendingUp, PiggyBank, ShieldCheck, DollarSign, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Recommendations {
    monthly_disposable: number;
    recommended_investment: number;
    recommended_savings: number;
    emergency_fund_allocation: number;
    confidence_score?: number;
    invest_confidence?: number;
    savings_confidence?: number;
    emergency_confidence?: number;
    message: string;
}

interface FinancialSummaryProps {
    recommendations: Recommendations | null;
    loading: boolean;
    onUpdate?: () => void;
}

export default function FinancialSummary({ recommendations, loading, onUpdate }: FinancialSummaryProps) {
    const [updating, setUpdating] = useState(false);

    const handleUpdatePortfolio = async () => {
        if (!recommendations) return;
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/portfolio/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: recommendations.recommended_investment,
                    risk_tolerance: 'moderate' // You might want to get this from profile
                })
            });

            if (res.ok) {
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            console.error("Failed to update portfolio", e);
        } finally {
            setUpdating(false);
        }
    };

    const formatCur = (n?: number | null) => {
        if (!n) return "$0";
        return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
    };

    if (loading) {
        return (
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 bg-gray-700/50 rounded-xl"></div>
                    <div className="h-24 bg-gray-700/50 rounded-xl"></div>
                    <div className="h-24 bg-gray-700/50 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!recommendations) return null;

    return (
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                AI Financial Recommendations
            </h2>
            <p className="text-gray-400 text-sm mb-6">{recommendations.message}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Investment */}
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700/30 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Monthly Invest</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatCur(recommendations.recommended_investment)}
                    </div>
                    {recommendations.invest_confidence != null && (
                        <div className={`text-xs font-semibold mt-1 ${recommendations.invest_confidence >= 75 ? 'text-emerald-400' : recommendations.invest_confidence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            Confidence: {recommendations.invest_confidence}%
                        </div>
                    )}
                </div>

                {/* Savings */}
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700/30 hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <PiggyBank className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Monthly Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatCur(recommendations.recommended_savings)}
                    </div>
                    {recommendations.savings_confidence != null && (
                        <div className={`text-xs font-semibold mt-1 ${recommendations.savings_confidence >= 75 ? 'text-emerald-400' : recommendations.savings_confidence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            Confidence: {recommendations.savings_confidence}%
                        </div>
                    )}
                </div>

                {/* Emergency Fund */}
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700/30 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-gray-400 text-sm">Emergency Fund</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatCur(recommendations.emergency_fund_allocation)}
                    </div>
                    {recommendations.emergency_confidence != null && (
                        <div className={`text-xs font-semibold mt-1 ${recommendations.emergency_confidence >= 75 ? 'text-emerald-400' : recommendations.emergency_confidence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            Confidence: {recommendations.emergency_confidence}%
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700/30 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">
                    <span>Disposable Income: <strong>{formatCur(recommendations.monthly_disposable)}</strong></span>
                    {recommendations.confidence_score != null && (
                        <span className="ml-4">
                            AI Confidence:{' '}
                            <strong className={`${recommendations.confidence_score >= 75
                                ? 'text-emerald-400'
                                : recommendations.confidence_score >= 60
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                                }`}>
                                {recommendations.confidence_score}%
                            </strong>
                        </span>
                    )}
                </div>

                <button
                    onClick={handleUpdatePortfolio}
                    disabled={updating}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {updating ? 'Updating...' : 'Send Investment to Portfolio'}
                    {!updating && <ArrowRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
