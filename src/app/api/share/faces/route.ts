import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // หา album จาก token
  const { data: album } = await supabase
    .from('albums')
    .select('id')
    .eq('share_token', token)
    .single()

  if (!album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 })
  }

  // เอา cluster
  const { data: clusters } = await supabase
    .from('face_clusters')
    .select('id, label, face_count')
    .eq('album_id', album.id)
    .order('face_count', { ascending: false })

  const clusterIds = clusters?.map((c) => c.id) || []

  // map cluster → photo_ids
  const { data: embeddings } = await supabase
    .from('face_embeddings')
    .select('cluster_id, photo_id')
    .in('cluster_id', clusterIds)

  const map: Record<string, string[]> = {}

  for (const row of embeddings || []) {
    if (!row.cluster_id) continue
    if (!map[row.cluster_id]) map[row.cluster_id] = []
    if (!map[row.cluster_id].includes(row.photo_id)) {
      map[row.cluster_id].push(row.photo_id)
    }
  }

  return NextResponse.json({
    clusters: (clusters || []).map((c, i) => ({
      id: c.id,
      label: c.label || `Person ${i + 1}`,
      photo_ids: map[c.id] || [],
    })),
  })
}