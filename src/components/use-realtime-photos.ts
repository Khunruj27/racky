'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useRealtimePhotos(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
        },
        () => {
          console.log('Photo updated → refresh UI')
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}