'use client'
import AppIcon from '@/components/app-icon'

type Props = {
  onClick: () => void
}

export default function FaceSearchButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#2F6BFF] px-5 py-3 text-sm font-bold text-white shadow-xl"
    >
     <AppIcon name="authentication" size={20} className="opacity-100" /> ค้นหาใบหน้า
    </button>
  )
}