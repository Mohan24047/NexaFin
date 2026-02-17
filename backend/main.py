from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# Fix path to allow imports from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import yfinance as yf
import pandas as pd

from backend.db import models, database
from backend.routers import auth, portfolio, finance, recommendations, invest, startup, notifications

# Create Database Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="GenFin Backend")

# Include Auth Router (Force Reload)
app.include_router(auth.router)
app.include_router(finance.router)
app.include_router(recommendations.router)
app.include_router(portfolio.router)
app.include_router(invest.router)
app.include_router(startup.router)
app.include_router(notifications.router)





app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

@app.get("/")
def read_root():
    return {"message": "GenFin Backend is Running"}

@app.get("/api/predict/{symbol}")
def predict_stock(symbol: str):
    try:
        # Fetch historical data (last 6 months to ensure enough data for indicators)
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="6mo")

        if df.empty:
            raise HTTPException(status_code=404, detail="Stock data not found")

        # Calculate Indicators (Manual Implementation without pandas_ta)
        
        # RSI (14)
        df['RSI'] = calculate_rsi(df['Close'], period=14)
        
        # SMA (50) and SMA (200)
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['SMA_200'] = df['Close'].rolling(window=200).mean()

        # Get latest values
        current_price = df['Close'].iloc[-1]
        
        # Handle cases where indicators might be NaN (e.g. not enough data)
        rsi = df['RSI'].iloc[-1] if not pd.isna(df['RSI'].iloc[-1]) else 50
        sma_50 = df['SMA_50'].iloc[-1] if not pd.isna(df['SMA_50'].iloc[-1]) else current_price
        sma_200 = df['SMA_200'].iloc[-1] if not pd.isna(df['SMA_200'].iloc[-1]) else current_price

        # Determine Signal
        signal = "Hold"
        confidence = 50.0

        score = 0 # -5 to +5

        # RSI Logic
        if rsi < 30:
            score += 2 # Oversold -> Buy
        elif rsi > 70:
            score -= 2 # Overbought -> Sell

        # Trend Logic (SMA)
        if current_price > sma_50:
            score += 1
        else:
            score -= 1

        if sma_50 > sma_200:
            score += 1 # Bullish Trend
        else:
            score -= 1 # Bearish Trend

        # Final Decision
        if score >= 2:
            signal = "Buy"
            confidence = 60 + (score * 5) # Map score to 60-90%
        elif score <= -2:
            signal = "Sell"
            confidence = 60 + (abs(score) * 5)
        else:
            signal = "Hold"
            confidence = 50 + (abs(score) * 5)

        # Cap confidence
        confidence = min(max(confidence, 50), 95)

        return {
            "symbol": symbol.upper(),
            "prediction": signal,
            "confidence": round(confidence, 1),
            "trend": "Up" if score > 0 else "Down",
            "price": round(current_price, 2),
            "rsi": round(rsi, 2),
            "source": "yfinance_realtime"
        }

    except Exception as e:
        print(f"Error analyzing {symbol}: {e}")
        # Fallback to a neutral response instead of crashing
        return {
             "symbol": symbol.upper(),
            "prediction": "Hold",
            "confidence": 50,
            "trend": "Neutral",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
