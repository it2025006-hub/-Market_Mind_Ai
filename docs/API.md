# API

Base URL in development: `http://localhost:8000`

All market payloads are simulated unless a future adapter is configured with a server-side key. The browser is not given secrets.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness, demo flag, whether optional keys are set |
| GET | `/api/meta` | Disclaimer and the list of models that are not loaded |
| GET | `/api/market/instruments` | Research universe |
| GET | `/api/market/quotes?symbols=RELIANCE,NIFTY&nonce=0` | Simulated quotes |
| GET | `/api/market/ohlcv?symbol=RELIANCE&timeframe=1d&nonce=0` | Simulated OHLCV |
| GET | `/api/news` | Sample desk notes and lexicon scores |
| POST | `/api/predict` | Demonstration fusion result |
| GET | `/api/analysis/regime?symbol=RELIANCE` | Regime block from the same engine |

Prediction body:

```json
{
  "symbol": "RELIANCE",
  "timeframe": "1d",
  "horizon": "next_session",
  "nonce": 0,
  "bars": 250
}
```

Allowed timeframes: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`.

Allowed horizons: `next_session`, `3_sessions`, `5_sessions`, `1_hour`, `4_hours`.

Unknown symbols, timeframes and horizons return 422. More than 120 API calls a minute from one address return 429.

Interactive documentation is served at `/docs`.

## Optional environment

| Variable | Where | Meaning |
| --- | --- | --- |
| `CORS_ORIGINS` | API | Comma-separated browser origins |
| `DATABASE_URL` | API | Reserved for PostgreSQL. Schema: `backend/app/db/schema.sql` |
| `MARKET_DATA_API_KEY` | API only | Future historical/quote vendor. Empty means demo data |
| `NEWS_API_KEY` | API only | Future news vendor. Empty means sample notes |
| `VITE_API_MODE` | Frontend build | `demo` or `backend` |
| `VITE_API_BASE_URL` | Frontend build | API origin. Not a secret |

The running prototype does not call a paid vendor even if a key is present. The health payload only reports whether a key was configured, so a reviewer can see the extension point without the service pretending to be live.
