export function ShellBackdrop() {
  return (
    <div className="scanlines fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(126,255,210,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(126,255,210,0.045) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 92%)',
        }}
      />
      {/* Mint glow — top left */}
      <div
        className="absolute -top-24 -left-16 w-[26rem] h-[26rem] rounded-full opacity-[0.18]"
        style={{
          background: 'rgba(36,255,156,1)',
          filter: 'blur(100px)',
        }}
      />
      {/* Cyan glow — top right */}
      <div
        className="absolute top-32 -right-36 w-[28rem] h-[28rem] rounded-full opacity-[0.14]"
        style={{
          background: 'rgba(86,175,255,1)',
          filter: 'blur(110px)',
        }}
      />
    </div>
  )
}
