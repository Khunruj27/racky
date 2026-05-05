'use client'

import { useEffect } from 'react'

export default function AutoWorker() {
  useEffect(() => {
    let isRunning = false
    let stopped = false

    async function runWorker() {
      if (isRunning || stopped) return

      try {
        isRunning = true
        await fetch('/api/worker/auto', { cache: 'no-store' })
      } catch {
      } finally {
        isRunning = false
      }
    }

    runWorker()
    const interval = setInterval(runWorker, 3000)

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [])

  return null
}