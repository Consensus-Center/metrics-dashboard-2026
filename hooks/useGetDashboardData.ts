'use client'

import { useCallback, useState } from 'react'

export type DashboardData = {
  metrics: Record<string, unknown>[]
  sections: Record<string, unknown>[]
  history: Record<string, unknown>[]
  operators: Record<string, unknown>[]
}

/**
 * Drop-in replacement for Retool's generated `useGetDashboardData` hook.
 * Exposes the same `{ data, error, isLoading, trigger }` surface the app uses,
 * but fetches from our own /api/dashboard route handler instead of Retool.
 */
export function useGetDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  const trigger = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      const json = (await res.json()) as DashboardData
      setData(json)
      return json
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, error, isLoading, trigger }
}
