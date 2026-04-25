import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserStoragePlan } from '@/lib/get-user-storage-plan'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const uploadSizeBytes = Number(body.uploadSizeBytes || 0)

    if (uploadSizeBytes <= 0) {
      return NextResponse.json(
        { error: 'uploadSizeBytes is required' },
        { status: 400 }
      )
    }

    const { data: storageRows = [] } = await supabase
      .from('photos')
      .select('file_size_bytes')
      .eq('owner_id', user.id)

    const usedBytes = storageRows.reduce(
      (sum, row) => sum + Number(row.file_size_bytes || 0),
      0
    )

    const { planName, storageLimitBytes } = await getUserStoragePlan(user.id)

    const willUseBytes = usedBytes + uploadSizeBytes
    const usagePercent = storageLimitBytes
      ? Math.round((willUseBytes / storageLimitBytes) * 100)
      : 0

    if (willUseBytes > storageLimitBytes) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          warning: true,
          error: 'Storage full. Please upgrade your plan.',
          planName,
          usedBytes,
          uploadSizeBytes,
          willUseBytes,
          limitBytes: storageLimitBytes,
          usagePercent,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      blocked: false,
      warning: usagePercent >= 80,
      planName,
      usedBytes,
      uploadSizeBytes,
      willUseBytes,
      limitBytes: storageLimitBytes,
      usagePercent,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Storage check failed',
      },
      { status: 500 }
    )
  }
}