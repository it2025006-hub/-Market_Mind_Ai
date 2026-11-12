# Methodology

MarketMind AI proposes an adaptive multi-signal framework. The running prototype demonstrates the framework with a transparent heuristic on a simulated factor dataset. It does not report experimental results.

## Signals

Each signal is scaled to approximately [-1, 1].

| Signal | Demonstration definition |
| --- | --- |
| Momentum | Blend of the 10-bar return, RSI distance from 50, and the 20/50 moving-average stack |
| Sentiment | Mean lexicon score of SAMPLE notes tagged to the symbol |
| Volatility | Inverted ATR percentile. Elevated volatility reduces the bullish score in this policy |
| Cross-market | Average recent return of related simulated series |
| Volume | Volume z-score signed by momentum, used as confirmation |

The volatility sign is a design choice of the policy, not a proven risk-off law.

## Regime labels

Five labels are produced from ATR percentile, realised volatility, moving-average slope, 20-bar return and a volume z-score. Scores are turned into a softmax. The largest score is the displayed label.

These labels have not been checked against a hand-labelled regime set. They must not be described as calibrated regime probabilities.

## Adaptive weights

The active label selects a fixed weight row. The rows are published in the interface. They were chosen to illustrate the idea that a high-volatility state should lean less on momentum and more on the volatility signal. They are not fitted coefficients.

```
score = Σ weight_i × signal_i
p(bull) = 1 / (1 + exp(-2.2 × score))
```

An equal-weight score is shown beside the adaptive score. Agreement or disagreement is a methodological illustration, not an accuracy test.

## Uncertainty and confidence

Dispersion across signals and an elevated ATR percentile widen uncertainty. Confidence rises only when the probability is decisive and uncertainty is not high. A 65% bullish probability can therefore sit next to a much lower confidence. That separation is intentional.

The expected range is last price ± ATR × √horizon × (0.85 + uncertainty). It is not a statistical confidence interval from a fitted model.

## Explanations

The bars on the prediction page are weight × signal. The layout is compatible with an additive SHAP explanation. They are not SHAP values, and they are not evidence of causation.

## Correlation dataset

Instruments share planted factors (India, US, USD, rates, risk, energy, crypto) plus an idiosyncratic shock. Pearson correlation is then computed on those simulated returns. The loadings are shown in the product so a reviewer can see why NIFTY and SENSEX move together and why gold is built to move against the USD factor.

## Evaluation that has not been run

The intended protocol, once data and trained artifacts exist:

1. Time-ordered train, validation and test splits.
2. Walk-forward evaluation.
3. Purging of overlapping horizon labels to limit leakage.
4. Separate scoring of direction, probability calibration and range error.
5. Subtraction of brokerage, spread and slippage before any strategy arithmetic.

Until that protocol is executed, the performance page shows definitions and placeholders only.

## Sentiment

The active scorer is a financial lexicon. FinBERT is the intended adapter and is not loaded. Headlines are templates from “MarketMind Sample Desk”. They are not scraped and not presented as published journalism.

## Liquidity zones

Swing highs and lows use a fractal rule. A zone is a cluster of recent swings within 0.4%. A volume spike is a bar above mean + 2 standard deviations and 1.8× the recent mean. A failed break is a close back inside the prior 20-bar range within three bars. Every label is an algorithmic estimate on simulated prices, not a confirmed institutional order.
