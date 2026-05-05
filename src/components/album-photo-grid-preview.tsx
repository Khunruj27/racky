'use client'

import React, { useEffect, useRef, useState } from 'react'
import DeletePhotoButton from '@/components/delete-photo-button'

type Photo = {
  id: string
  public_url: string
  preview_url?: string | null
  thumbnail_url?: string | null
  filename?: string | null
}

function preloadImage(src?: string | null) {
  if (!src) return
  const img = new Image()
  img.src = src
}

export default function AlbumPhotoGridPreview({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)

  // 👇 swipe state
  const startX = useRef(0)
  const deltaX = useRef(0)

  // 👇 pinch zoom state
  const scale = useRef(1)
  const lastDistance = useRef(0)

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null

  // 🔥 preload รอบๆ
  useEffect(() => {
    if (activeIndex === null) return
    preloadImage(photos[activeIndex + 1]?.preview_url)
    preloadImage(photos[activeIndex - 1]?.preview_url)
  }, [activeIndex, photos])

  // ======================
  // 👉 SWIPE
  // ======================
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX
    }

    // pinch start
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastDistance.current = Math.sqrt(dx * dx + dy * dy)
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    // swipe
    if (e.touches.length === 1) {
      deltaX.current = e.touches[0].clientX - startX.current
    }

    // pinch zoom
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)

      const diff = dist - lastDistance.current
      scale.current = Math.min(3, Math.max(1, scale.current + diff * 0.005))
      lastDistance.current = dist

      if (containerRef.current) {
        containerRef.current.style.transform = `scale(${scale.current})`
      }
    }
  }

  function handleTouchEnd() {
    // swipe trigger
    if (deltaX.current > 80) {
      setActiveIndex((i) => (i ? i - 1 : i))
    }

    if (deltaX.current < -80) {
      setActiveIndex((i) =>
        i !== null ? Math.min(i + 1, photos.length - 1) : i
      )
    }

    deltaX.current = 0
  }

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-3 gap-[2px] px-[2px]">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() =>
              preloadImage(photo.preview_url || photo.public_url)
            }
            onTouchStart={() =>
              preloadImage(photo.preview_url || photo.public_url)
            }
            className="cursor-pointer active:scale-[0.98] transition"
          >
            <img
              src={photo.thumbnail_url || photo.preview_url || photo.public_url}
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* FULLSCREEN */}
      {activeIndex !== null && activePhoto && (
        <div className="fixed inset-0 z-[999] bg-black text-white">
          {/* header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between">
            <button onClick={() => setActiveIndex(null)}>✕</button>
            <DeletePhotoButton photoId={activePhoto.id} />
          </div>

          {/* IMAGE */}
          <div
            ref={containerRef}
            className="flex h-full items-center justify-center transition-transform duration-100"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activePhoto.preview_url || activePhoto.public_url}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  )
}