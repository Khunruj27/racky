import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function getUserStorage(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('photos')
    .select('file_size_bytes')
    .eq('owner_id', userId)

  const totalBytes =
    data?.reduce((sum, row) => sum + Number(row.file_size_bytes || 0), 0) || 0

  return totalBytes
}