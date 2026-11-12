# MarketMind AI

**Understand the Market. Predict with Intelligence.**

An explainable, regime-aware, multi-signal stock-market research prototype for University of Engineering & Management, Kolkata.

This is an educational system. Prices, headlines, correlations and predictions are simulated or clearly marked sample material. They are not live market data, not investment advice, and not a validated track record.

| | |
| --- | --- |
| Student | Srinjoy Bose |
| Enrolment | 12025002029066 |
| Registration | 304202500900234 |
| Roll / Section | 84 / A |
| Mentor | Dr. Raktim Kumar Dey |
| Institution | University of Engineering & Management, Kolkata |

## What is actually running

- A React workspace with twelve functional views, charts, filters, a watchlist, local prediction history and CSV export.
- A transparent **demonstration fusion engine** in the browser. It reweights momentum, lexicon sentiment, volatility, cross-market context and volume using a regime policy.
- Probability and confidence are separate. Explanations are additive contributions, in a SHAP-compatible layout, not SHAP values from a fitted model.
- A FastAPI service with the same kind of demonstration engine, validation, logging and rate limiting.
- Slots for Random Forest, XGBoost, LSTM / GRU, FinBERT and SHAP. Those artifacts are **not trained or loaded**. The model-performance page therefore shows no accuracy numbers.

## Demo path for a review

1. Open the landing page and read the disclaimer.
2. Enter the dashboard. Switch timeframe, toggle RSI / MACD / Bollinger, and select another card.
3. Press `/` and add a symbol to the watchlist.
4. Open **AI Prediction**, keep RELIANCE, and run the demonstration.
5. Read probability against confidence, then open the calculation disclosure.
6. Open **Market Intelligence** for the regime ribbon and weight table.
7. Open **Risk Assessment**, enter a stop, and note the warning if volatility is elevated.
8. Open **Prediction History** and export CSV. Outcome stays “not evaluated”.
9. Open **Model Performance** and confirm that metrics are placeholders.
10. Open **About** for the research framing.

## Run the interface

Requirements: Node.js 20+ and npm (or pnpm).

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Demo mode does not need the API.

Production build:

```bash
cd frontend
npm run build
npm run preview
```

## Run the API

Requirements: Python 3.11+.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/api/health
- Interactive docs: http://localhost:8000/docs

In the app, open **Settings**, choose Backend, set `http://localhost:8000`, and test the connection. Keys are read only from the server environment. The browser never asks for them.

If `MARKET_DATA_API_KEY` or `NEWS_API_KEY` is empty, the API stays on its demonstration engine. That is intentional.

## Docker

```bash
docker compose up --build
```

The interface is published on port 5173 and the API on port 8000. PostgreSQL is not started by default. `backend/app/db/schema.sql` is the optional research store.

## Project map

```
frontend/     React, TypeScript, Tailwind, Lightweight Charts, Recharts
backend/      FastAPI demonstration API
docs/         Methodology and API notes
```

The frontend data boundary is `frontend/src/services/api.ts`. Demo mode never leaves the browser. Backend mode calls the REST contract without rebuilding the pages.

## What not to claim in a viva

- Do not call the fusion output a trained-model forecast.
- Do not read correlation on this site as a real-market estimate. The factor loadings are disclosed on the correlation page.
- Do not quote an accuracy, F1, AUC or profit figure. None has been computed.
- Sample headlines are written by the prototype and scored with a lexicon. They are not wire stories and not FinBERT.

See [docs/METHODOLOGY.md](docs/METHODOLOGY.md) and [docs/API.md](docs/API.md).
