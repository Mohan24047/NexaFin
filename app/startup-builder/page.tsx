'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/buildsim/Header';
import InputSection from '@/components/buildsim/InputSection';
import ResultCard from '@/components/buildsim/ResultCard';
import StressTestPanel from '@/components/buildsim/StressTestPanel';
import FounderControlsPanel from '@/components/buildsim/FounderControlsPanel';
import AdvicePanel, { AdviceData } from '@/components/buildsim/AdvicePanel';
import {
    calculateSurvivalScore,
    calculateStressTest,
    applyFounderControls,
    FinancialData,
    StressTestControls,
    FounderControls,
    AdjustedFinancialData,
} from '@/lib/mockEngine';
import { InvestmentCard } from '@/components/portfolio/InvestmentCard';
import { Button } from '@/components/ui/Button';
import { usePortfolio } from '@/lib/portfolioStore';
import { calculateFundability } from '@/lib/fundability';
import { Briefcase } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/lib/toastStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

interface Startup {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    revenue: number;
    burn: number;
    cash: number;
    team: number;
    runway: number;
    survival_score: number;
}

const defaultStressControls: StressTestControls = {
    recession: false,
    adCostIncrease: 0,
    hiringExpansion: 0,
    growthSlowdown: 0,
};

const defaultFounderControls: FounderControls = {
    startingCapital: null,
    plannedHires: 0,
    marketingBudget: 0,
};

export default function Home() {
    const [startupIdea, setStartupIdea] = useState<string | null>(null); // This is the description/prompt
    const [startupName, setStartupName] = useState<string | null>(null); // This is the Title
    const [baseFinancialData, setBaseFinancialData] = useState<FinancialData | null>(null);
    const [stressControls, setStressControls] = useState<StressTestControls>(defaultStressControls);
    const [founderControls, setFounderControls] = useState<FounderControls>(defaultFounderControls);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState<string | null>(null);
    const [advice, setAdvice] = useState<AdviceData | null>(null);
    const [adviceLoading, setAdviceLoading] = useState(false);
    const adviceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Investment State
    const { addInvestment } = usePortfolio();
    const [thesis, setThesis] = useState<any>(null);
    const [generatingThesis, setGeneratingThesis] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    // My Startups State
    const { user } = useAuth();
    const [myStartups, setMyStartups] = useState<Startup[]>([]);
    const [myStartupsLoading, setMyStartupsLoading] = useState(true);

    const fetchMyStartups = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setMyStartupsLoading(true);
        try {
            // Adjust port if needed, assuming backend is on 8000
            const res = await fetch('http://localhost:8000/startups/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMyStartups(data);
            }
        } catch (error) {
            console.error("Failed to fetch startups", error);
        } finally {
            setMyStartupsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyStartups();
    }, [fetchMyStartups]);

    const [savedStartupId, setSavedStartupId] = useState<string | null>(null);

    const saveStartupToBackend = async (data: FinancialData, name: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8000/startups/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description: "Generated via SimBuild",
                    revenue: data.revenue,
                    burn: data.burn,
                    cash: data.cash,
                    growth: data.growth,
                    team: data.team,
                    runway: data.runway,
                    survival_score: data.survivalScore,
                }),
            });

            if (res.ok) {
                const savedStartup = await res.json();
                console.log("Startup Saved with ID:", savedStartup.id);
                setSavedStartupId(savedStartup.id);
                // Refresh list
                fetchMyStartups();
            }
        } catch (e) {
            console.error("Failed to save startup", e);
        }
    };



    // ...



    // ── Layer 1: Founder controls applied to AI base data ─────────
    const founderAdjusted: FinancialData | null = useMemo(() => {
        if (!baseFinancialData) return null;
        return applyFounderControls(baseFinancialData, founderControls);
    }, [baseFinancialData, founderControls]);

    // ── Layer 2: Stress test on top of founder-adjusted data ──────
    const adjusted: AdjustedFinancialData | null = useMemo(() => {
        if (!founderAdjusted) return null;
        return calculateStressTest(founderAdjusted, stressControls);
    }, [founderAdjusted, stressControls]);

    // ── Fetch advice ──────────────────────────────────────────────
    const fetchAdvice = useCallback(
        async (
            idea: string,
            data: FinancialData,
            adj: AdjustedFinancialData,
            stress: StressTestControls
        ) => {
            setAdviceLoading(true);
            try {
                const res = await fetch('/api/advice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idea,
                        revenue: data.revenue,
                        burn: adj.adjustedBurn,
                        growth: adj.adjustedGrowth,
                        team: data.team,
                        cash: data.cash,
                        runway: adj.adjustedRunway,
                        survivalScore: adj.adjustedSurvivalScore,
                        scenario: {
                            recession: stress.recession,
                            adCostIncrease: stress.adCostIncrease,
                            hiringIncrease: stress.hiringExpansion,
                            growthSlowdown: stress.growthSlowdown,
                        },
                    }),
                });
                const json = await res.json();
                setAdvice(json as AdviceData);
            } catch {
                setAdvice({
                    assessment: 'Unable to fetch advice. Please try again.',
                    costAdvice: 'Review your cost structure manually.',
                    hiringAdvice: 'Maintain current team size until conditions stabilize.',
                    fundingAdvice: 'Consult with your financial advisor.',
                    investorMemo: 'Data temporarily unavailable.',
                    provider: 'error',
                });
            } finally {
                setAdviceLoading(false);
            }
        },
        []
    );

    // ── Generate handler ──────────────────────────────────────────
    // ── Generate handler ──────────────────────────────────────────
    const handleGenerate = async (idea: string, title: string) => {
        setStartupIdea(idea); // We can stick with idea for description/thesis gen context
        // But for saving, we'll use 'title'

        setLoading(true);
        setAdvice(null);
        setSavedStartupId(null); // Clear previous ID
        const resetStress = { ...defaultStressControls };
        const resetFounder = { ...defaultFounderControls };
        setStressControls(resetStress);
        setFounderControls(resetFounder);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea }),
            });

            const json = await res.json();
            setProvider(json.provider || 'unknown');

            const revenue = Number(json.revenue) || 25000;
            let burn = Number(json.burn) || 40000;
            const growth = Number(json.growth) || 8;
            const team = Number(json.team) || 5;

            // Clamp burn for realism: 0.5×–3× revenue
            if (burn > revenue * 3) burn = Math.round(revenue * 2);
            if (burn < revenue * 0.5) burn = Math.round(revenue * 0.7);

            // Clamp cash for realism: burn×6–24
            let cash = Number(json.cash) || burn * 12;
            if (cash > burn * 24) cash = burn * 18;
            if (cash < burn * 6) cash = burn * 8;

            const runway = burn > 0 ? Math.floor(cash / burn) : 0;
            const survivalScore = calculateSurvivalScore(runway, growth, burn, revenue);

            const data: FinancialData = { revenue, burn, growth, team, cash, runway, survivalScore };
            setBaseFinancialData(data);

            const baseAdj = calculateStressTest(data, resetStress);
            fetchAdvice(idea, data, baseAdj, resetStress);

            // Save to Backend immediately with the provided TITLE
            console.log("Saving startup with title:", title);
            saveStartupToBackend(data, title);

        } catch {
            const fallback: FinancialData = {
                revenue: 25000,
                burn: 40000,
                growth: 8,
                team: 5,
                cash: 480000,
                runway: 12,
                survivalScore: calculateSurvivalScore(12, 8, 40000, 25000),
            };
            setBaseFinancialData(fallback);
            setProvider('fallback');

            const baseAdj = calculateStressTest(fallback, resetStress);
            fetchAdvice(idea, fallback, baseAdj, resetStress);
        } finally {
            setLoading(false);
        }
    };

    // ── Debounced advice refetch on control changes ───────────────
    useEffect(() => {
        if (!startupIdea || !founderAdjusted || !adjusted) return;

        if (adviceTimerRef.current) clearTimeout(adviceTimerRef.current);

        adviceTimerRef.current = setTimeout(() => {
            fetchAdvice(startupIdea, founderAdjusted, adjusted, stressControls);
        }, 400);

        return () => {
            if (adviceTimerRef.current) clearTimeout(adviceTimerRef.current);
        };
    }, [stressControls, founderControls, startupIdea, founderAdjusted, adjusted, fetchAdvice]);
    // ── helpers ───────────────────────────────────────────────────
    const providerLabel = (p: string) => {
        switch (p) {
            case 'openrouter': return '🟢 OpenRouter AI';
            case 'groq': return '🟡 Groq AI (fallback)';
            case 'fallback': return '🔴 Mock data (offline)';
            default: return p;
        }
    };

    const contextLabel = () => {
        if (isStressed && isFounderModified) return 'After founder + market simulation';
        if (isStressed) return 'Under stress scenario';
        if (isFounderModified) return 'After founder adjustments';
        return 'Based on AI-generated model';
    };

    const isStressed =
        stressControls.recession ||
        stressControls.adCostIncrease > 0 ||
        stressControls.hiringExpansion > 0 ||
        stressControls.growthSlowdown > 0;

    const isFounderModified =
        founderControls.startingCapital !== null ||
        founderControls.plannedHires > 0 ||
        founderControls.marketingBudget > 0;

    const fmt = (n: number) => {
        if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
        return '$' + n.toLocaleString('en-US');
    };

    const scoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const handleGenerateThesis = async () => {
        if (!adjusted) return;
        setGeneratingThesis(true);
        try {
            const res = await fetch('/api/investment-thesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startupData: {
                        runwayMonths: adjusted.adjustedRunway,
                        monthlyBurn: adjusted.adjustedBurn,
                        survivalScore: adjusted.adjustedSurvivalScore,
                    },
                }),
            });
            const data = await res.json();
            setThesis(data);
        } catch {
            setThesis({
                valuation: 2000000,
                askAmount: 500000,
                equity: 20,
                expectedROI: 'Unknown',
                risk: 'High',
                summary: 'Analysis failed. Proceed with caution.',
                comparable: ['Unknown'],
            });
        } finally {
            setGeneratingThesis(false);
        }
    };

    const { addToast } = useToast();

    const handleAddToPortfolio = () => {
        if (!thesis || !startupName) return; // Use Name (Title) check
        const fundability = adjusted ? calculateFundability({ runwayMonths: adjusted.adjustedRunway, monthlyBurn: adjusted.adjustedBurn, survivalScore: adjusted.adjustedSurvivalScore }) : 50;

        // Use the actual backend ID if available, otherwise fallback
        const finalId = savedStartupId || uuidv4();
        console.log("Adding to Portfolio with ID:", finalId);

        addInvestment({
            id: finalId,
            startupName: startupName, // Use Title
            ticker: startupName.substring(0, 4).toUpperCase(),
            valuation: thesis.valuation,
            askAmount: thesis.askAmount,
            equity: thesis.equity,
            shares: 1000,
            costBasis: thesis.askAmount,
            thesisSummary: thesis.summary,
            fundabilityScore: fundability,
            risk: thesis.risk,
            roi: thesis.expectedROI,
            dateAdded: new Date().toISOString(),
        });
        setIsAdded(true);
        addToast('Deal added to Venture Portfolio', 'success');
    };

    const scoreBg = (score: number) => {
        if (score >= 70) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
        if (score >= 40) return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
        return 'from-red-500/20 to-red-500/5 border-red-500/30';
    };

    const handleTrackExisting = (startup: Startup) => {
        // Quick check to see if already added (optional)
        // For now, just add it.
        addInvestment({
            id: startup.id,
            startupName: startup.name,
            ticker: startup.name.substring(0, 4).toUpperCase(),
            valuation: 1000000, // Default valuation for existing items without full thesis
            askAmount: 100000,  // Default ask
            equity: 10,
            shares: 1000,
            costBasis: 0,
            thesisSummary: `Added from history. Created on ${new Date(startup.created_at).toLocaleDateString()}`,
            fundabilityScore: startup.survival_score,
            risk: "Medium",
            roi: "Unknown",
            dateAdded: new Date().toISOString()
        });
        addToast(`Added "${startup.name}" to Portfolio`, "success");
    };

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Header />

                    <div className="mb-16">
                        <InputSection onGenerate={handleGenerate} isLoading={loading} />
                    </div>

                    {/* My Created Startups Section */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-white mb-6">My Created Startups</h2>
                        {myStartupsLoading ? (
                            <div className="text-gray-400">Loading startups...</div>
                        ) : myStartups.length === 0 ? (
                            <div className="text-gray-500 italic border border-gray-800 rounded-xl p-8 text-center bg-gray-900/50">
                                No startups created yet. Launch a simulation to get started.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myStartups.map((startup) => (
                                    <div key={startup.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-white mb-1">{startup.name}</h3>
                                                <p className="text-xs text-gray-500">
                                                    Created: {new Date(startup.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${startup.survival_score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                                                startup.survival_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                Score: {startup.survival_score}
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-400 mb-4 flex-grow">
                                            <div className="flex justify-between">
                                                <span>Revenue</span>
                                                <span className="text-white">${startup.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Burn</span>
                                                <span className="text-white">${startup.burn.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Runway</span>
                                                <span className="text-white">{startup.runway} mo</span>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full mt-4"
                                            onClick={() => handleTrackExisting(startup)}
                                        >
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            Track in Portfolio
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Loading spinner */}
                    {loading && (
                        <div className="text-center py-16">
                            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                            <p className="text-gray-300 mt-4 text-base font-medium">Generating financial model...</p>
                            <p className="text-gray-500 mt-1 text-sm">Analyzing market conditions</p>
                        </div>
                    )}

                    {!loading && startupName && baseFinancialData && founderAdjusted && adjusted && (
                        <>
                            <div className="text-center mb-8">
                                <p className="text-gray-400 text-sm">
                                    Showing results for:{' '}
                                    <span className="text-blue-400 font-medium">&ldquo;{startupName}&rdquo;</span>
                                </p>
                                {provider && (
                                    <p className="text-gray-500 text-xs mt-1">
                                        Powered by: {providerLabel(provider)}
                                    </p>
                                )}
                            </div>

                            {/* ═══ SURVIVAL SCORE — HERO ELEMENT ═══ */}
                            <div className={`mb-8 rounded-2xl border bg-gradient-to-br ${scoreBg(adjusted.adjustedSurvivalScore)} p-8 text-center transition-all duration-500`}>
                                <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Survival</p>
                                <p className={`text-8xl font-black tabular-nums transition-all duration-500 ${scoreColor(adjusted.adjustedSurvivalScore)}`}>
                                    {adjusted.adjustedSurvivalScore}%
                                </p>
                                <p className="text-gray-500 text-sm mt-3">{contextLabel()}</p>
                                {adjusted.adjustedSurvivalScore !== baseFinancialData.survivalScore && (
                                    <p className="text-gray-600 text-xs mt-1">
                                        AI base: {baseFinancialData.survivalScore}%
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Business Model Card */}
                                <ResultCard title="Business Model">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                            <span className="text-gray-400">Monthly Revenue</span>
                                            <span className="text-lg font-semibold text-emerald-400">
                                                {fmt(baseFinancialData.revenue)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                            <span className="text-gray-400">Monthly Burn</span>
                                            <div className="text-right">
                                                <span
                                                    className={`text-lg font-semibold transition-colors duration-300 ${isStressed || isFounderModified ? 'text-orange-400' : 'text-red-400'
                                                        }`}
                                                >
                                                    {fmt(adjusted.adjustedBurn)}
                                                </span>
                                                {(isStressed || isFounderModified) && (
                                                    <span className="block text-xs text-gray-500 line-through">
                                                        {fmt(baseFinancialData.burn)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                            <span className="text-gray-400">Growth Rate</span>
                                            <div className="text-right">
                                                <span
                                                    className={`text-lg font-semibold transition-colors duration-300 ${adjusted.adjustedGrowth !== baseFinancialData.growth
                                                        ? adjusted.adjustedGrowth > baseFinancialData.growth
                                                            ? 'text-emerald-400'
                                                            : 'text-yellow-400'
                                                        : 'text-blue-400'
                                                        }`}
                                                >
                                                    {adjusted.adjustedGrowth}%
                                                </span>
                                                {adjusted.adjustedGrowth !== baseFinancialData.growth && (
                                                    <span className="block text-xs text-gray-500 line-through">
                                                        {baseFinancialData.growth}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                            <span className="text-gray-400">Team Size</span>
                                            <span className="text-lg font-semibold text-white">
                                                {founderAdjusted.team + stressControls.hiringExpansion} people
                                                {(founderControls.plannedHires > 0 || stressControls.hiringExpansion > 0) && (
                                                    <span className="text-xs text-purple-400 ml-1">
                                                        (+{founderControls.plannedHires + stressControls.hiringExpansion})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-400">Cash in Bank</span>
                                            <div className="text-right">
                                                <span className="text-lg font-semibold text-emerald-400">
                                                    {fmt(founderAdjusted.cash)}
                                                </span>
                                                {founderControls.startingCapital !== null && (
                                                    <span className="block text-xs text-gray-500 line-through">
                                                        {fmt(baseFinancialData.cash)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ResultCard>

                                {/* Runway Card */}
                                <ResultCard title="Runway">
                                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-4">
                                        <p className="text-7xl font-black text-white tabular-nums transition-all duration-500">
                                            {adjusted.adjustedRunway}
                                            <span className="text-2xl font-normal text-gray-400 ml-2">months</span>
                                        </p>
                                        {adjusted.adjustedRunway !== baseFinancialData.runway && (
                                            <p className="text-xs text-gray-500">
                                                AI base: {baseFinancialData.runway} months
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-500">
                                            {isFounderModified && isStressed
                                                ? 'Adjusted after founder controls + stress'
                                                : isFounderModified
                                                    ? 'Adjusted after founder controls'
                                                    : isStressed
                                                        ? 'Under stress scenario'
                                                        : 'Based on current model'}
                                        </p>
                                    </div>
                                </ResultCard>
                            </div>

                            {/* Founder Controls */}
                            <div className="mb-6">
                                <FounderControlsPanel
                                    controls={founderControls}
                                    aiCash={baseFinancialData.cash}
                                    onChange={setFounderControls}
                                />
                            </div>

                            {/* Stress Test */}
                            <div className="mb-6">
                                <StressTestPanel controls={stressControls} onChange={setStressControls} />
                            </div>

                            {/* AI CFO Advice */}
                            <AdvicePanel
                                advice={advice}
                                loading={adviceLoading}
                                loadingText="AI CFO analyzing scenario..."
                            />

                            {/* Investment Thesis Section */}
                            {adjusted && (
                                <div className="mt-8 pt-8 border-t border-gray-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                                <Briefcase className="w-6 h-6 text-emerald-400" />
                                                Investment Analysis
                                            </h2>
                                            <p className="text-gray-400 text-sm">Validating for Portfolio Inclusion</p>
                                        </div>
                                        {!thesis && (
                                            <Button
                                                onClick={handleGenerateThesis}
                                                isLoading={generatingThesis}
                                                variant="secondary"
                                            >
                                                Generate Investment Thesis
                                            </Button>
                                        )}
                                    </div>

                                    {thesis && (
                                        <div className="max-w-md">
                                            <InvestmentCard
                                                data={thesis}
                                                onAdd={handleAddToPortfolio}
                                                isAdded={isAdded}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}
