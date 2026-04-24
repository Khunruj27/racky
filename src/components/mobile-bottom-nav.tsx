'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    href: '/albums',
    label: 'Albums',
    icon: '🖼️',
  },
  {
    href: '/pricing',
    label: 'Plan',
    icon: '💎',
  },
  {
    href: '/albums',
    label: 'Upload',
    icon: '+',
    center: true,
  },
  {
    href: '/pricing',
    label: 'Billing',
    icon: '💳',
  },
  {
    href: '/profile',
    label: 'Me',
    icon: '👤',
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/albums') return pathname.startsWith('/albums')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-md rounded-[28px] border border-black/5 bg-white/90 px-3 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="grid grid-cols-5 items-end gap-1">
          {items.map((item) => {
            const active = isActive(item.href)

            if (item.center) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex -translate-y-5 flex-col items-center justify-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3B5BFF] text-3xl font-light text-white shadow-[0_14px_30px_rgba(59,91,255,0.35)] ring-4 ring-[#FBFAF8]">
                    {item.icon}
                  </div>
                  <span className="mt-1 text-[11px] font-semibold text-[#3B5BFF]">
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center rounded-2xl px-2 py-2"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl text-lg transition ${
                    active
                      ? 'bg-[#EEF2FF] text-[#3B5BFF]'
                      : 'text-slate-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`mt-1 text-[11px] font-semibold ${
                    active ? 'text-[#3B5BFF]' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}