'use client'

type Props = {
  size?: number
  className?: string
}

/* =========================
   GRID 2
========================= */
export function Grid2Icon({ size = 16, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

/* =========================
   GRID 3
========================= */
export function Grid3Icon({ size = 16, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
    >
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={3 + col * 7}
            y={3 + row * 7}
            width="4"
            height="4"
          />
        ))
      )}
    </svg>
  )
}

/* =========================
   GRID 4 (dense)
========================= */
export function Grid4Icon({ size = 16, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
    >
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={3 + col * 5}
            y={3 + row * 5}
            width="2"
            height="2"
          />
        ))
      )}
    </svg>
  )
}