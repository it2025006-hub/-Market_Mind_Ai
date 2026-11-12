import { useEffect, useState } from 'react'

export function useLoad<T>(factory: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    factory().then(
      (next) => {
        if (!cancelled) {
          setData(next)
          setLoading(false)
        }
      },
      (err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Request failed')
          setLoading(false)
        }
      },
    )
    return () => {
      cancelled = true
    }
    // factory closes over the deps listed by the caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  return { data, error, loading, retry: () => setAttempt((value) => value + 1) }
}
