import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('photo_jobs')
      .select('status')
      .eq('owner_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const jobs = data ?? []

    const stats = {
      total: jobs.length,
      pending: jobs.filter((job) => job.status === 'pending').length,
      processing: jobs.filter((job) => job.status === 'processing').length,
      done: jobs.filter((job) => job.status === 'done').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load stats',
      },
      { status: 500 }
    )
  }
}