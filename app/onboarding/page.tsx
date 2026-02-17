'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { saveProfile } from '@/lib/getUserProfile'
import { Briefcase, User, ArrowRight, ArrowLeft, Loader2, CheckCircle, DollarSign, Users, BarChart3, FileText, TrendingUp } from 'lucide-react'

type UserType = 'job' | 'startup' | null
type Step = 'choose' | 'form' | 'saving'

export default function OnboardingPage() {
    const { user, profile, profileLoading, refreshProfile } = useAuth()
    const router = useRouter()

    const [step, setStep] = useState<Step>('choose')
    const [userType, setUserType] = useState<UserType>(null)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Job fields
    const [monthlyIncome, setMonthlyIncome] = useState('')
    const [monthlyExpenses, setMonthlyExpenses] = useState('')
    const [currentSavings, setCurrentSavings] = useState('')
    const [investmentOverride, setInvestmentOverride] = useState('') // New optional field
    const [riskTolerance, setRiskTolerance] = useState('moderate')
    const [investmentGoal, setInvestmentGoal] = useState('wealth_growth')

    // Startup fields
    const [annualRevenue, setAnnualRevenue] = useState('')
    const [employeeCount, setEmployeeCount] = useState('')
    const [annualBudget, setAnnualBudget] = useState('')
    const [marketDescription, setMarketDescription] = useState('')

    // If already has profile AND user_type, redirect to dashboard
    React.useEffect(() => {
        if (!profileLoading && profile?.user_type) {
            router.replace('/')
        }
    }, [profile, profileLoading, router])

    // If not logged in, redirect to login
    React.useEffect(() => {
        if (!user && !profileLoading) {
            router.replace('/login')
        }
    }, [user, profileLoading, router])

    const handleChoose = (type: UserType) => {
        setUserType(type)
        setStep('form')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !userType) return

        setError(null)
        setSaving(true)
        setStep('saving')

        try {
            // Calculate AI Investment if needed
            const income = parseFloat(monthlyIncome) || 0;
            const expenses = parseFloat(monthlyExpenses) || 0;
            const aiInvestment = Math.max((income - expenses) * 0.3, 0);

            const profileData = userType === 'job'
                ? {
                    user_type: 'job' as const,
                    monthly_income: income,
                    monthly_expenses: expenses,
                    current_savings: parseFloat(currentSavings) || 0,
                    // Send both fields
                    investment_amount: investmentOverride ? parseFloat(investmentOverride) : null,
                    ai_investment_amount: aiInvestment,

                    risk_tolerance: riskTolerance,
                    investment_goal: investmentGoal,
                    annual_revenue: null,
                    employee_count: null,
                    annual_budget: null,
                    market_description: null,
                }
                : {
                    id: user.id,
                    user_type: 'startup' as const,
                    monthly_income: null,
                    monthly_expenses: null,
                    // current_savings etc are null for startup
                    current_savings: null,
                    risk_tolerance: null,
                    investment_goal: null,
                    annual_revenue: parseFloat(annualRevenue) || 0,
                    employee_count: parseInt(employeeCount) || 0,
                    annual_budget: parseFloat(annualBudget) || 0,
                    market_description: marketDescription || null,
                }

            const { error: saveError } = await saveProfile(profileData)
            if (saveError) {
                setError(saveError)
                setStep('form')
                setSaving(false)
                return
            }

            await refreshProfile()
            router.replace('/')
        } catch {
            setError('Something went wrong. Please try again.')
            setStep('form')
            setSaving(false)
        }
    }

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
            <div className="w-full max-w-xl">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-bold text-white text-2xl">G</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        GenFin Studio
                    </h1>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {['Type', 'Details', 'Done'].map((label, i) => {
                        const stepIndex = step === 'choose' ? 0 : step === 'form' ? 1 : 2
                        const isActive = i <= stepIndex
                        return (
                            <React.Fragment key={label}>
                                <div className={`flex items-center gap-1.5 ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isActive ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-gray-700 text-gray-600'
                                        }`}>
                                        {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <span className="text-xs font-medium hidden sm:inline">{label}</span>
                                </div>
                                {i < 2 && <div className={`w-12 h-0.5 ${i < stepIndex ? 'bg-blue-500' : 'bg-gray-700'}`} />}
                            </React.Fragment>
                        )
                    })}
                </div>

                {/* Card */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl shadow-black/40">

                    {/* STEP 1: Choose Type */}
                    {step === 'choose' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-white mb-1">What best describes you?</h2>
                                <p className="text-sm text-gray-400">This helps us tailor your experience</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleChoose('job')}
                                    className="group p-6 rounded-xl border-2 border-gray-700 hover:border-blue-500/60 bg-gray-800/40 hover:bg-blue-500/5 transition-all duration-200 text-left"
                                >
                                    <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                                        <User className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">I have a job</h3>
                                    <p className="text-sm text-gray-400">Track personal income, expenses, and savings goals</p>
                                </button>

                                <button
                                    onClick={() => handleChoose('startup')}
                                    className="group p-6 rounded-xl border-2 border-gray-700 hover:border-emerald-500/60 bg-gray-800/40 hover:bg-emerald-500/5 transition-all duration-200 text-left"
                                >
                                    <div className="p-3 bg-emerald-500/10 rounded-lg w-fit mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                        <Briefcase className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">I run a startup</h3>
                                    <p className="text-sm text-gray-400">Manage revenue, team, budgets, and market analysis</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Form */}
                    {step === 'form' && userType && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setStep('choose'); setError(null) }}
                                    className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        {userType === 'job' ? 'Your Financials' : 'Your Business'}
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        {userType === 'job' ? 'Tell us about your income and expenses' : 'Tell us about your startup'}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Job / Individual Fields */}
                            {userType === 'job' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                            Monthly Income ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={monthlyIncome}
                                            onChange={(e) => setMonthlyIncome(e.target.value)}
                                            placeholder="e.g. 5000"
                                            required
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                            Monthly Expenses ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={monthlyExpenses}
                                            onChange={(e) => setMonthlyExpenses(e.target.value)}
                                            placeholder="e.g. 3000"
                                            required
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                                            Investment Amount (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            value={investmentOverride}
                                            onChange={(e) => setInvestmentOverride(e.target.value)}
                                            placeholder="Leave empty for AI recommendation"
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                            Current Savings ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={currentSavings}
                                            onChange={(e) => setCurrentSavings(e.target.value)}
                                            placeholder="e.g. 10000"
                                            required
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                Risk Tolerance
                                            </label>
                                            <select
                                                value={riskTolerance}
                                                onChange={(e) => setRiskTolerance(e.target.value)}
                                                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            >
                                                <option value="low">Low (Conservative)</option>
                                                <option value="moderate">Moderate (Balanced)</option>
                                                <option value="high">High (Aggressive)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                Investment Goal
                                            </label>
                                            <select
                                                value={investmentGoal}
                                                onChange={(e) => setInvestmentGoal(e.target.value)}
                                                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            >
                                                <option value="retirement">Retirement</option>
                                                <option value="wealth_growth">Wealth Growth</option>
                                                <option value="safety">Safety / Emergency Fund</option>
                                                <option value="major_purchase">Major Purchase (House, Car)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
                                            Annual Revenue / Net Worth ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={annualRevenue}
                                            onChange={(e) => setAnnualRevenue(e.target.value)}
                                            placeholder="e.g. 500000"
                                            required
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <Users className="w-3.5 h-3.5 inline mr-1" />
                                            Number of Employees
                                        </label>
                                        <input
                                            type="number"
                                            value={employeeCount}
                                            onChange={(e) => setEmployeeCount(e.target.value)}
                                            placeholder="e.g. 10"
                                            required
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                            Annual Budget ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={annualBudget}
                                            onChange={(e) => setAnnualBudget(e.target.value)}
                                            placeholder="e.g. 200000"
                                            required
                                            min="0"
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            <FileText className="w-3.5 h-3.5 inline mr-1" />
                                            Market Situation
                                        </label>
                                        <textarea
                                            value={marketDescription}
                                            onChange={(e) => setMarketDescription(e.target.value)}
                                            placeholder="Describe your target market, competitive landscape, and current situation..."
                                            rows={3}
                                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-4 h-4" />
                                )}
                                {saving ? 'Saving...' : 'Complete Setup'}
                            </button>
                        </form>
                    )}

                    {/* STEP 3: Saving */}
                    {step === 'saving' && (
                        <div className="text-center py-8 space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                            <h2 className="text-xl font-semibold text-white">Setting up your workspace...</h2>
                            <p className="text-sm text-gray-400">This will only take a moment</p>
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-600 text-center mt-4">
                    Your data is securely stored with Supabase
                </p>
            </div>
        </div>
    )
}
