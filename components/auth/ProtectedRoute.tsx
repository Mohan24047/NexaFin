'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/ui/Loader'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, profile, profileLoading } = useAuth()
    const router = useRouter()

    React.useEffect(() => {
        if (!loading && !user) {
            router.replace('/login')
        }
    }, [user, loading, router])

    React.useEffect(() => {
        if (!loading && !profileLoading && user && (!profile || !profile.user_type)) {
            router.replace('/onboarding')
        }
    }, [user, loading, profile, profileLoading, router])

    if (loading || profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader size="lg" text="Checking authentication..." />
            </div>
        )
    }

    if (!user || !profile) {
        return null
    }

    return <>{children}</>
}

