import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FacePayload = {
  embedding: number[]
  box: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const supabaseAdmin = getSupabaseAdmin()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: userError?.message },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => null)

    const albumId = String(body?.albumId || '').trim()
    const photoId = String(body?.photoId || '').trim()
    const faces = Array.isArray(body?.faces)
      ? (body.faces as FacePayload[])
      : []

    if (!albumId || !photoId) {
      return NextResponse.json(
        {
          error: 'albumId and photoId are required',
          albumId,
          photoId,
        },
        { status: 400 }
      )
    }

    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, album_id, owner_id')
      .eq('id', photoId)
      .eq('album_id', albumId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (photoError) {
      return NextResponse.json(
        { error: 'Photo query failed', detail: photoError.message },
        { status: 500 }
      )
    }

    if (!photo) {
      return NextResponse.json(
        {
          error: 'Photo not found',
          albumId,
          photoId,
          ownerId: user.id,
        },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabaseAdmin
      .from('face_embeddings')
      .delete()
      .eq('photo_id', photoId)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Delete old faces failed', detail: deleteError.message },
        { status: 500 }
      )
    }

    if (faces.length === 0) {
      return NextResponse.json({
        success: true,
        photoId,
        facesSaved: 0,
        message: 'No faces detected',
      })
    }

    const rows = faces.map((face) => ({
      owner_id: user.id,
      album_id: albumId,
      photo_id: photoId,
      cluster_id: null,
      embedding: face.embedding,
      box: face.box,
      confidence: face.confidence,
    }))

    const { error: insertError } = await supabaseAdmin
      .from('face_embeddings')
      .insert(rows)

    if (insertError) {
      return NextResponse.json(
        {
          error: 'Insert face embeddings failed',
          detail: insertError.message,
          hint: insertError.hint,
          code: insertError.code,
          sampleRow: rows[0],
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photoId,
      facesSaved: faces.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Save faces failed',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}