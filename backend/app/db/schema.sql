-- Optional research store. The prototype runs without PostgreSQL.
-- Prediction rows saved here are still demonstration outputs unless a
-- later experiment writes evaluated outcomes.

CREATE TABLE IF NOT EXISTS instruments (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL,
    currency TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    exchange TEXT NOT NULL,
    horizon TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    direction TEXT NOT NULL,
    bullish_probability DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    regime TEXT NOT NULL,
    model_version TEXT NOT NULL,
    simulated BOOLEAN NOT NULL DEFAULT TRUE,
    outcome TEXT NOT NULL DEFAULT 'not_evaluated',
    actual_movement DOUBLE PRECISION,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS predictions_symbol_created_idx
    ON predictions (symbol, created_at DESC);
