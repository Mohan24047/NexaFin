'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, PieChart, TrendingUp, DollarSign, Users, Activity, Home, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/shared/NotificationBell';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.replace('/login');
    };

    // Don't show navbar on login page
    if (pathname === '/login') return null;

    if (user?.user_type === 'startup') {
        // Filter out Portfolio and Tracker (Market Target)
        const startupHidden = ['Portfolio', 'Tracker'];
        // Remove hidden items from main list first (if they were there by default)
        // or just construct a specific list. 
        // Current list has Portfolio and Tracker by default. 
        // We should filter them OUT.
    }

    // Better approach: Define base items, then filter.
    let baseNavItems = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Startup Builder', href: '/startup-builder', icon: Activity },
        { name: 'Portfolio', href: '/portfolio', icon: PieChart },
        { name: 'Scenarios', href: '/scenarios', icon: TrendingUp },
        { name: 'Tracker', href: '/tracker', icon: DollarSign },
        { name: 'Finance', href: '/personal-finance', icon: Users },
        { name: 'AI Agents', href: '/agents', icon: Activity },
    ];

    if (user?.user_type === 'startup') {
        const hiddenForStartup = ['Portfolio', 'Tracker'];
        baseNavItems = baseNavItems.filter(item => !hiddenForStartup.includes(item.name));
        baseNavItems.push({ name: 'Investor Requests', href: '/startup/requests', icon: Users });
    }

    const navItems = baseNavItems;

    return (
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
                            <span className="font-bold text-white text-lg">G</span>
                        </div>
                        <Link
                            href="/"
                            className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent select-none cursor-pointer"
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                const isMock = localStorage.getItem('genfin_force_mock') === 'true';
                                if (isMock) {
                                    localStorage.removeItem('genfin_force_mock');
                                    alert('⚡ DEMO MODE DISABLED: Using Real APIs');
                                } else {
                                    localStorage.setItem('genfin_force_mock', 'true');
                                    alert('🛡️ DEMO MODE ENABLED: Forcing Mock Data');
                                }
                                window.location.reload();
                            }}
                        >
                            GenFin Studio
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2',
                                            isActive
                                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notification bell + Logout (desktop) */}
                    {user && (
                        <div className="hidden md:flex items-center gap-1">
                            <NotificationBell />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    )}

                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-800 bg-gray-950">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3',
                                        isActive
                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        {/* Notification bell + Logout (mobile) */}
                        {user && (
                            <>
                                <div className="px-3 py-2">
                                    <NotificationBell />
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
