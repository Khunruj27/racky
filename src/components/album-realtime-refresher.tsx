'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type Props = {
  albumId: string
}

export default function AlbumRealtimeRefresher({ albumId }: Props) {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!albumId) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const refreshSoftly = () => {
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        router.refresh()
      }, 700)
    }

    const channel = supabase
      .channel(`album-photos-${albumId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        () => {
          refreshSoftly()
        }
      )
      .subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [albumId, router])

  return null
}