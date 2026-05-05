import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
    const title = String(body?.title || '').trim()
    const description = String(body?.description || '').trim()

    if (!title) {
      return NextResponse.json(
        { error: 'Album title is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('albums').insert({
      title,
      description,
      owner_id: user.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Create album failed' },
      { status: 500 }
    )
  }
}