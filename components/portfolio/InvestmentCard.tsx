'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, Plus, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InvestmentItem } from '@/lib/portfolioStore';
import { getFundabilityRating } from '@/lib/fundability';

import { useToast } from '@/lib/toastStore';
import { ConnectModal } from './ConnectModal';

interface InvestmentCardProps {
    data: Partial<InvestmentItem>;
    onAdd?: () => void;
    isAdded?: boolean;
    showAddButton?: boolean;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
    data,
    onAdd,
    isAdded = false,
    showAddButton = true
}) => {
    const { label, color } = getFundabilityRating(data.fundabilityScore || 0);
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // DEBUG: Check what data we are actually receiving
    console.log("InvestmentCard Data:", data);

    const formatCurrency = (n?: number) => n ? '$' + n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 }) : 'N/A';

    const handleConnect = async (message: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                addToast("You must be logged in to connect.", "error");
                return;
            }

            const payload = {
                startupId: data.id,
                message: message
            };
            console.log("SENDING REQUEST PAYLOAD:", payload);

            const res = await fetch('http://localhost:8000/invest/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            console.log("CONNECT RESPONSE:", result);

            if (!res.ok || !result.success) {
                if (result.message === "Request already sent") {
                    setRequestSent(true);
                    addToast("Request already pending.", "info");
                } else {
                    throw new Error(result.message || "Failed to connect");
                }
                return;
            }

            addToast("Connection request sent!", "success");
            setRequestSent(true);
        } catch (e: any) {
            console.error("Connect Error:", e);
            addToast(e.message || "Error sending request", "error");
        }
    };

    return (
        <>
            <ConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                startupName={data.startupName || 'Startup'}
                onConfirm={handleConnect}
            />

            <Card className="border-t-4 border-t-blue-500 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{data.startupName || 'Startup'}</h3>
                        <p className="text-xs text-blue-400 font-mono">{data.ticker || 'TCKER'}</p>
                    </div>
                    <div className={`px-2 py-1 rounded bg-gray-800 text-xs font-bold ${color} border border-gray-700`}>
                        {label} ({data.fundabilityScore})
                    </div>
                </div>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
                    {data.thesisSummary}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Valuation</div>
                        <div className="text-lg font-bold text-white">{formatCurrency(data.valuation)}</div>
                    </div>
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ask</div>
                        <div className="text-lg font-bold text-emerald-400">{formatCurrency(data.askAmount)}</div>
                    </div>
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Est. ROI</div>
                        <div className="text-sm font-bold text-purple-400">{data.roi}</div>
                    </div>
                    <div className="bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Risk Profile</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1">
                            {data.risk === 'High' ? <AlertTriangle className="w-3 h-3 text-red-500" /> : <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                            {data.risk}
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-2">
                    {/* Primary Connect Button */}
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        disabled={requestSent}
                        className={`w-full ${requestSent ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        {requestSent ? "Request Sent" : "Invest / Connect"}
                    </Button>

                    {showAddButton && (
                        <Button
                            onClick={onAdd}
                            disabled={isAdded}
                            variant="ghost"
                            className={`w-full ${isAdded ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            {isAdded ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Tracking
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Track in Portfolio
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </Card>
        </>
    );
};
