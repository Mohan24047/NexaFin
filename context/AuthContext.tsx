'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchProfile, type UserProfile } from '@/lib/getUserProfile'
import { useRouter } from 'next/navigation'

interface AuthContextType {
    user: UserProfile | null
    loading: boolean
    profile: UserProfile | null
    profileLoading: boolean
    signIn: (email: string, password: string) => Promise<{ error: any | null }>
    signUp: (email: string, password: string) => Promise<{ error: any | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    updateMonthlyInvestment: (amount: number) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const BACKEND_URL = "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const router = useRouter()

    const loadUserAndProfile = useCallback(async (token: string) => {
        setProfileLoading(true)
        const p = await fetchProfile(token)
        if (p) {
            setUser(p)
            setProfile(p)
        } else {
            // Token invalid or expired
            localStorage.removeItem("token")
            setUser(null)
            setProfile(null)
        }
        setLoading(false)
        setProfileLoading(false)
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            loadUserAndProfile(token)
        } else {
            setLoading(false)
            setProfileLoading(false)
        }
    }, [loadUserAndProfile])

    const refreshProfile = useCallback(async () => {
        const token = localStorage.getItem("token")
        if (token) {
            await loadUserAndProfile(token)
        }
    }, [loadUserAndProfile])

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${BACKEND_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                return { error: { message: data.detail || "Login failed" } }
            }

            localStorage.setItem("token", data.access_token);
            if (data.user_id) localStorage.setItem("user_id", data.user_id);
            if (data.email) localStorage.setItem("email", data.email);

            await loadUserAndProfile(data.access_token);
            return { error: null }
        } catch (e) {
            return { error: { message: "Network error" } }
        }
    }, [loadUserAndProfile])

    const signUp = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) {
                return { error: { message: data.detail || "Signup failed" } }
            }

            // Auto login after signup
            return signIn(email, password);
        } catch (e) {
            return { error: { message: "Network error" } }
        }
    }, [signIn])

    const signOut = useCallback(async () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user_id")
        localStorage.removeItem("email")
        setUser(null)
        setProfile(null)
        router.push('/login')
    }, [router])

    const updateMonthlyInvestment = useCallback(async (amount: number) => {
        try {
            const token = localStorage.getItem("token")
            if (!token) return { error: "Not authenticated" }

            const res = await fetch(`${BACKEND_URL}/finance/investment`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            if (!res.ok) {
                return { error: "Failed to update investment" }
            }

            const data = await res.json();

            // Update local state immediately
            if (profile) {
                setProfile({ ...profile, monthly_investment: data.monthly_investment })
            }

            return { error: null }
        } catch (e) {
            return { error: "Network error" }
        }
    }, [profile])

    return (
        <AuthContext.Provider value={{ user, loading, profile, profileLoading, signIn, signUp, signOut, refreshProfile, updateMonthlyInvestment }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
