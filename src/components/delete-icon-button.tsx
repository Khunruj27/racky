'use client'

type Props = {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

export default function DeleteIconButton({
  onClick,
  disabled,
  loading,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick?.()
        }
      }}
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 transition active:scale-95 ${
        disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
      }`}
    >
      {loading ? (
        <span className="text-red-500 text-sm">…</span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-red-500"
          fill="currentColor"
        >
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" />
        </svg>
      )}
    </div>
  )
}