'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-5">
      <p className="text-[0.58rem] uppercase tracking-[0.18em] text-text-3 font-medium">
        Dashboard Error
      </p>
      <h2 className="text-[1rem] font-semibold text-text-0">
        This panel failed to load
      </h2>
      <p className="text-[0.72rem] text-text-2 leading-relaxed max-w-[320px]">
        {error.message || 'An unexpected error occurred in this view.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 rounded-lg text-[0.74rem] font-semibold border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-[#7effd2] hover:bg-[rgba(126,255,210,0.16)] transition-all duration-150"
      >
        Retry
      </button>
    </div>
  )
}
