'use client'

import { useState } from 'react'

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    try {
      setLoading(true)

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to open billing portal')
      }

      window.location.href = data.url
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={loading}
      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
    >
      {loading ? 'Opening...' : 'Manage Billing'}
    </button>
  )
}