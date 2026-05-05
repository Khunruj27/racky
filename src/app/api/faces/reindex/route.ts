import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const albumId = String(body?.albumId || '').trim()

    if (!albumId) {
      return NextResponse.json(
        { error: 'albumId is required' },
        { status: 400 }
      )
    }

    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id, owner_id')
      .eq('id', albumId)
      .eq('owner_id', user.id)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select(`
        id,
        album_id,
        owner_id,
        filename,
        public_url,
        preview_url,
        thumbnail_url,
        processing_status
      `)
      .eq('album_id', albumId)
      .eq('owner_id', user.id)
      .eq('processing_status', 'ready')
      .order('created_at', { ascending: false })

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      albumId,
      readyPhotos: photos?.length ?? 0,
      message: 'Face reindex API is ready. Next step is face detection.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Face reindex failed',
      },
      { status: 500 }
    )
  }
}