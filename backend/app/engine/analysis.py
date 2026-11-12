from __future__ import annotations

import math
import statistics
from datetime import datetime, timezone

from app.engine.sim import INSTRUMENTS, generate_series

WEIGHTS = {
    "bull": {"momentum": 0.34, "sentiment": 0.18, "volatility": 0.12, "cross": 0.22, "volume": 0.14},
    "bear": {"momentum": 0.32, "sentiment": 0.16, "volatility": 0.14, "cross": 0.24, "volume": 0.14},
    "sideways": {"momentum": 0.14, "sentiment": 0.30, "volatility": 0.16, "cross": 0.24, "volume": 0.16},
    "high_vol": {"momentum": 0.12, "sentiment": 0.14, "volatility": 0.38, "cross": 0.22, "volume": 0.14},
    "low_vol": {"momentum": 0.30, "sentiment": 0.26, "volatility": 0.10, "cross": 0.20, "volume": 0.14},
}
LABELS = {
    "bull": "Trending bullish",
    "bear": "Trending bearish",
    "sideways": "Sideways",
    "high_vol": "High volatility",
    "low_vol": "Low volatility",
}
HORIZONS = {
    "next_session": "Next trading session",
    "3_sessions": "Next 3 sessions",
    "5_sessions": "Next 5 sessions",
    "1_hour": "Next hour",
    "4_hours": "Next 4 hours",
}
NOTES = {
    "momentum": "10-bar return on the API demonstration path.",
    "sentiment": "Neutral placeholder. The lexicon scorer runs in the browser sample-news module.",
    "volatility": "Inverted ATR percentile in the demonstration policy.",
    "cross": "Not estimated here. Backend demo uses a zero cross signal unless the browser engine is used.",
    "volume": "Volume z-score signed by momentum.",
}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def analyze(symbol: str, timeframe: str, horizon: str, nonce: int, bars: int) -> dict:
    inst = INSTRUMENTS[symbol]
    candles = generate_series(symbol, timeframe, nonce)[-max(80, bars) :]
    closes = [c.close for c in candles]
    price = closes[-1]
    rets = [math.log(closes[i] / closes[i - 1]) for i in range(1, len(closes))]
    window = rets[-20:]
    hv = statistics.pstdev(window) * math.sqrt(252 if timeframe == "1d" else 252 * 6) if len(window) > 2 else 0
    tr = [max(c.high - c.low, abs(c.high - closes[i - 1]), abs(c.low - closes[i - 1])) for i, c in enumerate(candles) if i]
    atr = statistics.fmean(tr[-14:]) if tr else price * 0.01
    atr_pct = atr / price
    vol_rank = _clamp(atr_pct / (inst["vol"] * 1.8), 0, 1)
    ret10 = price / closes[-11] - 1
    momentum = _clamp(math.tanh(ret10 / 0.02), -1, 1)
    sentiment = 0.0
    volatility = _clamp(-(vol_rank - 0.5) * 2, -1, 1)
    volumes = [c.volume for c in candles[-21:-1]]
    vol_z = 0 if len(volumes) < 2 or statistics.pstdev(volumes) == 0 else (candles[-1].volume - statistics.fmean(volumes)) / statistics.pstdev(volumes)
    volume = _clamp(math.copysign(min(1, abs(vol_z) / 2.5), momentum or 1), -1, 1)
    cross = 0.0
    raw = {"momentum": momentum, "sentiment": sentiment, "volatility": volatility, "cross": cross, "volume": volume}
    if vol_rank > 0.82:
        regime = "high_vol"
    elif vol_rank < 0.18 and abs(ret10) < 0.01:
        regime = "low_vol"
    elif ret10 > 0.015:
        regime = "bull"
    elif ret10 < -0.015:
        regime = "bear"
    else:
        regime = "sideways"
    weights = WEIGHTS[regime]
    signals = []
    for key, value in raw.items():
        signals.append({
            "id": key,
            "label": key.replace("_", " ").title() if key != "cross" else "Cross-market context",
            "value": value,
            "weight": weights[key],
            "contribution": weights[key] * value,
            "note": NOTES[key],
        })
    score = sum(item["contribution"] for item in signals)
    equal = statistics.fmean(raw.values())
    k = 2.2
    p_bull = 1 / (1 + math.exp(-k * score))
    equal_p = 1 / (1 + math.exp(-k * equal))
    dispersion = statistics.pstdev(raw.values())
    uncertainty = _clamp(0.12 + 0.45 * dispersion + 0.4 * max(0, vol_rank - 0.45), 0.08, 0.9)
    confidence = _clamp(0.12 + 0.62 * abs(p_bull - 0.5) * 2 * (1 - uncertainty), 0.05, 0.9)
    direction = "BULLISH" if p_bull >= 0.56 and score > 0.04 else "BEARISH" if p_bull <= 0.44 and score < -0.04 else "NEUTRAL"
    equal_direction = "BULLISH" if equal_p >= 0.56 and equal > 0.04 else "BEARISH" if equal_p <= 0.44 and equal < -0.04 else "NEUTRAL"
    band = atr * (0.85 + uncertainty)
    now = datetime.now(timezone.utc).isoformat()
    probs = {key: 0.08 for key in WEIGHTS}
    probs[regime] = 0.68
    vol_class = "Low volatility" if vol_rank < 0.25 else "Normal volatility" if vol_rank < 0.6 else "High volatility" if vol_rank < 0.85 else "Extreme volatility"
    return {
        "simulated": True,
        "engine": "demonstration-fusion-v0.1",
        "modelVersion": "demo-fusion-0.1",
        "symbol": symbol,
        "name": inst["name"],
        "exchange": inst["exchange"],
        "currency": inst["currency"],
        "timeframe": timeframe,
        "horizon": horizon,
        "horizonLabel": HORIZONS.get(horizon, horizon),
        "generatedAt": now,
        "dataAsOf": datetime.fromtimestamp(candles[-1].time, timezone.utc).isoformat(),
        "price": price,
        "direction": direction,
        "bullishProbability": p_bull,
        "bearishProbability": 1 - p_bull,
        "confidence": confidence,
        "uncertainty": uncertainty,
        "score": score,
        "equalWeightScore": equal,
        "equalWeightDirection": equal_direction,
        "expectedLow": max(0, price - band),
        "expectedHigh": price + band,
        "volatility": {"class": vol_class, "atr": atr, "atrPercent": atr_pct, "percentile": vol_rank, "hvAnnualized": hv},
        "regime": {
            "id": regime,
            "label": LABELS[regime],
            "probabilities": probs,
            "features": {"atrPercentile": vol_rank, "hvAnnualized": hv, "maSlope": ret10, "return20": ret10, "volumeZ": vol_z},
            "history": [],
            "disclaimer": "API demonstration regime estimate on simulated prices. Not validated on labelled data.",
        },
        "signals": signals,
        "dispersion": dispersion,
        "formula": {"k": k, "score": score, "pBull": p_bull},
        "narrative": [
            f"The API demonstration engine read the simulated {symbol} path as “{LABELS[regime]}”.",
            "This backend path is a simplified twin of the browser engine. It is still a heuristic, not a trained model.",
            "Directional probability and confidence are reported separately.",
        ],
        "disclaimer": "API demonstration output on simulated data. Not a forecast and not investment advice.",
    }


def sample_news() -> list[dict]:
    items = []
    templates = [
        ("constructive and resilient", "positive"),
        ("cautious tone and weak pressure", "negative"),
        ("scheduled and unchanged", "neutral"),
    ]
    for index, (symbol, inst) in enumerate(list(INSTRUMENTS.items())[:12]):
        for n, (words, _label) in enumerate(templates):
            headline = f"[SAMPLE] Synthetic desk note: {words} language tagged to {inst['name']} ({symbol}). Not a real article."
            score = 0.5 if "constructive" in words else -0.5 if "cautious" in words else 0.0
            items.append({
                "id": f"{symbol}-{n}",
                "headline": headline,
                "source": "MarketMind Sample Desk",
                "publishedAt": datetime.now(timezone.utc).isoformat(),
                "symbol": symbol,
                "name": inst["name"],
                "sector": inst["sector"],
                "market": inst["market"],
                "sentiment": {
                    "score": score,
                    "label": "positive" if score > 0.15 else "negative" if score < -0.15 else "neutral",
                    "positiveHits": ["constructive"] if score > 0 else [],
                    "negativeHits": ["cautious", "weak", "pressure"] if score < 0 else [],
                    "neutralHits": ["scheduled", "unchanged"] if score == 0 else [],
                    "method": "lexicon-baseline",
                },
                "simulated": True,
                "notice": "SAMPLE — not a real headline and not a published article",
            })
            index += 0
    return items
