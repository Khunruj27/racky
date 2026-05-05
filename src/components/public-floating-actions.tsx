'use client'

import { useEffect, useState } from 'react'
import AppIcon from '@/components/app-icon'

type Props = {
  publicUrl?: string
  onShowQr?: () => void
}

export default function PublicFloatingActions({ publicUrl, onShowQr }: Props) {
  const [showTop, setShowTop] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setShowTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function copyLink() {
    const link = publicUrl || window.location.href

    try {
      await navigator.clipboard.writeText(link)
      alert('Copied public link')
    } catch {
      window.open(link, '_blank')
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-lg ring-1 ring-black/5 backdrop-blur active:scale-95"
          >
            <AppIcon name="link" size={18} />
            Share
          </button>

          {onShowQr ? (
            <button
              type="button"
              onClick={onShowQr}
              className="flex h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-lg ring-1 ring-black/5 backdrop-blur active:scale-95"
            >
              <AppIcon name="qr" size={18} />
              QR
            </button>
          ) : null}

          {showTop ? (
            <button
              type="button"
              onClick={scrollToTop}
              className="flex h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-lg ring-1 ring-black/5 backdrop-blur active:scale-95"
            >
              ↑
              Top
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2F6BFF] text-white shadow-xl shadow-blue-600/30 active:scale-95"
        title="Actions"
      >
        {open ? '×' : <AppIcon name="plus" size={24} className="invert brightness-0" />}
      </button>
    </div>
  )
}