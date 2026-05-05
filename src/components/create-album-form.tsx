'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  onSuccess?: () => void
}

export default function CreateAlbumForm({ onSuccess }: Props) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setError('')

    if (!title.trim()) {
      setError('Please enter album title')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/albums/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Create album failed')
        return
      }

      setTitle('')
      setDescription('')

      onSuccess?.()
      router.refresh()
    } catch {
      setError('Create album failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 p-3">
      <input
        type="text"
        placeholder="Album title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
        className="w-full rounded-xl border border-slate-200 p-3"
      />

      <textarea
        placeholder="Album description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
        className="w-full rounded-xl border border-slate-200 p-3"
      />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 text-white disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Album'}
      </button>
    </div>
  )
}