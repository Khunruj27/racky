import { NextRequest, NextResponse } from 'next/server'
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
    auth: {
      persistSession: false,
    },
  })
}

function isAuthorizedWorker(req: NextRequest) {
  const workerSecret = process.env.WORKER_SECRET

  if (!workerSecret) return true

  const header = req.headers.get('x-worker-secret')
  const query = req.nextUrl.searchParams.get('secret')

  return header === workerSecret || query === workerSecret
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedWorker(req)) {
      return NextResponse.json({ error: 'Unauthorized cleanup' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // 1) processing ค้างเกิน 30 นาที → failed
    const { data: stuckJobs, error: stuckError } = await supabase
      .from('photo_jobs')
      .update({
        status: 'failed',
        error: 'Cleanup: processing timeout',
        finished_at: new Date().toISOString(),
      })
      .eq('status', 'processing')
      .lt('started_at', hoursAgo(0.5))
      .select('id, photo_id')

    if (stuckError) {
      return NextResponse.json({ error: stuckError.message }, { status: 500 })
    }

    const stuckPhotoIds = (stuckJobs ?? []).map((job) => job.photo_id)

    if (stuckPhotoIds.length > 0) {
      await supabase
        .from('photos')
        .update({
          processing_status: 'failed',
          processing_progress: 0,
        })
        .in('id', stuckPhotoIds)
    }

    // 2) ลบ job done เก่ากว่า 24 ชั่วโมง
    const { data: deletedDone, error: doneError } = await supabase
      .from('photo_jobs')
      .delete()
      .eq('status', 'done')
      .lt('finished_at', hoursAgo(24))
      .select('id')

    if (doneError) {
      return NextResponse.json({ error: doneError.message }, { status: 500 })
    }

    // 3) ลบ job failed เก่ากว่า 72 ชั่วโมง
    const { data: deletedFailed, error: failedError } = await supabase
      .from('photo_jobs')
      .delete()
      .eq('status', 'failed')
      .lt('finished_at', hoursAgo(72))
      .select('id')

    if (failedError) {
      return NextResponse.json({ error: failedError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stuckMarkedFailed: stuckJobs?.length ?? 0,
      deletedDoneJobs: deletedDone?.length ?? 0,
      deletedFailedJobs: deletedFailed?.length ?? 0,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cleanup failed',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}