'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface InvestmentItem {
    id: string;
    startupName: string;
    ticker: string;
    valuation: number;
    askAmount: number;
    equity: number;
    shares: number;
    costBasis: number;
    thesisSummary: string;
    fundabilityScore: number;
    risk: string;
    roi: string;
    dateAdded: string;
}

export interface GeneratedAsset {
    symbol: string;
    name: string;
    percentage: number;
    type: string;
    reasoning: string;
    prediction?: any;
}

export interface GeneratedPortfolio {
    strategyName: string;
    description: string;
    expectedReturn: string;
    riskScore: number;
    allocation: GeneratedAsset[];
    totalAmount: number;
}

interface PortfolioContextType {
    investments: InvestmentItem[];
    addInvestment: (item: InvestmentItem) => void;
    removeInvestment: (id: string) => void;
    isLoading: boolean;
    generatedPortfolio: GeneratedPortfolio | null;
    setGeneratedPortfolio: (portfolio: GeneratedPortfolio | null) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [investments, setInvestments] = useState<InvestmentItem[]>([]);
    const [generatedPortfolio, setGeneratedPortfolio] = useState<GeneratedPortfolio | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                // 1. Try Local Storage first for speed
                const stored = localStorage.getItem('genfin_portfolio');
                const storedGen = localStorage.getItem('genfin_generated_portfolio');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Deduplicate by id to prevent duplicate-key errors
                    const seen = new Set<string>();
                    const deduped = parsed.filter((i: InvestmentItem) => {
                        if (seen.has(i.id)) return false;
                        seen.add(i.id);
                        return true;
                    });
                    setInvestments(deduped);

                    // Validate startup IDs against DB to auto-remove deleted startups
                    const token = localStorage.getItem('token');
                    if (token && deduped.length > 0) {
                        try {
                            const ids = deduped.map((i: InvestmentItem) => i.id);
                            const valRes = await fetch('http://localhost:8000/startups/validate-ids', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify(ids),
                            });
                            if (valRes.ok) {
                                const { valid_ids } = await valRes.json();
                                const validSet = new Set<string>(valid_ids);
                                const cleaned = deduped.filter((i: InvestmentItem) => validSet.has(i.id));
                                if (cleaned.length < deduped.length) {
                                    console.log(`Portfolio auto-cleanup: removed ${deduped.length - cleaned.length} deleted startups`);
                                    setInvestments(cleaned);
                                }
                            }
                        } catch { /* validation optional, ignore errors */ }
                    }
                }
                if (storedGen) setGeneratedPortfolio(JSON.parse(storedGen));

                // 2. Sync with Backend
                const token = localStorage.getItem('token');
                if (token) {
                    const res = await fetch('http://localhost:8000/portfolio/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Map backend allocation to GeneratedPortfolio format
                        const mappedPortfolio: GeneratedPortfolio = {
                            strategyName: "AI Startup Strategy",
                            description: "Auto-generated allocation based on capital requirements.",
                            expectedReturn: "8-12%",
                            riskScore: 7,
                            totalAmount: data.monthly_investment,
                            allocation: data.allocation.map((a: any) => ({
                                symbol: a.asset.substring(0, 4).toUpperCase(),
                                name: a.asset,
                                percentage: a.percent,
                                type: "Asset",
                                reasoning: "Strategic Allocation"
                            }))
                        }
                        setGeneratedPortfolio(mappedPortfolio);
                    }
                }
            } catch (e) {
                console.error('Failed to load portfolio', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadPortfolio();
    }, []);

    // Listen for startup deletions from other pages
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.id) {
                console.log('Global startup delete triggered — removing from portfolio:', detail.id);
                setInvestments(prev => prev.filter(i => i.id !== detail.id));
            }
        };
        window.addEventListener('startupDeleted', handler);
        return () => window.removeEventListener('startupDeleted', handler);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('genfin_portfolio', JSON.stringify(investments));
            if (generatedPortfolio) {
                localStorage.setItem('genfin_generated_portfolio', JSON.stringify(generatedPortfolio));
            } else {
                localStorage.removeItem('genfin_generated_portfolio');
            }
        }
    }, [investments, generatedPortfolio, isLoading]);

    const addInvestment = (item: InvestmentItem) => {
        setInvestments((prev) => {
            // Prevent duplicates: skip if id already exists
            if (prev.some(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeInvestment = (id: string) => {
        console.log('Portfolio remove triggered — local only, startup still exists globally:', id);
        setInvestments((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <PortfolioContext.Provider value={{ investments, addInvestment, removeInvestment, isLoading, generatedPortfolio, setGeneratedPortfolio }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}
