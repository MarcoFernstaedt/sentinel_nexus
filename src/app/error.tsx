'use client'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d12] px-5">
      <div className="flex flex-col items-center gap-4 text-center max-w-[380px]">
        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-text-3 font-medium">
          Sentinel Nexus
        </p>
        <h1 className="text-[1.1rem] font-semibold text-text-0">
          Something went wrong
        </h1>
        <p className="text-[0.74rem] text-text-2 leading-relaxed">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 px-4 py-2 rounded-lg text-[0.74rem] font-semibold border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-[#7effd2] hover:bg-[rgba(126,255,210,0.16)] transition-all duration-150"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
