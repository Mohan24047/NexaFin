'use client';

import React from 'react';
import { ScenarioProvider } from '@/lib/scenarioStore';
import { ScenarioBuilder } from '@/components/scenarios/ScenarioBuilder';
import { ScenarioComparison } from '@/components/scenarios/ScenarioComparison';
import { Split } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ScenariosPage() {
    return (
        <ProtectedRoute>
            <ScenarioProvider>
                <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-full">
                            <Split className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Scenario Comparison Engine</h1>
                            <p className="text-gray-400 mt-1">Model different life paths and compare financial outcomes side-by-side.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left: Builder */}
                        <div className="lg:col-span-4">
                            <ScenarioBuilder />
                        </div>

                        {/* Right: Visualization */}
                        <div className="lg:col-span-8">
                            <ScenarioComparison />
                        </div>
                    </div>
                </div>
            </ScenarioProvider>
        </ProtectedRoute>
    );
}
