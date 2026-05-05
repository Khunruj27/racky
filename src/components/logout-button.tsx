'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    setLoading(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}