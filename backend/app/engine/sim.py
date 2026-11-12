from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone

INSTRUMENTS = {
    "NIFTY": {"name": "NIFTY 50", "exchange": "NSE", "currency": "INR", "sector": "Index", "market": "IN", "price": 25000, "vol": 0.011, "volume": 280_000_000},
    "SENSEX": {"name": "SENSEX", "exchange": "BSE", "currency": "INR", "sector": "Index", "market": "IN", "price": 82000, "vol": 0.011, "volume": 120_000_000},
    "BANKNIFTY": {"name": "NIFTY Bank", "exchange": "NSE", "currency": "INR", "sector": "Banking", "market": "IN", "price": 53000, "vol": 0.014, "volume": 180_000_000},
    "RELIANCE": {"name": "Reliance Industries", "exchange": "NSE", "currency": "INR", "sector": "Energy", "market": "IN", "price": 1400, "vol": 0.016, "volume": 8_500_000},
    "TCS": {"name": "Tata Consultancy Services", "exchange": "NSE", "currency": "INR", "sector": "Information Technology", "market": "IN", "price": 4000, "vol": 0.013, "volume": 2_400_000},
    "HDFCBANK": {"name": "HDFC Bank", "exchange": "NSE", "currency": "INR", "sector": "Banking", "market": "IN", "price": 1700, "vol": 0.014, "volume": 12_000_000},
    "INFY": {"name": "Infosys", "exchange": "NSE", "currency": "INR", "sector": "Information Technology", "market": "IN", "price": 1800, "vol": 0.015, "volume": 6_200_000},
    "ICICIBANK": {"name": "ICICI Bank", "exchange": "NSE", "currency": "INR", "sector": "Banking", "market": "IN", "price": 1300, "vol": 0.016, "volume": 9_100_000},
    "SBIN": {"name": "State Bank of India", "exchange": "NSE", "currency": "INR", "sector": "Banking", "market": "IN", "price": 800, "vol": 0.018, "volume": 14_000_000},
    "BHARTIARTL": {"name": "Bharti Airtel", "exchange": "NSE", "currency": "INR", "sector": "Telecom", "market": "IN", "price": 1600, "vol": 0.015, "volume": 4_800_000},
    "ITC": {"name": "ITC", "exchange": "NSE", "currency": "INR", "sector": "FMCG", "market": "IN", "price": 470, "vol": 0.012, "volume": 8_200_000},
    "LT": {"name": "Larsen & Toubro", "exchange": "NSE", "currency": "INR", "sector": "Industrials", "market": "IN", "price": 3600, "vol": 0.016, "volume": 1_800_000},
    "HINDUNILVR": {"name": "Hindustan Unilever", "exchange": "NSE", "currency": "INR", "sector": "FMCG", "market": "IN", "price": 2400, "vol": 0.012, "volume": 1_600_000},
    "NDX": {"name": "NASDAQ 100", "exchange": "NASDAQ", "currency": "USD", "sector": "Index", "market": "US", "price": 21000, "vol": 0.013, "volume": 4_200_000_000},
    "SPX": {"name": "S&P 500", "exchange": "NYSE", "currency": "USD", "sector": "Index", "market": "US", "price": 6000, "vol": 0.010, "volume": 3_800_000_000},
    "AAPL": {"name": "Apple", "exchange": "NASDAQ", "currency": "USD", "sector": "Information Technology", "market": "US", "price": 230, "vol": 0.016, "volume": 52_000_000},
    "MSFT": {"name": "Microsoft", "exchange": "NASDAQ", "currency": "USD", "sector": "Information Technology", "market": "US", "price": 420, "vol": 0.015, "volume": 22_000_000},
    "NVDA": {"name": "NVIDIA", "exchange": "NASDAQ", "currency": "USD", "sector": "Information Technology", "market": "US", "price": 140, "vol": 0.028, "volume": 220_000_000},
    "GOOGL": {"name": "Alphabet Class A", "exchange": "NASDAQ", "currency": "USD", "sector": "Communication Services", "market": "US", "price": 180, "vol": 0.018, "volume": 24_000_000},
    "AMZN": {"name": "Amazon", "exchange": "NASDAQ", "currency": "USD", "sector": "Consumer Discretionary", "market": "US", "price": 210, "vol": 0.018, "volume": 32_000_000},
    "META": {"name": "Meta Platforms", "exchange": "NASDAQ", "currency": "USD", "sector": "Communication Services", "market": "US", "price": 600, "vol": 0.022, "volume": 14_000_000},
    "TSLA": {"name": "Tesla", "exchange": "NASDAQ", "currency": "USD", "sector": "Consumer Discretionary", "market": "US", "price": 350, "vol": 0.032, "volume": 78_000_000},
    "GOLD": {"name": "Gold", "exchange": "COMEX", "currency": "USD", "sector": "Metals", "market": "GLOBAL", "price": 2700, "vol": 0.009, "volume": 180_000},
    "DXY": {"name": "USD Index", "exchange": "ICE", "currency": "USD", "sector": "Currency", "market": "GLOBAL", "price": 104, "vol": 0.005, "volume": 32_000},
    "BTC": {"name": "Bitcoin", "exchange": "CRYPTO", "currency": "USD", "sector": "Digital Assets", "market": "GLOBAL", "price": 95000, "vol": 0.035, "volume": 28_000},
    "US10Y": {"name": "US 10Y Yield", "exchange": "UST", "currency": "USD", "sector": "Rates", "market": "US", "price": 4.2, "vol": 0.012, "volume": 520_000},
}

TIMEFRAMES = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400}
BARS = {"1m": 360, "5m": 360, "15m": 360, "1h": 400, "4h": 360, "1d": 504}


def hash_string(value: str) -> int:
    h = 2166136261
    for ch in value:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def mulberry32(seed: int):
    state = (seed & 0xFFFFFFFF) or 1

    def rand() -> float:
        nonlocal state
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        return (state + 1) / 4294967297

    return rand


def randn(rand) -> float:
    u = min(max(rand(), 1e-9), 1 - 1e-9)
    v = rand()
    return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


@dataclass
class Candle:
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: int


def generate_series(symbol: str, timeframe: str, nonce: int = 0) -> list[Candle]:
    if symbol not in INSTRUMENTS:
        raise KeyError(symbol)
    if timeframe not in TIMEFRAMES:
        raise KeyError(timeframe)
    inst = INSTRUMENTS[symbol]
    step = TIMEFRAMES[timeframe]
    bars = BARS[timeframe]
    end = 1_762_000_000 + nonce * 86_400
    rand = mulberry32(hash_string(f"{symbol}|{timeframe}|{nonce}"))
    scale = math.sqrt(step / 86400)
    price = float(inst["price"])
    candles: list[Candle] = []
    drift = 0.0
    left = 0
    cluster = 1.0
    cluster_left = 0
    for i in range(bars):
        if left <= 0:
            roll = rand()
            drift = 0.0004 if roll < 0.34 else -0.0004 if roll < 0.62 else 0.0
            left = 20 + int(rand() * 40)
        if cluster_left <= 0:
            cluster = 0.6 + rand() * 1.4
            cluster_left = 15 + int(rand() * 25)
        left -= 1
        cluster_left -= 1
        ret = drift * scale + randn(rand) * float(inst["vol"]) * scale * cluster
        ret += -0.004 * math.log(price / float(inst["price"])) * scale
        open_ = price
        close = max(0.01, open_ * math.exp(ret))
        wick = abs(randn(rand)) * float(inst["vol"]) * scale * open_ * 0.45
        high = max(open_, close) + wick
        low = max(0.01, min(open_, close) - wick)
        volume = max(1, int(float(inst["volume"]) * cluster * (0.6 + rand())))
        candles.append(Candle(end - (bars - 1 - i) * step, open_, high, low, close, volume))
        price = close
    return candles


def quote(symbol: str, nonce: int = 0) -> dict:
    series = generate_series(symbol, "1d", nonce)
    last, prev = series[-1], series[-2]
    inst = INSTRUMENTS[symbol]
    change = last.close - prev.close
    return {
        "symbol": symbol,
        "name": inst["name"],
        "exchange": inst["exchange"],
        "currency": inst["currency"],
        "price": last.close,
        "change": change,
        "changePct": 0 if prev.close == 0 else change / prev.close * 100,
        "open": last.open,
        "high": last.high,
        "low": last.low,
        "previousClose": prev.close,
        "volume": last.volume,
        "timestamp": datetime.fromtimestamp(last.time, timezone.utc).isoformat(),
        "spark": [c.close for c in series[-32:]],
        "simulated": True,
    }
