'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { formatStorage } from '@/lib/format-storage'

type Plan = {
  id: string
  name: string
  price_thb: number
  storage_limit_bytes: number
  sort_order: number
}

type CurrentSubscription = {
  plan_id: string | null
  storage_limit_bytes?: number
}

type Props = {
  plans: Plan[]
  currentSubscription: CurrentSubscription | null
  totalBytes?: number // 🔥 ส่ง usage มาจาก server
}

export default function UpgradePlanList({
  plans,
  currentSubscription,
  totalBytes = 0,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const isSuccess = useMemo(
    () => searchParams.get('success') === '1',
    [searchParams]
  )

  const isCanceled = useMemo(
    () => searchParams.get('canceled') === '1',
    [searchParams]
  )

  // 🔥 Stripe checkout
  async function handleCheckout(planId: string) {
    try {
      setLoadingPlanId(planId)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Checkout failed')
      }

      window.location.href = data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Checkout error')
    } finally {
      setLoadingPlanId(null)
    }
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          📦
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          No plans found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Please add plans in the database first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isSuccess && (
        <div className="rounded-3xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200">
          Payment successful.
        </div>
      )}

      {isCanceled && (
        <div className="rounded-3xl bg-yellow-50 p-4 text-sm text-yellow-700 ring-1 ring-yellow-200">
          Payment was canceled.
        </div>
      )}

      {plans.map((plan) => {
        const isCurrent = currentSubscription?.plan_id === plan.id

        // 🔥 เช็ค downgrade
        const isDowngrade =
          currentSubscription?.storage_limit_bytes &&
          plan.storage_limit_bytes < currentSubscription.storage_limit_bytes

        const cannotDowngrade =
          isDowngrade && totalBytes > plan.storage_limit_bytes

        return (
          <div
            key={plan.id}
            className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ${
              isCurrent ? 'ring-blue-500' : 'ring-black/5'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {plan.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Storage up to {formatStorage(plan.storage_limit_bytes)}
                </p>
              </div>

              {isCurrent && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  Current
                </span>
              )}
            </div>

            {/* 🔥 warning downgrade */}
            {cannotDowngrade && (
              <p className="mt-3 text-xs text-red-500">
                ⚠️ You are using more storage than this plan allows.
              </p>
            )}

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {plan.price_thb === 0 ? 'Free' : `฿${plan.price_thb}`}
                </p>

                <p className="text-sm text-slate-500">
                  {plan.price_thb === 0 ? 'Starter plan' : 'per month'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCheckout(plan.id)}
                disabled={
                  isCurrent ||
                  loadingPlanId === plan.id ||
                  cannotDowngrade
                }
                className="rounded-2xl bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
              >
                {isCurrent
                  ? 'Current'
                  : cannotDowngrade
                  ? 'Storage too large'
                  : loadingPlanId === plan.id
                  ? 'Processing...'
                  : plan.price_thb === 0
                  ? 'Use Free'
                  : 'Pay Now'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}