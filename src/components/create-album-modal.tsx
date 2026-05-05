'use client'

import { useState } from 'react'
import CreateAlbumForm from '@/components/create-album-form'
import AppIcon from '@/components/app-icon'

export default function CreateAlbumModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 🔥 ปุ่ม Create */}
      <button
  type="button"
  onClick={() => setOpen(true)}
  className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[22px] bg-[#2F6BFF] text-center text-white shadow-sm transition active:scale-95"
>
  <AppIcon
    name="plus"
    size={26}
    className="translate-y-[3px] opacity-100"
  />

  <span className="text-[15px] font-semibold leading-tight">
    New Album
  </span>
</button>

      {/* 🔥 Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-md rounded-[32px] bg-white p-4 shadow-2xl animate-[fadeIn_0.2s_ease]">
            
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Create Album
                </h2>
                <p className="text-sm text-slate-500">
                  Create a new photo album
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* 🔥 FORM + AUTO CLOSE */}
            <CreateAlbumForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}