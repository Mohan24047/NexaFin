'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const { signIn, signUp, user } = useAuth()
    const router = useRouter()

    // If already logged in, redirect
    React.useEffect(() => {
        if (user) {
            router.replace('/')
        }
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            if (mode === 'login') {
                const { error } = await signIn(email, password)
                if (error) {
                    setError(error.message)
                } else {
                    router.replace('/')
                }
            } else {
                const { error } = await signUp(email, password)
                if (error) {
                    setError(error.message)
                } else {
                    router.replace('/')
                }
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-bold text-white text-2xl">G</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        GenFin Studio
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl shadow-black/40">
                    <h2 className="text-xl font-semibold text-white mb-1 text-center">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-sm text-gray-400 mb-6 text-center">
                        {mode === 'login'
                            ? 'Sign in to access your dashboard'
                            : 'Sign up to get started with GenFin'}
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : mode === 'login' ? (
                                <LogIn className="w-4 h-4" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            {isLoading
                                ? 'Please wait...'
                                : mode === 'login'
                                    ? 'Sign In'
                                    : 'Create Account'}
                        </button>
                    </form>

                    {/* Toggle */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'signup' : 'login')
                                setError(null)
                            }}
                            className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                        >
                            {mode === 'login'
                                ? "Don't have an account? Sign Up"
                                : 'Already have an account? Sign In'}
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-600 text-center mt-4">
                    Powered by Supabase Authentication
                </p>
            </div>
        </div>
    )
}
