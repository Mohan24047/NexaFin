'use client';

import React from 'react';
import { useScenarios } from '@/lib/scenarioStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, TrendingUp, AlertTriangle, Play } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export const ScenarioComparison = () => {
    const { scenarios, removeScenario, runComparison } = useScenarios();

    const formatCur = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

    // Build chart data: merge all scenario projections by year
    const chartData = scenarios.length > 0
        ? scenarios[0].result.projections.map((_, yearIdx) => {
            const point: Record<string, number> = { year: yearIdx + 1 };
            scenarios.forEach((s) => {
                point[s.name] = s.result.projections[yearIdx]?.value ?? 0;
            });
            return point;
        })
        : [];

    if (scenarios.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                <p>No scenarios created yet.</p>
                <p className="text-sm">Use the builder to add your first life decision.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Scenario Analysis</h3>
                <Button onClick={runComparison} variant="secondary" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Run Comparison
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4">
                {scenarios.map((scenario) => (
                    <Card key={scenario.id} className="min-w-[300px] border-t-4 border-t-blue-500 relative group">
                        <button
                            onClick={() => removeScenario(scenario.id)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="mb-4">
                            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                                {scenario.type.toUpperCase()}
                            </div>
                            <h4 className="text-lg font-bold text-white">{scenario.name}</h4>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                <div className="text-xs text-gray-500 mb-1">Projected Net Worth (5yr)</div>
                                <div className="text-2xl font-bold text-emerald-400">
                                    {formatCur(scenario.result.netWorth5Year)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <div className="text-gray-500">Best Case</div>
                                    <div className="text-emerald-500">{formatCur(scenario.result.bestCase)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Worst Case</div>
                                    <div className="text-red-500 text-right">{formatCur(scenario.result.worstCase)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Risk Score:</span>
                                <div className="flex gap-1">
                                    {[...Array(10)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-3 rounded-full ${i < scenario.result.riskScore
                                                ? (scenario.result.riskScore > 7 ? 'bg-red-500' : 'bg-yellow-500')
                                                : 'bg-gray-800'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <div className="text-xs font-bold text-gray-500 mb-2">AI AGENT VERDICT</div>
                            <p className="text-sm text-gray-300 italic leading-relaxed">
                                &quot;{scenario.aiAnalysis}&quot;
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Net Worth Projection Chart */}
            {chartData.length > 0 && (
                <Card className="border-t-4 border-t-purple-500">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Net Worth Projection (5 Year)</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis
                                    dataKey="year"
                                    stroke="#6b7280"
                                    tickFormatter={(v) => `Year ${v}`}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111827',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: '#f3f4f6',
                                    }}
                                    formatter={(value: number | undefined) => ['$' + (value ?? 0).toLocaleString(), '']}
                                    labelFormatter={(label) => `Year ${label}`}
                                />
                                <Legend
                                    wrapperStyle={{ color: '#d1d5db', fontSize: 12 }}
                                />
                                {scenarios.map((s, idx) => (
                                    <Line
                                        key={s.id}
                                        type="monotone"
                                        dataKey={s.name}
                                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}
        </div>
    );
};
