'use client'

import { useSearchParams } from 'next/navigation'
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
  totalBytes?: number
}

export default function UpgradePlanList({
  plans,
  currentSubscription,
  totalBytes = 0,
}: Props) {
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

  const mostPopularPlanId = useMemo(() => {
    return (
      plans.find(
        (plan) => Number(plan.storage_limit_bytes) === 50 * 1024 * 1024 * 1024
      )?.id ||
      plans.find((plan) => plan.name.toLowerCase().includes('50'))?.id ||
      plans[Math.floor(plans.length / 2)]?.id
    )
  }, [plans])

  async function handleCheckout(planId: string) {
    try {
      setLoadingPlanId(planId)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Checkout failed')
      }

      if (!data?.url) {
        throw new Error('Missing checkout URL')
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
      {isSuccess ? (
        <div className="rounded-3xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200">
          Payment successful.
        </div>
      ) : null}

      {isCanceled ? (
        <div className="rounded-3xl bg-yellow-50 p-4 text-sm text-yellow-700 ring-1 ring-yellow-200">
          Payment was canceled.
        </div>
      ) : null}

      {plans.map((plan) => {
        const isCurrent = currentSubscription?.plan_id === plan.id
        const isPopular = plan.id === mostPopularPlanId

        const isDowngrade = Boolean(
          currentSubscription?.storage_limit_bytes &&
            plan.storage_limit_bytes < currentSubscription.storage_limit_bytes
        )

        const cannotDowngrade =
          isDowngrade && totalBytes > plan.storage_limit_bytes

        return (
          <div
            key={plan.id}
            className={`relative rounded-3xl bg-white p-5 shadow-sm ring-1 ${
              isCurrent
                ? 'ring-blue-500'
                : isPopular
                ? 'ring-blue-200'
                : 'ring-black/5'
            }`}
          >
            {isPopular && !isCurrent ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                  ⭐ Most Popular
                </span>
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {plan.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Storage up to {formatStorage(Number(plan.storage_limit_bytes || 0))}
                </p>

                {isPopular ? (
                  <p className="mt-1 text-xs font-medium text-blue-600">
                    Best value for photographers
                  </p>
                ) : null}
              </div>

              {isCurrent ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  Current
                </span>
              ) : null}
            </div>

            {cannotDowngrade ? (
              <p className="mt-3 text-xs text-red-500">
                ⚠️ You are using more storage than this plan allows.
              </p>
            ) : null}

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
                disabled={isCurrent || loadingPlanId === plan.id || cannotDowngrade}
                className={`rounded-2xl px-4 py-3 text-white disabled:opacity-50 ${
                  isPopular ? 'bg-blue-600' : 'bg-slate-900'
                }`}
              >
                {isCurrent
                  ? 'Current'
                  : cannotDowngrade
                  ? 'Storage too large'
                  : loadingPlanId === plan.id
                  ? 'Processing...'
                  : plan.price_thb === 0
                  ? 'Use Free'
                  : isPopular
                  ? 'Upgrade Now 🚀'
                  : 'Upgrade'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}