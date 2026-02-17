'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { PieChart, TrendingUp, Shield, ArrowRight, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePortfolio } from '@/lib/portfolioStore'

interface JobPlan {
    monthly_income: number
    monthly_expenses: number
    recommended_savings: number
    recommended_investment: number
    recommended_emergency_fund: number
    message: string
}

export function JobPlanCard({ plan }: { plan: JobPlan }) {
    const router = useRouter()

    // Check if usePortfolio hook exists/works, otherwise we might need another way to pass data
    // Assuming usePortfolio has a way to set investment amount or we pass it via query param
    // For this task, we will simulate "Sending" by redirecting to portfolio with a query param
    // or if the store allows setting it directly.

    const handleSendToPortfolio = () => {
        // Option 1: URL Query Param (safest for cross-page)
        router.push(`/portfolio?initial_amount=${plan.recommended_investment}`)

        // Option 2: Store (if store persists or if we just want to navigate)
        // If the store is persistent (e.g. zustand with persist middleware), we could set it:
        // setInvestmentAmount(plan.recommended_investment)
        // but let's stick to URL param for simplicity or just navigation.
    }

    return (
        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Auto Financial Plan</h3>
                    <p className="text-sm text-gray-400">AI-Recommended Allocation</p>
                </div>
            </div>

            <div className="space-y-6">
                <p className="text-gray-300 text-sm italic border-l-2 border-blue-500 pl-3">
                    "{plan.message}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Savings (20%)</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">
                            ${plan.recommended_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-300 uppercase tracking-wider font-semibold">Invest (15%)</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                            ${plan.recommended_investment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Emergency (5%)</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-400">
                            ${plan.recommended_emergency_fund.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleSendToPortfolio}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors group"
                    >
                        <span>Send Investment to Portfolio</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        Prefills the Portfolio Generator with ${plan.recommended_investment.toLocaleString()}
                    </p>
                </div>
            </div>
        </Card>
    )
}
