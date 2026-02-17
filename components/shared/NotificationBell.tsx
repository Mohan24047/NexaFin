'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    created_at: string | null;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('http://localhost:8000/notifications/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: Notification[] = await res.json();
                setNotifications(data);
            }
        } catch {
            // Silently fail — never crash
        }
    }, []);

    // Poll every 10 seconds
    useEffect(() => {
        if (!user) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10_000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:8000/notifications/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id }),
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch {
            // Silently fail
        }
    };

    if (!user) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;

    const formatTime = (iso: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none shadow-lg shadow-red-500/40">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-blue-400">{unreadCount} unread</span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No notifications yet
                        </div>
                    ) : (
                        <ul>
                            {notifications.map((n) => (
                                <li
                                    key={n.id}
                                    onClick={() => {
                                        if (!n.read) markRead(n.id);
                                    }}
                                    className={`px-4 py-3 border-b border-gray-800/50 cursor-pointer transition-colors ${n.read
                                            ? 'bg-transparent hover:bg-gray-800/30'
                                            : 'bg-blue-500/5 hover:bg-blue-500/10'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {!n.read && (
                                            <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                        )}
                                        <div className={!n.read ? '' : 'pl-4'}>
                                            <p className={`text-sm ${n.read ? 'text-gray-400' : 'text-white'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(n.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
