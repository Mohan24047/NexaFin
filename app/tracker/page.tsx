'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Search, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface StockData {
    symbol: string;
    price: number;
    change: number;
    percent: number;
    source?: string;
}

// Generate simulated 30-day price history from current price
function generatePriceHistory(currentPrice: number, change: number) {
    const days = 30;
    const data: { day: number; price: number; label: string }[] = [];
    // Work backwards from current price
    let price = currentPrice - change; // approximate starting price
    const dailyVol = currentPrice * 0.015; // 1.5% daily volatility

    for (let i = 0; i < days; i++) {
        const drift = (change / days); // trend towards current price
        const noise = (Math.random() - 0.5) * dailyVol;
        price = Math.max(price + drift + noise, currentPrice * 0.7);
        data.push({
            day: i + 1,
            price: Math.round(price * 100) / 100,
            label: `Day ${i + 1}`,
        });
    }
    // Ensure last point is actually the current price
    data[days - 1].price = currentPrice;
    return data;
}

export default function TrackerPage() {
    const { user } = useAuth();
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<StockData | null>(null);
    const [error, setError] = useState('');

    if (user?.user_type === 'startup') {
        return (
            <ProtectedRoute>
                <div className="p-8 text-center text-gray-500">Access Restricted: Startup accounts cannot access Market Tracker.</div>
            </ProtectedRoute>
        );
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!symbol) return;

        setLoading(true);
        setError('');
        setData(null);

        try {
            const res = await fetch(`/api/proxy/stocks?symbol=${symbol}`);
            if (!res.ok) throw new Error('Failed to fetch stock data');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError('Could not find symbol. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!data) return [];
        return generatePriceHistory(data.price, data.change);
    }, [data]);

    const isPositive = data ? data.change >= 0 : true;

    return (
        <ProtectedRoute>
            <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-white mb-2">Market Tracker</h1>
                    <p className="text-gray-400">Real-time stock quotes and market data.</p>
                </header>

                <Card>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Enter Stock Symbol (e.g. AAPL)"
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner className="h-4 w-4" /> : 'Search'}
                        </Button>
                    </form>
                </Card>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                        <Card className="border-t-4 border-t-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{data.symbol}</h2>
                                    <p className="text-sm text-gray-500">Real-Time Quote</p>
                                </div>
                                <div className={`px-3 py-1 rounded text-sm font-bold flex items-center gap-1
                                ${data.change >= 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}
                            `}>
                                    {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {data.change >= 0 ? '+' : ''}{data.percent}%
                                </div>
                            </div>

                            <div className="text-4xl font-bold text-white mb-2">
                                ${data.price.toFixed(2)}
                            </div>
                            <div className={`text-sm ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} Today
                            </div>

                            {data.source === 'mock' && (
                                <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-yellow-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Using Simulated Data (Backend Offline)
                                </div>
                            )}
                        </Card>

                        {/* Price History Chart */}
                        <Card className="border-t-4 border-t-emerald-500">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-bold text-white">30-Day Price History</h3>
                            </div>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#6b7280"
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            tickFormatter={(v) => v % 5 === 0 ? `D${v}` : ''}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(v) => `$${v.toFixed(0)}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#111827',
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#f3f4f6',
                                                fontSize: 12,
                                            }}
                                            formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, 'Price']}
                                            labelFormatter={(label) => `Day ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke={isPositive ? '#10b981' : '#ef4444'}
                                            strokeWidth={2}
                                            fill="url(#priceGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
