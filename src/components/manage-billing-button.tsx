'use client'

export default function ManageBillingButton() {
  async function handleClick() {
    const res = await fetch('/api/stripe/billing-portal', {
      method: 'POST',
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Billing not available')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="
        rounded-full 
        border border-slate-300
        px-4 py-2 
        text-sm font-semibold text-slate-700
        bg-white
        hover:bg-slate-50
        transition
      "
    >
      Manage Billing
    </button>
  )
}