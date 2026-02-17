'use client'

import { Inter } from 'next/font/google'
import React from 'react'
import Navbar from '@/components/shared/Navbar'
import { PortfolioProvider } from '@/lib/portfolioStore'
import { Loader } from '@/components/ui/Loader'
import { ToastProvider } from '@/components/ui/Toast'
import { FinBot } from '@/components/shared/FinBot'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>GenFin Final</title>
        <meta name="description" content="Unified Generative Finance Platform" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col bg-gray-950 text-white selection:bg-blue-500/30`}>
        <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
          <div className="bg-blue-600/20 border border-blue-500/30 backdrop-blur-md text-blue-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            Hackathon Demo Mode
          </div>
        </div>
        <AuthProvider>
          <PortfolioProvider>
            <Navbar />
            <main className="flex-grow">
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader size="lg" text="Loading GenFin..." /></div>}>
                {children}
              </React.Suspense>
            </main>
            <ToastProvider />
            <FinBot />
          </PortfolioProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

