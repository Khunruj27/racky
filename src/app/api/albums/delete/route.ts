import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'albums'
const LIST_LIMIT = 1000
const REMOVE_CHUNK_SIZE = 100

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase admin env')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

function uniquePaths(paths: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      paths
        .filter(Boolean)
        .map((path) => String(path).trim())
        .filter(Boolean)
    )
  )
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

async function listAllStoragePaths(
  supabase: ReturnType<typeof createClient>,
  prefix: string
) {
  const allPaths: string[] = []
  let offset = 0

  while (true) {
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, {
        limit: LIST_LIMIT,
        offset,
        sortBy: {
          column: 'name',
          order: 'asc',
        },
      })

    if (error) throw new Error(error.message)
    if (!files || files.length === 0) break

    allPaths.push(
      ...files
        .filter((file) => file.name)
        .map((file) => `${prefix}/${file.name}`)
    )

    if (files.length < LIST_LIMIT) break

    offset += LIST_LIMIT
  }

  return allPaths
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
      return NextResponse.json(
        { error: 'albumId is required' },
        { status: 400 }
      )
    }

    // เช็ก ownership ด้วย user session ก่อน
    const { data: album, error: albumCheckError } = await supabase
      .from('albums')
      .select('id, owner_id')
      .eq('id', albumId)
      .eq('owner_id', user.id)
      .single()

    if (albumCheckError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // ดึง path รูปทั้งหมด
    const { data: photosData, error: photoError } = await supabase
      .from('photos')
      .select(
        `
        id,
        storage_path,
        original_path,
        preview_path,
        thumbnail_path
      `
      )
      .eq('album_id', albumId)
      .eq('owner_id', user.id)

    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 500 })
    }

    const photos = photosData ?? []
    const photoIds = photos.map((photo) => photo.id)

    const dbPaths = uniquePaths(
      photos.flatMap((photo) => [
        photo.storage_path,
        photo.original_path,
        photo.preview_path,
        photo.thumbnail_path,
      ])
    )

    // list storage ทั้ง folder เผื่อมีไฟล์ตกค้างที่ DB ไม่ได้เก็บ path
    const folderPrefixes = [
      `${user.id}/${albumId}/cover`,
      `${user.id}/${albumId}/photos`,
      `${user.id}/${albumId}/original`,
      `${user.id}/${albumId}/preview`,
      `${user.id}/${albumId}/thumbnail`,
      `${user.id}/${albumId}/presets`,
    ]

    const storagePaths: string[] = []

    for (const prefix of folderPrefixes) {
      const paths = await listAllStoragePaths(supabaseAdmin, prefix)
      storagePaths.push(...paths)
    }

    const pathsToRemove = uniquePaths([...dbPaths, ...storagePaths])

    let deletedStorageFiles = 0

    for (const chunk of chunkArray(pathsToRemove, REMOVE_CHUNK_SIZE)) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove(chunk)

      if (storageError) {
        return NextResponse.json(
          { error: storageError.message },
          { status: 500 }
        )
      }

      deletedStorageFiles += chunk.length
    }

    // สำคัญ: ลบ photo_jobs ด้วย service_role
    const { error: deleteJobsByAlbumError } = await supabaseAdmin
      .from('photo_jobs')
      .delete()
      .eq('album_id', albumId)
      .eq('owner_id', user.id)

    if (deleteJobsByAlbumError) {
      return NextResponse.json(
        { error: deleteJobsByAlbumError.message },
        { status: 500 }
      )
    }

    // กันพลาด: ลบซ้ำด้วย photo_id ถ้ามี job บาง row album_id ไม่ตรง
    if (photoIds.length > 0) {
      const { error: deleteJobsByPhotoError } = await supabaseAdmin
        .from('photo_jobs')
        .delete()
        .in('photo_id', photoIds)

      if (deleteJobsByPhotoError) {
        return NextResponse.json(
          { error: deleteJobsByPhotoError.message },
          { status: 500 }
        )
      }
    }

    const { error: deletePhotosError } = await supabaseAdmin
      .from('photos')
      .delete()
      .eq('album_id', albumId)
      .eq('owner_id', user.id)

    if (deletePhotosError) {
      return NextResponse.json(
        { error: deletePhotosError.message },
        { status: 500 }
      )
    }

    const { error: albumError } = await supabaseAdmin
      .from('albums')
      .delete()
      .eq('id', albumId)
      .eq('owner_id', user.id)

    if (albumError) {
      return NextResponse.json({ error: albumError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deletedStorageFiles,
      deletedPhotoRows: photos.length,
      deletedAlbumId: albumId,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    )
  }
}