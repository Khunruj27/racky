import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const workerSecret = process.env.WORKER_SECRET

    const res = await fetch(
      `${req.nextUrl.origin}/api/worker/process-photos?limit=10`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: workerSecret
          ? {
              'x-worker-secret': workerSecret,
            }
          : {},
      }
    )

    const data = await res.json().catch(() => null)

    return NextResponse.json({
      success: res.ok,
      worker: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Auto worker failed',
      },
      { status: 500 }
    )
  }
}