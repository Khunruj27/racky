'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import IconButton from '@/components/icon-button'

type Props = {
  albumId: string
  initialTitle: string
  initialDescription: string | null
  iconOnly?: boolean
}

export default function EditAlbumForm({
  albumId,
  initialTitle,
  initialDescription,
  iconOnly = false,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription || '')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!title.trim()) {
      setErrorMsg('Title is required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/albums/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albumId,
          title: title.trim(),
          description: description.trim(),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update album')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Failed to update album'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {iconOnly ? (
        <IconButton
  icon="pen"                 // ใช้ public/icons/edit.svg
  title="Edit Album"
  onClick={() => setOpen(true)}
  variant="ghost"
  size="sm"
  className="rounded-full bg-slate-100 hover:bg-slate-200 p-0"
  iconClassName="w-6 h-6 opacity-80"
  

/>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Edit Album
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 flex items-start justify-center pt-[12vh] sm:pt-[14vh]">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Edit Album
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-500">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  placeholder="Album title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-500">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  placeholder="Album description"
                />
              </div>

              {errorMsg ? (
                <p className="text-sm text-red-500">{errorMsg}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}