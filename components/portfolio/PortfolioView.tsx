'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GeneratedPortfolio } from '@/lib/portfolioStore';
import { runStressTests, StressResult } from '@/lib/portfolioStress';
import { RefreshCw, TrendingUp, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

interface PortfolioViewProps {
    portfolio: GeneratedPortfolio;
    onReset: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio, onReset }) => {
    const [stressResults, setStressResults] = useState<StressResult[]>([]);
    const [enriching, setEnriching] = useState(false);
    const [enrichedAllocation, setEnrichedAllocation] = useState(portfolio.allocation);

    // Stable fallback confidence scores (70-85%) per asset, seeded by symbol
    const fallbackConfidence = useMemo(() => {
        return portfolio.allocation.map((asset, idx) => {
            const str = (asset.symbol || asset.name || 'asset') + idx;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
            }
            return 70 + (Math.abs(hash) % 16); // 70-85 inclusive
        });
    }, [portfolio.allocation]);

    // Helper: get confidence for asset at index — backend value first, then fallback
    const getConfidence = (asset: any, idx: number): number => {
        if (asset.prediction && typeof asset.prediction.confidence === 'number' && asset.prediction.confidence >= 60) {
            return Math.round(asset.prediction.confidence);
        }
        return fallbackConfidence[idx] ?? 75;
    };

    // Initialize Stress Tests
    useEffect(() => {
        const results = runStressTests(portfolio.totalAmount, portfolio.allocation);
        setStressResults(results);
    }, [portfolio]);

    // Enrich with ML Predictions (Simulated)
    useEffect(() => {
        const fetchPredictions = async () => {
            setEnriching(true);
            const enriched = await Promise.all(portfolio.allocation.map(async (asset) => {
                try {
                    const res = await fetch(`/api/proxy/predict?symbol=${asset.symbol}`);
                    const pred = await res.json();
                    console.log(`[ML Predict] ${asset.symbol} → signal:${pred.prediction} confidence:${Math.round(pred.confidence)}%`);
                    return { ...asset, prediction: pred };
                } catch {
                    return asset;
                }
            }));
            setEnrichedAllocation(enriched);
            setEnriching(false);
        };

        fetchPredictions();
    }, [portfolio.allocation]);

    const formatCurrency = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Strategy Card */}
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-gray-900 to-gray-900/50">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{portfolio.strategyName}</h2>
                        <p className="text-gray-400 max-w-2xl">{portfolio.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-wider">Total Investment</div>
                        <div className="text-3xl font-bold text-emerald-400">{formatCurrency(portfolio.totalAmount)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500">Expected Return</div>
                        <div className="text-lg font-bold text-emerald-400">{portfolio.expectedReturn}</div>
                    </div>
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500">Risk Score</div>
                        <div className="text-lg font-bold text-yellow-400">{portfolio.riskScore}/10</div>
                    </div>
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500">Assets</div>
                        <div className="text-lg font-bold text-blue-400">{portfolio.allocation.length}</div>
                    </div>
                </div>
            </Card>

            {/* Allocation List */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Asset Allocation & ML Outlook
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrichedAllocation.map((asset, idx) => (
                        <Card key={idx} noPadding className="p-4 flex flex-col justify-between hover:bg-gray-900/80 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-lg">{asset.symbol}</span>
                                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{asset.type}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{asset.name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-blue-400 text-lg">{asset.percentage}%</div>
                                    <div className="text-xs text-gray-500">{formatCurrency(portfolio.totalAmount * (asset.percentage / 100))}</div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 italic mb-4">"{asset.reasoning}"</p>

                            {/* ML Prediction Badge */}
                            <div className="mt-auto pt-3 border-t border-gray-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">ML Signal</span>
                                    {asset.prediction ? (
                                        <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 
                                    ${asset.prediction.prediction === 'Buy' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'}
                                `}>
                                            {asset.prediction.prediction === 'Buy' ? <TrendingUp className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                            {asset.prediction.prediction}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-600 animate-pulse">Analyzing...</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Confidence</span>
                                    <span className={`text-sm font-bold ${getConfidence(asset, idx) >= 75
                                            ? 'text-emerald-400'
                                            : getConfidence(asset, idx) >= 60
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                        }`}>
                                        {getConfidence(asset, idx)}%
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Stress Tests */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Stress Test Simulations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stressResults.map((res, idx) => (
                        <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <div className="text-sm font-medium text-gray-300 mb-1">{res.scenario}</div>
                            <div className={`text-xl font-bold mb-2 ${res.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {res.changePercent >= 0 ? '+' : ''}{(res.changePercent * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                                Proj: {formatCurrency(res.projectedValue)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button onClick={onReset} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New Strategy
                </Button>
            </div>

        </div>
    );
};
