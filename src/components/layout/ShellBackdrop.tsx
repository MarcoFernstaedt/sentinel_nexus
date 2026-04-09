export function ShellBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      {/* Grid pattern — subtle tactical grid */}
      <div
        className="absolute inset-0 opacity-75"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,179,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,179,0.028) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.48) 50%, transparent 94%)',
        }}
      />
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-50" />
      {/* Central top spotlight — electric mint glow */}
      <div
        className="absolute inset-x-0 top-0 h-[28rem]"
        style={{ background: 'radial-gradient(ellipse at 50% -5%, rgba(0,255,179,0.065), transparent 48%)' }}
      />
      {/* Top-left mint orb */}
      <div
        className="absolute left-[12%] top-[-20rem] h-[40rem] w-[40rem] rounded-full opacity-[0.22]"
        style={{ background: 'rgba(0, 255, 179, 1)', filter: 'blur(140px)' }}
      />
      {/* Top-right cyan orb */}
      <div
        className="absolute right-[-10rem] top-[2rem] h-[36rem] w-[36rem] rounded-full opacity-[0.18]"
        style={{ background: 'rgba(0, 212, 255, 1)', filter: 'blur(140px)' }}
      />
      {/* Bottom-center mint orb */}
      <div
        className="absolute bottom-[-20rem] left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full opacity-[0.09]"
        style={{ background: 'rgba(0, 255, 179, 1)', filter: 'blur(150px)' }}
      />
      {/* Bottom-right violet orb — new depth accent */}
      <div
        className="absolute right-[-8rem] bottom-[-6rem] h-[30rem] w-[30rem] rounded-full opacity-[0.14]"
        style={{ background: 'rgba(100, 80, 255, 1)', filter: 'blur(140px)' }}
      />
    </div>
  )
}
