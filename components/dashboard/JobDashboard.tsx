'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowRight, Bot, LayoutDashboard, Brain, TrendingUp, PieChart, Shield } from 'lucide-react';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { JobPlanCard } from '@/components/dashboard/JobPlanCard';

import { calculateHealthScore } from '@/lib/healthScore';
import { usePortfolio } from '@/lib/portfolioStore';
import PortfolioPreviewCard from '@/components/dashboard/PortfolioPreviewCard';
import { UserProfile } from '@/lib/getUserProfile';

interface JobDashboardProps {
    profile: UserProfile;
}

export const JobDashboard: React.FC<JobDashboardProps> = ({ profile }) => {
    const { investments, generatedPortfolio } = usePortfolio();
    const [jobPlan, setJobPlan] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [recLoading, setRecLoading] = useState(false);
    const [portfolio, setPortfolio] = useState<any>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('http://localhost:8000/finance/job-plan', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setJobPlan(data);
                }
            } catch (e) {
                console.error("Failed to fetch job plan");
            }
        };
        fetchPlan();

        const fetchRecs = async () => {
            setRecLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch('http://localhost:8000/recommendations/job', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data);
                }

                const resPort = await fetch('http://localhost:8000/portfolio/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resPort.ok) {
                    const portData = await resPort.json();
                    setPortfolio(portData);
                }
            } catch (e) {
                console.error("Failed to fetch data", e);
            } finally {
                setRecLoading(false);
            }
        };
        fetchRecs();
    }, []);

    const healthScore = useMemo(() => {
        const portfolioValue = generatedPortfolio
            ? generatedPortfolio.totalAmount
            : investments.reduce((sum, inv) => sum + inv.costBasis, 0);

        const riskScore = generatedPortfolio
            ? generatedPortfolio.riskScore
            : investments.length > 0
                ? Math.round(investments.reduce((sum, inv) => sum + (10 - inv.fundabilityScore / 10), 0) / investments.length)
                : 4;

        const hasPortfolioData = investments.length > 0 || generatedPortfolio;

        return calculateHealthScore({
            runwayMonths: hasPortfolioData ? 14 : 18,
            netWorth: hasPortfolioData ? portfolioValue * 1.6 : 125000,
            monthlyBurn: hasPortfolioData ? Math.max(portfolioValue * 0.03, 3000) : 4000,
            portfolioValue: portfolioValue || 75000,
            riskScore: riskScore,
        });
    }, [investments, generatedPortfolio]);

    const fetchPortfolio = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const resPort = await fetch('http://localhost:8000/portfolio/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resPort.ok) {
                const portData = await resPort.json();
                setPortfolio(portData);
            }
        } catch (e) {
            console.error("Failed to fetch portfolio", e);
        }
    };

    return (
        <>
            {/* Financial Health Score */}
            <section className="w-full max-w-4xl px-4 pb-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 space-y-6">
                <HealthScoreCard scoreData={healthScore} />

                {/* Financial Recommendations */}
                {/* Financial Recommendations Removed - Only Portfolio Preview Remains */}
                {portfolio && (
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-250 space-y-6">
                        <PortfolioPreviewCard
                            portfolio={portfolio}
                            strategyType={profile.investment_amount ? 'user' : 'ai'}
                        />
                    </div>
                )}

                {jobPlan && (
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <JobPlanCard plan={jobPlan} />
                    </div>
                )}
            </section>

            {/* Features Grid - Job Specific */}
            <section className="w-full max-w-7xl px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/tracker" className="group">
                    <Card className="h-full hover:border-emerald-500/50 transition-colors group-hover:bg-gray-900">
                        <div className="h-12 w-12 bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Market Tracker</h3>
                        <p className="text-gray-400">
                            Real-time stock tracking and predictive analytics powered by machine learning models.
                        </p>
                    </Card>
                </Link>

                <Link href="/portfolio" className="group">
                    <Card className="h-full hover:border-orange-500/50 transition-colors group-hover:bg-gray-900">
                        <div className="h-12 w-12 bg-orange-900/20 rounded-lg flex items-center justify-center mb-4 text-orange-400">
                            <PieChart className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Portfolio Manager</h3>
                        <p className="text-gray-400">
                            Visualize asset allocation, analyze diversity, and optimize for long-term growth.
                        </p>
                    </Card>
                </Link>

                <Link href="/personal-finance" className="group">
                    <Card className="h-full hover:border-pink-500/50 transition-colors group-hover:bg-gray-900">
                        <div className="h-12 w-12 bg-pink-900/20 rounded-lg flex items-center justify-center mb-4 text-pink-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">Personal Finance</h3>
                        <p className="text-gray-400">
                            Track income, expenses, and savings goals with intelligent insights.
                        </p>
                    </Card>
                </Link>
            </section>
        </>
    );
};
