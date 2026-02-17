'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
    DollarSign, CreditCard, Wallet, TrendingUp,
    PiggyBank, ArrowUpRight, ArrowDownRight, Briefcase,
    Pencil, Save, X, Clock, AlertTriangle, Landmark
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { toastStore } from '@/lib/toastStore';

/* ─── Types ──────────────────────────────────────────── */

interface FinanceData {
    monthly_income: number;
    monthly_expenses: number;
    current_savings: number;
    portfolio_value: number;
    net_worth: number;
    monthly_investment?: number;
}

interface TreasuryData {
    cash_balance: number;
    annual_revenue: number;
    monthly_expenses: number;
    debt: number;
    other_assets: number;
}

const EMPTY_TREASURY: TreasuryData = {
    cash_balance: 0,
    annual_revenue: 0,
    monthly_expenses: 0,
    debt: 0,
    other_assets: 0,
};

/* ─── Component ──────────────────────────────────────── */

export default function PersonalFinancePage() {
    const { profile, refreshProfile } = useAuth();

    // Data Loading State
    const [data, setData] = useState<FinanceData | null>(null);
    const [treasury, setTreasury] = useState<TreasuryData>(EMPTY_TREASURY);
    const [loading, setLoading] = useState(true);

    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<TreasuryData>(EMPTY_TREASURY);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Legacy edit (job users — now full edit mode)
    const [isEditingInvestment, setIsEditingInvestment] = useState(false);
    const [savingInvestment, setSavingInvestment] = useState(false);
    const [jobForm, setJobForm] = useState({ monthly_income: 0, monthly_expenses: 0, current_savings: 0, monthly_investment: 0 });

    const isStartup = profile?.user_type === 'startup';

    /* ── Fetch treasury data (startup) ───────────────── */
    const fetchTreasury = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('http://localhost:8000/finance/treasury', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json: TreasuryData = await res.json();
                setTreasury(json);
            }
        } catch (e) {
            console.error('Failed to fetch treasury', e);
        }
    }, []);

    /* ── Fetch job finance data ──────────────────────── */
    const fetchFinance = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('http://localhost:8000/finance/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            if (isStartup) {
                await fetchTreasury();
            } else {
                await fetchFinance();
            }
            setLoading(false);
        };
        load();
    }, [isStartup, fetchTreasury, fetchFinance]);

    /* ── Helpers ──────────────────────────────────────── */
    const formatCur = (n?: number | null) => {
        if (n === null || n === undefined) return "$0";
        return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
    };

    const formatMonths = (n?: number | null) => {
        if (n === null || n === undefined) return "0 mo";
        return `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 })} mo`;
    };

    /* ── Treasury Edit Logic ─────────────────────────── */
    const startEditing = () => {
        setForm({ ...treasury });
        setErrors({});
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setErrors({});
    };

    const handleFieldChange = (field: keyof TreasuryData, value: string) => {
        const numVal = value === '' ? 0 : parseFloat(value);
        setForm(prev => ({ ...prev, [field]: numVal }));
        // Clear error for this field on change
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const fields: (keyof TreasuryData)[] = [
            'cash_balance', 'annual_revenue', 'monthly_expenses',
            'debt', 'other_assets'
        ];
        for (const field of fields) {
            const val = form[field];
            if (val === null || val === undefined || isNaN(val)) {
                newErrors[field] = 'Required';
            } else if (val < 0) {
                newErrors[field] = 'Must be ≥ 0';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveTreasury = async () => {
        if (!validateForm()) {
            toastStore.add('Please fix the errors before saving', 'error');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/finance/treasury', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || 'Update failed');
            }

            // Success: refresh from DB
            await fetchTreasury();
            await refreshProfile();
            setIsEditing(false);
            toastStore.add('Treasury updated', 'success');
        } catch (e: any) {
            console.error(e);
            toastStore.add(e.message || 'Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };



    /* ── Render ───────────────────────────────────────── */
    if (loading) return <div className="p-12 text-center text-gray-500"><Spinner /></div>;

    // ── STARTUP VIEW (Corporate Treasury) ─────────────
    if (isStartup) {
        const treasuryFields: {
            key: keyof TreasuryData;
            label: string;
            icon: React.ReactNode;
            color: string;
            isCurrency: boolean;
        }[] = [
                { key: 'cash_balance', label: 'Cash Balance', icon: <Wallet className="w-6 h-6 text-emerald-400" />, color: 'emerald', isCurrency: true },
                { key: 'annual_revenue', label: 'Annual Revenue', icon: <TrendingUp className="w-6 h-6 text-blue-400" />, color: 'blue', isCurrency: true },
                { key: 'monthly_expenses', label: 'Monthly Expenses', icon: <CreditCard className="w-6 h-6 text-red-400" />, color: 'red', isCurrency: true },
                { key: 'debt', label: 'Debt', icon: <AlertTriangle className="w-6 h-6 text-orange-400" />, color: 'orange', isCurrency: true },
                { key: 'other_assets', label: 'Other Assets', icon: <Landmark className="w-6 h-6 text-purple-400" />, color: 'purple', isCurrency: true },
            ];

        // Compute total liquidity from treasury
        const totalLiquidity = treasury.cash_balance + treasury.other_assets;

        return (
            <ProtectedRoute>
                <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                    <header className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Briefcase className="w-8 h-8 text-blue-400" />
                                <h1 className="text-3xl font-bold text-white">Corporate Treasury</h1>
                            </div>
                            <p className="text-gray-400">Manage operating accounts, burn rate, and capital allocation.</p>
                        </div>

                        {/* Edit / Save / Cancel buttons */}
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={saveTreasury}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Treasury
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Total Liquidity Hero */}
                    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 p-8">
                        <div className="flex items-center gap-6">
                            <div className="p-5 rounded-full bg-slate-700">
                                <Wallet className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-wider font-semibold mb-1 text-slate-400">Total Liquidity</p>
                                <h2 className="text-5xl font-bold text-white">{formatCur(totalLiquidity)}</h2>
                            </div>
                        </div>
                    </Card>

                    {/* Treasury Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {treasuryFields.map(({ key, label, icon, color, isCurrency }) => (
                            <Card key={key} className="hover:bg-gray-900/80 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                                        {icon}
                                    </div>

                                    {key === 'monthly_expenses' && (
                                        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                                            <ArrowDownRight className="w-3 h-3" /> Monthly
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">{label}</p>

                                {isEditing ? (
                                    <div className="mt-1">
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form[key] || ''}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className={`w-full bg-gray-800 border ${errors[key] ? 'border-red-500' : 'border-gray-700'} text-white text-lg font-bold rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors`}
                                            placeholder="0"
                                        />
                                        {errors[key] && (
                                            <p className="text-red-400 text-xs mt-1">{errors[key]}</p>
                                        )}
                                    </div>
                                ) : (
                                    <h3 className="text-2xl font-bold text-white">
                                        {isCurrency ? formatCur(treasury[key]) : formatMonths(treasury[key])}
                                    </h3>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ── JOB USER VIEW (Personal Finance) ──────────────
    if (!data) return <div className="p-12 text-center text-red-400">Failed to load finance data.</div>;

    /* ── Job-user edit helpers ──────────────────────── */
    interface JobFinanceForm {
        monthly_income: number;
        monthly_expenses: number;
        current_savings: number;
        monthly_investment: number;
    }

    const jobFields: {
        key: keyof JobFinanceForm;
        label: string;
        icon: React.ReactNode;
        color: string;
        badge?: { text: string; direction: 'up' | 'down' };
    }[] = [
            { key: 'monthly_income', label: 'Monthly Income', icon: <TrendingUp className="w-6 h-6 text-emerald-400" />, color: 'emerald', badge: { text: 'Monthly', direction: 'up' } },
            { key: 'monthly_expenses', label: 'Monthly Expenses', icon: <CreditCard className="w-6 h-6 text-red-400" />, color: 'red', badge: { text: 'Monthly', direction: 'down' } },
            { key: 'current_savings', label: 'Liquid Savings', icon: <Wallet className="w-6 h-6 text-blue-400" />, color: 'blue' },
            { key: 'monthly_investment', label: 'Investment Portfolio', icon: <PiggyBank className="w-6 h-6 text-purple-400" />, color: 'purple' },
        ];

    return (
        <ProtectedRoute>
            <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-8 h-8 text-emerald-400" />
                            <h1 className="text-3xl font-bold text-white">Personal Finance</h1>
                        </div>
                        <p className="text-gray-400">Real-time overview of your financial health.</p>
                    </div>

                    {/* Edit / Save / Cancel */}
                    <div className="flex items-center gap-2">
                        {isEditingInvestment ? (
                            <>
                                <button
                                    onClick={async () => {
                                        // Validate
                                        const formErrors: Record<string, string> = {};
                                        for (const f of jobFields) {
                                            const v = (jobForm as any)[f.key];
                                            if (v === null || v === undefined || isNaN(v)) formErrors[f.key] = 'Required';
                                            else if (v < 0) formErrors[f.key] = 'Must be ≥ 0';
                                        }
                                        setErrors(formErrors);
                                        if (Object.keys(formErrors).length > 0) {
                                            toastStore.add('Please fix errors before saving', 'error');
                                            return;
                                        }

                                        setSavingInvestment(true);
                                        try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch('http://localhost:8000/finance/personal', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                body: JSON.stringify(jobForm),
                                            });
                                            if (!res.ok) {
                                                const err = await res.json().catch(() => null);
                                                throw new Error(err?.detail || 'Update failed');
                                            }
                                            await fetchFinance();
                                            await refreshProfile();
                                            setIsEditingInvestment(false);
                                            toastStore.add('Finance updated', 'success');
                                        } catch (e: any) {
                                            toastStore.add(e.message || 'Update failed', 'error');
                                        } finally {
                                            setSavingInvestment(false);
                                        }
                                    }}
                                    disabled={savingInvestment}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {savingInvestment ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => { setIsEditingInvestment(false); setErrors({}); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setJobForm({
                                        monthly_income: data.monthly_income || 0,
                                        monthly_expenses: data.monthly_expenses || 0,
                                        current_savings: data.current_savings || 0,
                                        monthly_investment: data.monthly_investment || 0,
                                    });
                                    setErrors({});
                                    setIsEditingInvestment(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Finance
                            </button>
                        )}
                    </div>
                </header>

                {/* Net Worth Hero */}
                <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-800 p-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 rounded-full bg-blue-500/20">
                            <DollarSign className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-wider font-semibold mb-1 text-blue-300">Total Net Worth</p>
                            <h2 className="text-5xl font-bold text-white">{formatCur(data.net_worth)}</h2>
                        </div>
                    </div>
                </Card>

                {/* Finance Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {jobFields.map(({ key, label, icon, color, badge }) => (
                        <Card key={key} className="hover:bg-gray-900/80 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                                    {icon}
                                </div>
                                {badge && (
                                    <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${badge.direction === 'up'
                                        ? 'bg-emerald-900/30 text-emerald-400'
                                        : 'bg-red-900/30 text-red-400'
                                        }`}>
                                        {badge.direction === 'up'
                                            ? <ArrowUpRight className="w-3 h-3" />
                                            : <ArrowDownRight className="w-3 h-3" />}
                                        {badge.text}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">{label}</p>

                            {isEditingInvestment ? (
                                <div className="mt-1">
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={(jobForm as any)[key] || ''}
                                        onChange={(e) => {
                                            const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                            setJobForm(prev => ({ ...prev, [key]: v }));
                                            setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
                                        }}
                                        className={`w-full bg-gray-800 border ${errors[key] ? 'border-red-500' : 'border-gray-700'} text-white text-lg font-bold rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors`}
                                        placeholder="0"
                                    />
                                    {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
                                </div>
                            ) : (
                                <h3 className="text-2xl font-bold text-white">{formatCur((data as any)[key])}</h3>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </ProtectedRoute>
    );
}

