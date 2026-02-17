'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toastStore';
import { Loader } from '@/components/ui/Loader';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Request {
    id: string;
    senderEmail: string;
    message: string;
    startupName: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export default function StartupRequestsPage() {
    const { user, profile } = useAuth();
    const { addToast } = useToast();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            console.log("Fetching requests for startup dashboard...");
            const res = await fetch('http://localhost:8000/invest/startup/requests', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("REQUESTS FROM API:", data);
                setRequests(data);
            } else {
                console.error("API Fetch Failed:", res.status, res.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.user_type === 'startup') {
            fetchRequests();
            const interval = setInterval(fetchRequests, 15000); // Poll every 15s
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleAction = async (id: string, action: 'accept' | 'reject') => {
        setProcessingId(id);
        try {
            const res = await fetch('http://localhost:8000/invest/startup/requests/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ id, action })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                addToast(action === 'accept' ? "Request accepted" : "Request rejected", action === 'accept' ? 'success' : 'info');
                // Refresh list immediately
                fetchRequests();
            } else {
                addToast("Action failed. Try again.", "error");
            }
        } catch (error) {
            addToast("Network error. Try again.", "error");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader text="Loading Requests..." /></div>;
    }

    if (user?.user_type !== 'startup') {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
                <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
                <p className="text-gray-400">This page is only available for startup accounts.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-700 text-xs font-mono text-gray-400">
                <p>DEBUG INFO:</p>
                <p>User Email: <span className="text-white">{user?.email}</span></p>
                <p>User ID: <span className="text-white">{user?.id}</span></p>
                <p>User Type: <span className="text-white">{user?.user_type}</span></p>
                <p>Requests Count: <span className="text-white">{requests.length}</span></p>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <Users className="w-8 h-8 text-blue-500" />
                <h1 className="text-3xl font-bold text-white">Investor Connection Requests</h1>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-900/50">
                                <th className="p-4 font-semibold text-gray-400">#</th>
                                <th className="p-4 font-semibold text-gray-400">Date</th>
                                <th className="p-4 font-semibold text-gray-400">Startup Name</th>
                                <th className="p-4 font-semibold text-gray-400">Investor</th>
                                <th className="p-4 font-semibold text-gray-400">Message</th>
                                <th className="p-4 font-semibold text-gray-400">Status</th>
                                <th className="p-4 font-semibold text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        No connection requests yet.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req, index) => (
                                    <tr key={req.id} className="hover:bg-gray-900/30 transition-colors">
                                        <td className="p-4 text-gray-500">{index + 1}</td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-white font-medium">
                                            {req.startupName}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {req.senderEmail}
                                        </td>
                                        <td className="p-4 text-gray-400 max-w-md truncate" title={req.message}>
                                            {req.message || <span className="text-gray-600 italic">No message</span>}
                                        </td>
                                        <td className="p-4">
                                            {req.status === 'accepted' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <CheckCircle className="w-3 h-3" /> Accepted
                                                </span>
                                            )}
                                            {req.status === 'rejected' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <XCircle className="w-3 h-3" /> Rejected
                                                </span>
                                            )}
                                            {req.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAction(req.id, 'accept')}
                                                        isLoading={processingId === req.id}
                                                        disabled={!!processingId}
                                                        className="bg-green-600 hover:bg-green-500 text-white h-8 text-xs"
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleAction(req.id, 'reject')}
                                                        disabled={!!processingId}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
