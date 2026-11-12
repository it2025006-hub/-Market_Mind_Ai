from __future__ import annotations

import logging
import time
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.engine.analysis import analyze, sample_news
from app.engine.sim import INSTRUMENTS, TIMEFRAMES, generate_series, quote

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("marketmind")

app = FastAPI(
    title="MarketMind AI",
    version="0.1.0",
    description="Educational research API. Outputs are simulated demonstration values, not live market data or validated model results.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_hits: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api"):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        bucket = [stamp for stamp in _hits[ip] if now - stamp < 60]
        if len(bucket) >= settings.rate_limit_per_minute:
            return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
        bucket.append(now)
        _hits[ip] = bucket
    logger.info("%s %s", request.method, request.url.path)
    return await call_next(request)


class PredictRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=16)
    timeframe: str
    horizon: str
    nonce: int = 0
    bars: int = Field(default=250, ge=60, le=504)


def _symbol(symbol: str) -> str:
    key = symbol.upper()
    if key not in INSTRUMENTS:
        raise HTTPException(status_code=422, detail="Unknown symbol")
    return key


def _timeframe(timeframe: str) -> str:
    if timeframe not in TIMEFRAMES:
        raise HTTPException(status_code=422, detail="Unknown timeframe")
    return timeframe


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "mode": "demo" if settings.demo_mode or not settings.market_data_api_key else "configured",
        "service": settings.app_name,
        "database": bool(settings.database_url),
        "newsKeyConfigured": bool(settings.news_api_key),
        "marketDataKeyConfigured": bool(settings.market_data_api_key),
    }


@app.get("/api/meta")
def meta():
    return {
        "simulated": True,
        "disclaimer": "Educational prototype. No endpoint returns live broker data or validated model accuracy.",
        "modelsLoaded": [],
        "intendedModels": ["RandomForest", "XGBoost", "LSTM", "GRU", "FinBERT", "SHAP"],
    }


@app.get("/api/market/instruments")
def instruments():
    return {
        "instruments": [
            {"symbol": symbol, **{k: v for k, v in inst.items() if k != "price"}, "simulated": True}
            for symbol, inst in INSTRUMENTS.items()
        ]
    }


@app.get("/api/market/quotes")
def quotes(symbols: str, nonce: int = 0):
    requested = [part.strip().upper() for part in symbols.split(",") if part.strip()]
    if not requested or len(requested) > 30:
        raise HTTPException(status_code=422, detail="Provide 1 to 30 symbols")
    return {"quotes": [quote(_symbol(symbol), nonce) for symbol in requested], "simulated": True}


@app.get("/api/market/ohlcv")
def ohlcv(symbol: str, timeframe: str = "1d", nonce: int = 0):
    candles = generate_series(_symbol(symbol), _timeframe(timeframe), nonce)
    return {
        "symbol": symbol.upper(),
        "timeframe": timeframe,
        "simulated": True,
        "source": "demo-engine",
        "candles": [c.__dict__ for c in candles],
    }


@app.get("/api/news")
def news():
    return {"items": sample_news(), "source": "sample-desk", "simulated": True}


@app.post("/api/predict")
def predict(body: PredictRequest):
    symbol = _symbol(body.symbol)
    timeframe = _timeframe(body.timeframe)
    if body.horizon not in {"next_session", "3_sessions", "5_sessions", "1_hour", "4_hours"}:
        raise HTTPException(status_code=422, detail="Unknown horizon")
    analysis = analyze(symbol, timeframe, body.horizon, body.nonce, body.bars)
    return {"analysis": analysis, "simulated": True}


@app.get("/api/analysis/regime")
def regime(symbol: str, timeframe: str = "1d", nonce: int = 0):
    analysis = analyze(_symbol(symbol), _timeframe(timeframe), "next_session", nonce, 250)
    return {"regime": analysis["regime"], "simulated": True}
