import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    // Try actual ML Backend
    const backendData = await fetchBackend<any>(`/api/predict/${symbol}`);
    if (backendData) {
        return NextResponse.json(backendData);
    }

    // Fallback Mock Prediction — improved hash for per-symbol variation
    const upper = symbol.toUpperCase();

    // Better hash: multiply-and-XOR to spread values across the range
    let hash = 0;
    for (let i = 0; i < upper.length; i++) {
        hash = ((hash << 5) - hash + upper.charCodeAt(i)) | 0;
    }
    hash = Math.abs(hash);

    // Primary rand 0-1 for signal direction
    const rand = (hash % 1000) / 1000;

    // Per-asset confidence variation factors
    const lenFactor = (upper.length % 5) * 3;                         // 0-12 based on symbol length
    const charFactor = (upper.charCodeAt(0) % 7) * 2;                 // 0-12 based on first char
    const midFactor = upper.length > 2 ? (upper.charCodeAt(1) % 5) : 0; // 0-4

    let prediction = 'Hold';
    if (rand > 0.6) prediction = 'Buy';
    else if (rand < 0.25) prediction = 'Sell';

    // Base confidence 70-85 + variation from symbol properties
    let confidence = 70 + (hash % 10) + lenFactor - charFactor + midFactor;

    // Signal-based adjustment: Buy = slight boost, Sell = slight penalty
    if (prediction === 'Buy') confidence += 3;
    else if (prediction === 'Sell') confidence -= 2;

    // Clamp to realistic range 70-85
    confidence = Math.max(70, Math.min(85, confidence));

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));

    return NextResponse.json({
        symbol: upper,
        prediction,
        confidence: Math.round(confidence),
        trend: rand > 0.5 ? 'Up' : 'Down',
        source: 'mock'
    });
}
