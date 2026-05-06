'use client'

import { useMemo, useState } from 'react'
import FaceSearchButton from './face-search-button'
import FaceSearchPanel from './face-search-panel'

type Photo = {
  id: string
  thumbnail_url?: string | null
  preview_url?: string | null
  public_url?: string | null
}

export default function ShareClient({ token, photos }: any) {
  const [filterIds, setFilterIds] = useState<string[] | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!filterIds) return photos
    const set = new Set(filterIds)
    return photos.filter((p: Photo) => set.has(p.id))
  }, [photos, filterIds])

  return (
    <>
      <FaceSearchButton onClick={() => setOpen(true)} />

      {open && (
        <FaceSearchPanel
          token={token}
          onSelect={setFilterIds}
          onClose={() => setOpen(false)}
        />
      )}

      <div className="grid grid-cols-3 gap-1 p-2">
        {filtered.map((p: Photo) => {
          const src = p.thumbnail_url || p.preview_url || p.public_url
          if (!src) return null
          return (
            <img
              key={p.id}
              src={src}
              className="aspect-square object-cover"
            />
          )
        })}
      </div>
    </>
  )
}