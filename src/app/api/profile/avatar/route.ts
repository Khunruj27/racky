import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const fileName = `avatar-${Date.now()}.jpg`
    const path = `${user.id}/profile/${fileName}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('albums')
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('albums').getPublicUrl(path)

    const avatarUrl = data.publicUrl

    await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
      },
    })

    return NextResponse.json({
      success: true,
      avatarUrl,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}