import { useEffect, useRef, useState } from 'react'
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { bollinger, macd, rsi, sma } from '@/lib/indicators'
import type { Candle } from '@/lib/indicators'

export interface VisibleRange {
  from: number
  to: number
}

export interface ChartMarker {
  time: number
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown' | 'circle'
  text: string
}

export interface ChartPriceLine {
  price: number
  title: string
  color: string
}

interface SharedProps {
  candles: Candle[]
  height?: number
  theme: 'dark' | 'light'
  logicalRange?: VisibleRange | null
  onLogicalRangeChange?: (range: VisibleRange) => void
}

function readColors() {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  return {
    card: read('--card', '#142238'),
    text: read('--muted', '#94A3B8'),
    grid: read('--line', 'rgba(148,163,184,0.12)'),
    bull: read('--bull', '#16C784'),
    bear: read('--bear', '#EA3943'),
    accent: read('--accent', '#2684FF'),
    cyan: read('--cyan', '#22D3EE'),
    amber: read('--amber', '#F5B942'),
  }
}

function useChart(height: number, theme: string, onLogicalRangeChange?: (range: VisibleRange) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const callbackRef = useRef(onLogicalRangeChange)
  const [tick, setTick] = useState(0)
  callbackRef.current = onLogicalRangeChange

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const colors = readColors()
    const chart = createChart(node, {
      width: node.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: colors.card },
        textColor: colors.text,
        fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: colors.grid },
      timeScale: { borderColor: colors.grid, timeVisible: true, secondsVisible: false },
    })
    chartRef.current = chart
    setTick((value) => value + 1)
    const onRange = (range: { from: number; to: number } | null) => {
      if (range) callbackRef.current?.(range)
    }
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange)
    const observer = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth, height })
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange)
      chart.remove()
      chartRef.current = null
    }
  }, [height, theme])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    if (!onLogicalRangeChange && !chart) return
    const range = chart.timeScale().getVisibleLogicalRange()
    if (!range) chart.timeScale().fitContent()
  }, [onLogicalRangeChange])

  return { ref, chartRef, tick }
}

function syncRange(chart: IChartApi | null, logicalRange?: VisibleRange | null) {
  if (!chart || !logicalRange) return
  const current = chart.timeScale().getVisibleLogicalRange()
  if (current && Math.abs(current.from - logicalRange.from) < 0.08 && Math.abs(current.to - logicalRange.to) < 0.08) return
  chart.timeScale().setVisibleLogicalRange(logicalRange)
}

function dedupeMarkers(markers: ChartMarker[]) {
  const map = new Map<string, ChartMarker>()
  markers.forEach((marker) => map.set(`${marker.time}-${marker.text}`, marker))
  return [...map.values()].sort((a, b) => a.time - b.time)
}

export function CandleChart({
  candles,
  height = 460,
  theme,
  showVolume = true,
  showMA = true,
  showBB = false,
  markers = [],
  priceLines = [],
  logicalRange,
  onLogicalRangeChange,
}: SharedProps & {
  showVolume?: boolean
  showMA?: boolean
  showBB?: boolean
  markers?: ChartMarker[]
  priceLines?: ChartPriceLine[]
}) {
  const { ref, chartRef, tick } = useChart(height, theme, onLogicalRangeChange)
  const markerKey = JSON.stringify(markers)
  const lineKey = JSON.stringify(priceLines)

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || candles.length === 0) return
    const colors = readColors()
    const created: ISeriesApi<'Candlestick' | 'Histogram' | 'Line'>[] = []
    const series = chart.addCandlestickSeries({
      upColor: colors.bull,
      downColor: colors.bear,
      borderVisible: false,
      wickUpColor: colors.bull,
      wickDownColor: colors.bear,
    })
    created.push(series)
    series.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })))
    series.setMarkers(
      dedupeMarkers(markers).map((marker) => ({
        time: marker.time as UTCTimestamp,
        position: marker.position,
        color: marker.color,
        shape: marker.shape,
        text: marker.text,
      })),
    )
    priceLines.forEach((line) => {
      series.createPriceLine({
        price: line.price,
        color: line.color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: line.title,
      })
    })
    if (showVolume) {
      const volume = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
      created.push(volume)
      volume.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(22,199,132,0.45)' : 'rgba(234,57,67,0.45)',
        })),
      )
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
      series.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.24 } })
    }
    const closes = candles.map((c) => c.close)
    const addLine = (color: string, values: Array<number | null>, dashed = false) => {
      const line = chart.addLineSeries({
        color,
        lineWidth: 1,
        lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      created.push(line)
      line.setData(values.flatMap((value, i) => (value == null ? [] : [{ time: candles[i].time as UTCTimestamp, value }])))
    }
    if (showMA) {
      addLine(colors.accent, sma(closes, 20))
      addLine(colors.cyan, sma(closes, 50))
    }
    if (showBB) {
      const bands = bollinger(closes, 20, 2)
      addLine('rgba(245,185,66,0.85)', bands.upper, true)
      addLine('rgba(245,185,66,0.85)', bands.lower, true)
    }
    if (!logicalRange) chart.timeScale().fitContent()
    return () => {
      created.forEach((item) => {
        try {
          chart.removeSeries(item)
        } catch {
          /* chart already disposed */
        }
      })
    }
    // logicalRange is applied separately so scrolling does not rebuild series
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, showVolume, showMA, showBB, markerKey, lineKey, theme, chartRef, tick])

  useEffect(() => {
    syncRange(chartRef.current, logicalRange)
  }, [logicalRange, chartRef, candles])

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-xl" />
}

export function RsiChart({ candles, height = 148, theme, logicalRange, onLogicalRangeChange }: SharedProps) {
  const { ref, chartRef, tick } = useChart(height, theme, onLogicalRangeChange)
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || candles.length === 0) return
    const colors = readColors()
    const series = chart.addLineSeries({ color: colors.cyan, lineWidth: 2, priceLineVisible: false })
    const values = rsi(candles.map((c) => c.close), 14)
    series.setData(values.flatMap((value, i) => (value == null ? [] : [{ time: candles[i].time as UTCTimestamp, value }])))
    series.createPriceLine({ price: 70, color: colors.bear, lineStyle: LineStyle.Dotted, lineWidth: 1, title: '70' })
    series.createPriceLine({ price: 30, color: colors.bull, lineStyle: LineStyle.Dotted, lineWidth: 1, title: '30' })
    if (!logicalRange) chart.timeScale().fitContent()
    return () => {
      try { chart.removeSeries(series) } catch { /* disposed */ }
    }
  }, [candles, theme, chartRef, tick])
  useEffect(() => syncRange(chartRef.current, logicalRange), [logicalRange, chartRef, candles, tick])
  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-xl" />
}

export function MacdChart({ candles, height = 156, theme, logicalRange, onLogicalRangeChange }: SharedProps) {
  const { ref, chartRef, tick } = useChart(height, theme, onLogicalRangeChange)
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || candles.length === 0) return
    const colors = readColors()
    const result = macd(candles.map((c) => c.close))
    const line = chart.addLineSeries({ color: colors.accent, lineWidth: 2, priceLineVisible: false })
    const signal = chart.addLineSeries({ color: colors.amber, lineWidth: 1, priceLineVisible: false })
    const hist = chart.addHistogramSeries({ priceLineVisible: false })
    line.setData(result.macd.flatMap((value, i) => (value == null ? [] : [{ time: candles[i].time as UTCTimestamp, value }])))
    signal.setData(result.signal.flatMap((value, i) => (value == null ? [] : [{ time: candles[i].time as UTCTimestamp, value }])))
    hist.setData(
      result.histogram.flatMap((value, i) =>
        value == null ? [] : [{ time: candles[i].time as UTCTimestamp, value, color: value >= 0 ? 'rgba(22,199,132,0.75)' : 'rgba(234,57,67,0.75)' }],
      ),
    )
    if (!logicalRange) chart.timeScale().fitContent()
    return () => {
      ;[line, signal, hist].forEach((item) => {
        try { chart.removeSeries(item) } catch { /* disposed */ }
      })
    }
  }, [candles, theme, chartRef, tick])
  useEffect(() => syncRange(chartRef.current, logicalRange), [logicalRange, chartRef, candles, tick])
  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-xl" />
}
