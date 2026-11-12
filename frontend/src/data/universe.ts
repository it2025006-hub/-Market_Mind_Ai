export const FACTOR_NAMES = ['india', 'us', 'usd', 'rates', 'risk', 'energy', 'crypto'] as const
export type FactorName = (typeof FACTOR_NAMES)[number]
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
export type AssetClass = 'index' | 'equity' | 'commodity' | 'fx' | 'crypto' | 'rates'
export type Market = 'IN' | 'US' | 'GLOBAL'

export interface Instrument {
  symbol: string
  name: string
  exchange: string
  assetClass: AssetClass
  sector: string
  currency: 'INR' | 'USD'
  market: Market
  /** Fictional seed used only to start the simulator. Not a market quote. */
  basePrice: number
  volatility: number
  baseVolume: number
  loadings: Partial<Record<FactorName, number>>
  idio: number
}

export const TIMEFRAMES: { id: Timeframe; label: string; seconds: number; bars: number }[] = [
  { id: '1m', label: '1m', seconds: 60, bars: 360 },
  { id: '5m', label: '5m', seconds: 300, bars: 360 },
  { id: '15m', label: '15m', seconds: 900, bars: 360 },
  { id: '1h', label: '1H', seconds: 3600, bars: 400 },
  { id: '4h', label: '4H', seconds: 14400, bars: 360 },
  { id: '1d', label: '1D', seconds: 86400, bars: 504 },
]

export const FACTOR_SIGMA: Record<FactorName, number> = {
  india: 0.008,
  us: 0.0085,
  usd: 0.0042,
  rates: 0.0038,
  risk: 0.009,
  energy: 0.011,
  crypto: 0.018,
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50', exchange: 'NSE', assetClass: 'index', sector: 'Index', currency: 'INR', market: 'IN', basePrice: 25000, volatility: 0.011, baseVolume: 280_000_000, loadings: { india: 0.95, us: 0.22, risk: 0.16 }, idio: 0.0035 },
  { symbol: 'SENSEX', name: 'SENSEX', exchange: 'BSE', assetClass: 'index', sector: 'Index', currency: 'INR', market: 'IN', basePrice: 82000, volatility: 0.011, baseVolume: 120_000_000, loadings: { india: 0.93, us: 0.2, risk: 0.14 }, idio: 0.0034 },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank', exchange: 'NSE', assetClass: 'index', sector: 'Banking', currency: 'INR', market: 'IN', basePrice: 53000, volatility: 0.014, baseVolume: 180_000_000, loadings: { india: 0.82, risk: 0.28 }, idio: 0.005 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', assetClass: 'equity', sector: 'Energy', currency: 'INR', market: 'IN', basePrice: 1400, volatility: 0.016, baseVolume: 8_500_000, loadings: { india: 0.55, energy: 0.72, risk: 0.16 }, idio: 0.007 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', assetClass: 'equity', sector: 'Information Technology', currency: 'INR', market: 'IN', basePrice: 4000, volatility: 0.013, baseVolume: 2_400_000, loadings: { india: 0.42, us: 0.38 }, idio: 0.006 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', assetClass: 'equity', sector: 'Banking', currency: 'INR', market: 'IN', basePrice: 1700, volatility: 0.014, baseVolume: 12_000_000, loadings: { india: 0.62, risk: 0.22 }, idio: 0.006 },
  { symbol: 'INFY', name: 'Infosys', exchange: 'NSE', assetClass: 'equity', sector: 'Information Technology', currency: 'INR', market: 'IN', basePrice: 1800, volatility: 0.015, baseVolume: 6_200_000, loadings: { india: 0.4, us: 0.42 }, idio: 0.0065 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', assetClass: 'equity', sector: 'Banking', currency: 'INR', market: 'IN', basePrice: 1300, volatility: 0.016, baseVolume: 9_100_000, loadings: { india: 0.58, risk: 0.26 }, idio: 0.0065 },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', assetClass: 'equity', sector: 'Banking', currency: 'INR', market: 'IN', basePrice: 800, volatility: 0.018, baseVolume: 14_000_000, loadings: { india: 0.6, risk: 0.24 }, idio: 0.0075 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', exchange: 'NSE', assetClass: 'equity', sector: 'Telecom', currency: 'INR', market: 'IN', basePrice: 1600, volatility: 0.015, baseVolume: 4_800_000, loadings: { india: 0.5, risk: 0.12 }, idio: 0.0065 },
  { symbol: 'ITC', name: 'ITC', exchange: 'NSE', assetClass: 'equity', sector: 'FMCG', currency: 'INR', market: 'IN', basePrice: 470, volatility: 0.012, baseVolume: 8_200_000, loadings: { india: 0.38 }, idio: 0.0055 },
  { symbol: 'LT', name: 'Larsen & Toubro', exchange: 'NSE', assetClass: 'equity', sector: 'Industrials', currency: 'INR', market: 'IN', basePrice: 3600, volatility: 0.016, baseVolume: 1_800_000, loadings: { india: 0.56, risk: 0.2 }, idio: 0.007 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE', assetClass: 'equity', sector: 'FMCG', currency: 'INR', market: 'IN', basePrice: 2400, volatility: 0.012, baseVolume: 1_600_000, loadings: { india: 0.34 }, idio: 0.005 },
  { symbol: 'NDX', name: 'NASDAQ 100', exchange: 'NASDAQ', assetClass: 'index', sector: 'Index', currency: 'USD', market: 'US', basePrice: 21000, volatility: 0.013, baseVolume: 4_200_000_000, loadings: { us: 0.9, risk: 0.38 }, idio: 0.0038 },
  { symbol: 'SPX', name: 'S&P 500', exchange: 'NYSE', assetClass: 'index', sector: 'Index', currency: 'USD', market: 'US', basePrice: 6000, volatility: 0.01, baseVolume: 3_800_000_000, loadings: { us: 0.96, risk: 0.16 }, idio: 0.0028 },
  { symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Information Technology', currency: 'USD', market: 'US', basePrice: 230, volatility: 0.016, baseVolume: 52_000_000, loadings: { us: 0.7, risk: 0.2 }, idio: 0.007 },
  { symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Information Technology', currency: 'USD', market: 'US', basePrice: 420, volatility: 0.015, baseVolume: 22_000_000, loadings: { us: 0.74, risk: 0.16 }, idio: 0.0065 },
  { symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Information Technology', currency: 'USD', market: 'US', basePrice: 140, volatility: 0.028, baseVolume: 220_000_000, loadings: { us: 0.62, risk: 0.55 }, idio: 0.012 },
  { symbol: 'GOOGL', name: 'Alphabet Class A', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Communication Services', currency: 'USD', market: 'US', basePrice: 180, volatility: 0.018, baseVolume: 24_000_000, loadings: { us: 0.68, risk: 0.22 }, idio: 0.0075 },
  { symbol: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Consumer Discretionary', currency: 'USD', market: 'US', basePrice: 210, volatility: 0.018, baseVolume: 32_000_000, loadings: { us: 0.66, risk: 0.24 }, idio: 0.0075 },
  { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Communication Services', currency: 'USD', market: 'US', basePrice: 600, volatility: 0.022, baseVolume: 14_000_000, loadings: { us: 0.58, risk: 0.34 }, idio: 0.009 },
  { symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ', assetClass: 'equity', sector: 'Consumer Discretionary', currency: 'USD', market: 'US', basePrice: 350, volatility: 0.032, baseVolume: 78_000_000, loadings: { us: 0.42, risk: 0.5 }, idio: 0.014 },
  { symbol: 'GOLD', name: 'Gold', exchange: 'COMEX', assetClass: 'commodity', sector: 'Metals', currency: 'USD', market: 'GLOBAL', basePrice: 2700, volatility: 0.009, baseVolume: 180_000, loadings: { usd: -0.65, rates: -0.48, risk: 0.1 }, idio: 0.0035 },
  { symbol: 'DXY', name: 'USD Index', exchange: 'ICE', assetClass: 'fx', sector: 'Currency', currency: 'USD', market: 'GLOBAL', basePrice: 104, volatility: 0.005, baseVolume: 32_000, loadings: { usd: 1, rates: 0.25 }, idio: 0.0014 },
  { symbol: 'BTC', name: 'Bitcoin', exchange: 'CRYPTO', assetClass: 'crypto', sector: 'Digital Assets', currency: 'USD', market: 'GLOBAL', basePrice: 95000, volatility: 0.035, baseVolume: 28_000, loadings: { crypto: 0.9, risk: 0.7, us: 0.22 }, idio: 0.012 },
  { symbol: 'US10Y', name: 'US 10Y Yield', exchange: 'UST', assetClass: 'rates', sector: 'Rates', currency: 'USD', market: 'US', basePrice: 4.2, volatility: 0.012, baseVolume: 520_000, loadings: { rates: 1, usd: 0.16 }, idio: 0.0016 },
]

export const FEATURED_SYMBOLS = ['NIFTY', 'SENSEX', 'NDX', 'SPX', 'GOLD', 'DXY'] as const

export const HEATMAP_SYMBOLS = ['NIFTY', 'SENSEX', 'NDX', 'SPX', 'GOLD', 'DXY', 'BTC', 'US10Y'] as const

export const STUDY_PAIRS = [
  { a: 'GOLD', b: 'DXY', title: 'Gold vs USD Index' },
  { a: 'NDX', b: 'SPX', title: 'Nasdaq 100 vs S&P 500' },
  { a: 'NIFTY', b: 'SENSEX', title: 'NIFTY 50 vs SENSEX' },
  { a: 'BTC', b: 'NDX', title: 'Bitcoin vs Nasdaq 100' },
  { a: 'GOLD', b: 'US10Y', title: 'Gold vs US 10Y yield' },
] as const

export const RELATED: Record<string, string[]> = {
  RELIANCE: ['NIFTY', 'GOLD'],
  TCS: ['NIFTY', 'NDX'],
  INFY: ['NIFTY', 'NDX'],
  HDFCBANK: ['BANKNIFTY', 'NIFTY'],
  ICICIBANK: ['BANKNIFTY', 'NIFTY'],
  SBIN: ['BANKNIFTY', 'NIFTY'],
  NIFTY: ['SENSEX', 'SPX'],
  SENSEX: ['NIFTY', 'SPX'],
  BANKNIFTY: ['NIFTY', 'HDFCBANK'],
  NDX: ['SPX', 'NVDA'],
  SPX: ['NDX', 'DXY'],
  GOLD: ['DXY', 'US10Y'],
  DXY: ['GOLD', 'US10Y'],
  BTC: ['NDX', 'SPX'],
  US10Y: ['DXY', 'GOLD'],
  NVDA: ['NDX', 'SPX'],
  AAPL: ['NDX', 'SPX'],
  MSFT: ['NDX', 'SPX'],
  TSLA: ['NDX', 'SPX'],
}

export function getInstrument(symbol: string) {
  const found = INSTRUMENTS.find((item) => item.symbol === symbol)
  if (!found) throw new Error(`Unknown instrument: ${symbol}`)
  return found
}

export function relatedSymbols(symbol: string) {
  return RELATED[symbol] ?? ['NIFTY', 'SPX']
}

export function timeframeSpec(timeframe: Timeframe) {
  const spec = TIMEFRAMES.find((item) => item.id === timeframe)
  if (!spec) throw new Error(`Unknown timeframe: ${timeframe}`)
  return spec
}

export const EXCHANGES = Array.from(new Set(INSTRUMENTS.map((item) => item.exchange)))
export const SECTORS = Array.from(new Set(INSTRUMENTS.map((item) => item.sector)))
export const MARKETS = ['IN', 'US', 'GLOBAL'] as const
