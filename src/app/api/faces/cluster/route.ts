import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase admin env')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

function euclidean(a: number[], b: number[]) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return Infinity
  }

  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const supabaseAdmin = getSupabaseAdmin()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const albumId = String(body?.albumId || '').trim()

    if (!albumId) {
      return NextResponse.json({ error: 'albumId is required' }, { status: 400 })
    }

    const { data: embeddings, error } = await supabaseAdmin
      .from('face_embeddings')
      .select('*')
      .eq('album_id', albumId)
      .eq('owner_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!embeddings?.length) {
      return NextResponse.json({
        success: true,
        clusters: 0,
        faces: 0,
        message: 'No embeddings',
      })
    }

    await supabaseAdmin
      .from('face_clusters')
      .delete()
      .eq('album_id', albumId)
      .eq('owner_id', user.id)

    await supabaseAdmin
      .from('face_embeddings')
      .update({ cluster_id: null })
      .eq('album_id', albumId)
      .eq('owner_id', user.id)

    const threshold = 0.6
    const clusters: { center: number[]; items: any[] }[] = []

    for (const emb of embeddings) {
      const vector = Array.isArray(emb.embedding)
        ? emb.embedding
        : typeof emb.embedding === 'string'
          ? JSON.parse(emb.embedding)
          : emb.embedding

      if (!Array.isArray(vector)) continue

      let foundCluster: { center: number[]; items: any[] } | null = null

      for (const cluster of clusters) {
        const dist = euclidean(vector, cluster.center)

        if (dist < threshold) {
          foundCluster = cluster
          break
        }
      }

      if (foundCluster) {
        foundCluster.items.push(emb)
      } else {
        clusters.push({
          center: vector,
          items: [emb],
        })
      }
    }

    for (let i = 0; i < clusters.length; i += 1) {
      const cluster = clusters[i]
      const coverPhotoId = cluster.items[0]?.photo_id ?? null

      const { data: newCluster, error: insertError } = await supabaseAdmin
        .from('face_clusters')
        .insert({
          owner_id: user.id,
          album_id: albumId,
          label: `Person ${i + 1}`,
          cover_photo_id: coverPhotoId,
          face_count: cluster.items.length,
        })
        .select('id')
        .single()

      if (insertError || !newCluster) {
        return NextResponse.json(
          { error: insertError?.message || 'Create cluster failed' },
          { status: 500 }
        )
      }

      const ids = cluster.items.map((item) => item.id)

      const { error: updateError } = await supabaseAdmin
        .from('face_embeddings')
        .update({ cluster_id: newCluster.id })
        .in('id', ids)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      clusters: clusters.length,
      faces: embeddings.length,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Cluster failed',
      },
      { status: 500 }
    )
  }
}