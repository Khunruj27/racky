import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.name.endsWith('.xmp')) {
    return NextResponse.json({ error: 'Only .xmp allowed' }, { status: 400 })
  }

  const path = `${user.id}/presets/${Date.now()}-${file.name}`

  const { error } = await supabase.storage
    .from('presets')
    .upload(path, file)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, path })
}