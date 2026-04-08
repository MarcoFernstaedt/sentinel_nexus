export function ShellBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(rgba(126,255,210,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(126,255,210,0.025) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 48%, transparent 92%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-40" />
      <div
        className="absolute left-[14%] top-[-18rem] h-[34rem] w-[34rem] rounded-full opacity-[0.16]"
        style={{ background: 'rgba(36,255,156,1)', filter: 'blur(130px)' }}
      />
      <div
        className="absolute right-[-12rem] top-[3rem] h-[32rem] w-[32rem] rounded-full opacity-[0.12]"
        style={{ background: 'rgba(86,175,255,1)', filter: 'blur(135px)' }}
      />
      <div
        className="absolute bottom-[-18rem] left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full opacity-[0.08]"
        style={{ background: 'rgba(126,247,205,1)', filter: 'blur(140px)' }}
      />
    </div>
  )
}
