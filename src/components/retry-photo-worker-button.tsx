'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  photoId: string
}

export default function RetryPhotoWorkerButton({ photoId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetry(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    try {
      setLoading(true)

      const res = await fetch('/api/worker/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        alert(data?.error || 'Retry failed')
        return
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Retry failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={loading}
      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600 shadow-sm transition active:scale-95 disabled:opacity-60"
    >
      {loading ? 'Retrying...' : 'Retry'}
    </button>
  )
}