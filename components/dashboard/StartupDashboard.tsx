'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { DollarSign, TrendingUp, Users, Activity, Briefcase, PieChart, AlertTriangle } from 'lucide-react';
import { UserProfile } from '@/lib/getUserProfile';
import { useToast } from '@/lib/toastStore';

interface StartupDashboardProps {
    user: UserProfile;
}

export const StartupDashboard: React.FC<StartupDashboardProps> = ({ user }) => {
    // Calculate Metrics
    const budget = user.budget || 0;
    const monthlyBurn = budget / 12;
    const revenue = user.revenue || 0;
    const runway = monthlyBurn > 0 ? (budget / monthlyBurn) : 0;
    const employees = user.employees || 0;

    // Simple logic for funding need
    const fundingNeeded = monthlyBurn > 0 ? monthlyBurn * 18 : 0;
    const displayFunding = fundingNeeded;

    const formatCur = (n?: number | null) => {
        if (!n) return "$0";
        return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
    };


    // Messaging State
    const [requests, setRequests] = React.useState<any[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const { addToast } = useToast(); // Assuming this hook usage is possible here or needs import

    // Polling Logic
    React.useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch('http://localhost:8000/invest/requests', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();

                    // Check for new messages
                    const newUnread = data.filter((r: any) => !r.is_read).length;

                    // If simple check: just updated unread count. 
                    // To show toast only on INCREASE:
                    setUnreadCount(prev => {
                        if (newUnread > prev) {
                            addToast("New investor request received", "info");
                        }
                        return newUnread;
                    });

                    setRequests(data);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        };

        fetchRequests(); // Initial fetch
        const interval = setInterval(fetchRequests, 10000); // 10s poll

        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:8000/invest/read/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Update local state immediately
            setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white">Startup Command Center</h2>
                    <p className="text-gray-400 mt-1">Real-time metrics for high-growth ventures.</p>
                </div>
                <div className="flex gap-4">
                    {unreadCount > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="text-red-400 font-bold text-sm uppercase tracking-wider">
                                {unreadCount} New Request{unreadCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg">
                        <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
                            Live Mode
                        </span>
                    </div>
                </div>
            </div>

            {/* Key KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Monthly Burn */}
                <Card className="hover:bg-red-950/20 transition-colors border-red-900/30">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded">Monthly</span>
                    </div>
                    <p className="text-gray-400 text-sm">Burn Rate</p>
                    <h3 className="text-2xl font-bold text-white">{formatCur(monthlyBurn)}</h3>
                </Card>

                {/* Runway */}
                <Card className="hover:bg-blue-950/20 transition-colors border-blue-900/30">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${runway < 6 ? 'bg-red-500 text-white' : 'bg-blue-900/30 text-blue-300'}`}>
                            {runway < 6 ? 'CRITICAL' : 'HEALTHY'}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">Runway</p>
                    <h3 className="text-2xl font-bold text-white">{runway.toFixed(1)} Months</h3>
                </Card>

                {/* Revenue */}
                <Card className="hover:bg-emerald-950/20 transition-colors border-emerald-900/30">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-xs bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded">ARR (Proj)</span>
                    </div>
                    <p className="text-gray-400 text-sm">Annual Revenue</p>
                    <h3 className="text-2xl font-bold text-white">{formatCur(revenue)}</h3>
                </Card>

                {/* Employees */}
                <Card className="hover:bg-purple-950/20 transition-colors border-purple-900/30">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">Team Size</p>
                    <h3 className="text-2xl font-bold text-white">{employees} Members</h3>
                </Card>
            </div>

            {/* Investor Inbox */}
            <div className="grid grid-cols-1">
                <Card className="border-gray-800">
                    <div className="flex items-center gap-3 mb-6">
                        <Briefcase className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">Investor Connection Requests</h3>
                    </div>

                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No connection requests yet.</p>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className={`p-4 rounded-lg border flex justify-between items-center transition-all ${req.is_read ? 'bg-gray-900/50 border-gray-800 opacity-60' : 'bg-blue-900/10 border-blue-500/50'}`}>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-white">{req.investor_name}</span>
                                            <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                                            {!req.is_read && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">NEW</span>}
                                        </div>
                                        <p className="text-gray-300 mt-1 text-sm">{req.message || "No message included."}</p>
                                        <p className="text-xs text-gray-500 mt-1">{req.investor_email}</p>
                                    </div>
                                    {!req.is_read && (
                                        <button
                                            onClick={() => markAsRead(req.id)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Funding Need Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-wider">Capital Requirement</span>
                            </div>
                            <h3 className="text-4xl font-bold text-white">
                                {formatCur(displayFunding)}
                                <span className="text-lg text-gray-400 font-normal ml-2">needed for 18mo runway</span>
                            </h3>
                            <p className="text-gray-400 max-w-lg">
                                Based on your current burn rate of {formatCur(monthlyBurn)}/mo, you need to raise additional capital to reach series A milestones safely.
                            </p>
                        </div>
                        {/* Circular Progress or Graphic could go here */}
                        <div className="w-32 h-32 rounded-full border-4 border-amber-500/20 flex items-center justify-center p-2">
                            <div className="text-center">
                                <div className="text-xs text-gray-400">Target</div>
                                <div className="font-bold text-amber-400">Series A</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Market Sentiment (Placeholder for now) */}
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                        Market Context
                    </h3>
                    <p className="text-sm text-gray-400 italic mb-4">
                        "{user.market_description || 'No market description provided.'}"
                    </p>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sector Growth</span>
                            <span className="text-emerald-400 font-bold">+12.5%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Investor Interest</span>
                            <span className="text-blue-400 font-bold">High</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
