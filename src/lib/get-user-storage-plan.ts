import { createServerSupabaseClient } from '@/lib/supabase-server'

export const DEFAULT_FREE_STORAGE_BYTES = 5 * 1024 * 1024 * 1024

export async function getUserStoragePlan(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: currentSubscription } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      plan:plans(
        id,
        name,
        storage_limit_bytes
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscribedPlan = Array.isArray(currentSubscription?.plan)
    ? currentSubscription.plan[0]
    : currentSubscription?.plan

  if (subscribedPlan?.storage_limit_bytes) {
    return {
      planName: subscribedPlan.name || 'Current Plan',
      storageLimitBytes: Number(subscribedPlan.storage_limit_bytes),
    }
  }

  const { data: freePlan } = await supabase
    .from('plans')
    .select('name, storage_limit_bytes')
    .ilike('name', 'Free%')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  return {
    planName: freePlan?.name || 'Free 5GB',
    storageLimitBytes: Number(
      freePlan?.storage_limit_bytes || DEFAULT_FREE_STORAGE_BYTES
    ),
  }
}