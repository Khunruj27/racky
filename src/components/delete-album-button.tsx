'use client'

import { useState } from 'react'
import AppIcon from '@/components/app-icon'
import IconButton from '@/components/icon-button'

type Props = {
  albumId: string
}

export default function DeleteAlbumButton({ albumId }: Props) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (deleting) return

    const ok = confirm(
      'Delete this album?\n\nThis will remove photos and storage files too.'
    )

    if (!ok) return

    try {
      setDeleting(true)

      const res = await fetch('/api/albums/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        alert(data?.error || 'Delete failed')
        setDeleting(false)
        return
      }

      window.location.href = '/albums'
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
  type="button"
  onClick={handleDelete}
  disabled={deleting}
  className="absolute right-3 top-3 z-10 !bg-transparent !shadow-none !ring-0 p-0"
  title="Delete album"
>
  {deleting ? (
    <span className="text-sm text-red-500">…</span>
  ) : (
    <AppIcon
                  name="delete"
                  size={18}                // 🔥 ปรับขนาดตรงนี้
                  className="opacity-80"
                />
  )}
</button>

      {deleting ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[330px] rounded-[30px] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#2F6BFF]" />

            <h2 className="mt-5 text-lg font-bold text-slate-950">
              Deleting album
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Removing photos, storage files, and album data...
            </p>

            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#2F6BFF]" />
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Please wait, do not close this page.
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}