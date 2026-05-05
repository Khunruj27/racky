import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/logout-button'
import { formatBytes, clampPercent } from '@/lib/format-bytes'
import ManageBillingButton from '@/components/manage-billing-button'
import DeleteAlbumButton from '@/components/delete-album-button'
import CreateAlbumModal from '@/components/create-album-modal'
import ProfileAvatarSettings from '@/components/profile-avatar-settings'
import AppIcon from '@/components/app-icon'
import IconButton from '@/components/icon-button'
import AppBottomBar from '@/components/app-bottom-bar'
import Image from "next/image";


export default async function AlbumsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ----------------------------
  // DATA
  // ----------------------------
  const { data: albumsData } = await supabase
    .from('albums')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const albums = albumsData ?? []

  const { data: storageRowsData } = await supabase
    .from('photos')
    .select('file_size_bytes')
    .eq('owner_id', user.id)

  const storageRows = storageRowsData ?? []

  const { data: currentSubscription } = await supabase
    .from('subscriptions')
    .select(`
      id,
      stripe_customer_id,
      plan:plans(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  const currentPlan = Array.isArray(currentSubscription?.plan)
    ? currentSubscription?.plan[0]
    : currentSubscription?.plan

  const totalBytes = storageRows.reduce(
    (sum, row) => sum + Number(row.file_size_bytes || 0),
    0
  )

  const storageLimitBytes = Number(
    currentPlan?.storage_limit_bytes || 5 * 1024 * 1024 * 1024
  )

  const usagePercent = clampPercent(
    storageLimitBytes > 0 ? (totalBytes / storageLimitBytes) * 100 : 0
  )

  // ----------------------------
  // COUNT PHOTOS
  // ----------------------------
  const albumIds = albums.map((a) => a.id)

  const { data: photoRowsData } =
    albumIds.length > 0
      ? await supabase
          .from('photos')
          .select('album_id')
          .in('album_id', albumIds)
      : { data: [] }

  const photoRows = photoRowsData ?? []

  const photoCountMap = photoRows.reduce<Record<string, number>>(
    (acc, row) => {
      const id = String(row.album_id)
      acc[id] = (acc[id] || 0) + 1
      return acc
    },
    {}
  )

  const currentPlanName = currentPlan?.name || 'Free Plan 5GB'
  const hasBillingPortal = Boolean(currentSubscription?.stripe_customer_id)

  const barColor =
    usagePercent >= 90
      ? 'bg-red-500'
      : usagePercent >= 70
      ? 'bg-yellow-500'
      : 'bg-[#2F6BFF]'

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main className="min-h-screen bg-[#F8F9FC] pb-28">
      {/* HEADER */}
      <section className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">

  {/* LEFT */}

  <div className="flex items-center gap-2">

    <Image
      src="/logo-mininum.svg"
      alt="Ciiya Logo"
      width={0}
      height={0}
      className="h-12 w-auto"
    />
</div>

          <div className="flex items-center gap-2">
            <IconButton icon="setting" variant="ghost" />
         <ProfileAvatarSettings
         email={user.email}
         initialAvatarUrl={user.user_metadata?.avatar_url || null}
  />

  <LogoutButton />
</div>
        </div>
      </section>

      <section className="px-5 py-5">
        <div className="mx-auto max-w-md space-y-5">
          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-3 auto-rows-[110px] px-5">
         <CreateAlbumModal />

        <Link
        href="/pricing"
        className="flex h-full flex-col items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
  >
        <AppIcon name="hard-drive" size={26} className="opacity-80" />
        <p className="text-sm font-semibold">Upgrade Plan</p>
      </Link>

        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
        <AppIcon name="transfer-data" size={26} className="opacity-80" />
        <p className="text-sm font-semibold">Transfer Files</p>
       </div>
       </div>

          {/* STORAGE */}
          <div className="rounded-[30px] bg-white p-5 shadow">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">Storage Usage</h2>
                <p className="text-sm text-slate-500">{currentPlanName}</p>
              </div>
            
              

              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                {Math.round(usagePercent)}%
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
             className={`${barColor} h-full rounded-full transition-all duration-500 ease-out`}
           style={{ width: `${usagePercent}%` }}
          />
        </div>

            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{formatBytes(totalBytes)}</span>
              <span>{formatBytes(storageLimitBytes)}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href="/pricing"
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm"
              >
                  Upgrade
              </Link>
             <ManageBillingButton />
             </div>
          </div>

          {/* ALBUM LIST */}
          {albums.length > 0 ? (
            <div className="px-5 mt-6 space-y-3">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="relative bg-white p-2 rounded-2xl shadow"
                >
                  <DeleteAlbumButton albumId={album.id} />

                  <Link
                    href={`/albums/${album.id}`}
                    className="flex gap-4"
                  >
                    {/* COVER */}
                    <div className="relative w-24 h-18 rounded-xl overflow-hidden bg-slate-100">
                      {album.cover_url ? (
                        <img
                      src={album.cover_url}
                      loading="lazy"
                      decoding="async"
                      alt={album.title || 'Album cover'}
                     className="h-full w-full object-cover transition-opacity duration-300"
                  />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-400">
                          No Cover
                        </div>
                      )}

                      <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {photoCountMap[album.id] || 0}
                      </span>
                    </div>

                    {/* INFO */}
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                      {album.title}
                      </p>

                     <span className="inline-block w-fit rounded-full bg-blue-100 px-3 py-0.5 text-[12px] font-medium text-blue-600">
                        Owner
                      </span>

                      <p className="text-[13px] text-slate-400 leading-tight">
                        {album.description || 'No description'}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
            <AppIcon name="gallery" size={48} className="opacity-40 mb-3" />

            <p className="text-lg font-semibold text-slate-700">
    No albums yet
  </p>

            <p className="text-sm text-slate-400 mt-1">
    Create your first album to start
  </p>
          </div>
          )}
        </div>
      </section>
    
     {/* APP BOTTOM BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 backdrop-blur-xl">
  <div className="mx-auto grid max-w-[430px] grid-cols-5 text-[11px] text-slate-800">

    {/* ITEM */}
    <Link href="/albums" className="flex flex-col items-center justify-center gap-1 text-[#2F6BFF]">
      <AppIcon name="album" size={24} className="opacity-90" />
      <p className="leading-none">Albums</p>
    </Link>

    <button className="flex flex-col items-center justify-center gap-1 opacity-90">
      <AppIcon name="layer" size={24} className="opacity-80" />
      <p className="leading-none">Microsites</p>
    </button>

    <button className="flex flex-col items-center justify-center gap-1 opacity-90">
      <AppIcon name="magic-wand" size={24} className="opacity-80" />
      <p className="leading-none">AI Retouch</p>
    </button>

    <button className="flex flex-col items-center justify-center gap-1 opacity-90">
      <AppIcon name="bell-notification-social-media" size={22} className="opacity-80" />
      <p className="leading-none">Notifications</p>
    </button>

    <button className="flex flex-col items-center justify-center gap-1 opacity-90">
      <AppIcon name="user-1" size={24} className="opacity-80" />
      <p className="leading-none">Me</p>
    </button>

  </div>
</nav>
    </main>
  )
}