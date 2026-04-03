/**
 * Sentinel Nexus Sound Engine
 * Synthesizes UI sounds via Web Audio API — no external files required.
 * Safe to import anywhere; getSoundEngine() returns null on the server.
 */

export type SoundEvent =
  | 'startup'        // layered chime on app mount
  | 'nav'            // navigation click
  | 'sidebar-toggle' // collapse/expand sidebar
  | 'approve'        // task approved
  | 'reject'         // task rejected
  | 'notification'   // alert surfaced
  | 'action-click'   // generic button tap
  | 'task-complete'  // task marked done

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private _enabled = true

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this._enabled ? 0.6 : 0
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {/* ignore */})
    }
    return this.ctx
  }

  private out(): GainNode {
    this.getCtx()
    return this.master!
  }

  setEnabled(enabled: boolean) {
    this._enabled = enabled
    if (this.master) {
      this.master.gain.setTargetAtTime(enabled ? 0.6 : 0, this.getCtx().currentTime, 0.05)
    }
  }

  get enabled() { return this._enabled }

  play(event: SoundEvent) {
    if (!this._enabled) return
    try {
      switch (event) {
        case 'startup':        return this._startup()
        case 'nav':            return this._nav()
        case 'sidebar-toggle': return this._sidebarToggle()
        case 'approve':        return this._approve()
        case 'reject':         return this._reject()
        case 'notification':   return this._notification()
        case 'action-click':   return this._actionClick()
        case 'task-complete':  return this._taskComplete()
      }
    } catch {
      // Never throw — audio is non-critical
    }
  }

  // ── Individual synthesizers ──────────────────────────────────

  private _startup() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime + 0.05

    // C4 = 261.6Hz, E4 = 329.6Hz, G4 = 392Hz — staggered onset
    const notes = [261.6, 329.6, 392]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.22, t + i * 0.08 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.75)
      osc.connect(gain)
      gain.connect(out)
      osc.start(t + i * 0.08)
      osc.stop(t + i * 0.08 + 0.8)
    })
  }

  private _nav() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.08)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.08, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(gain)
    gain.connect(out)
    osc.start(t)
    osc.stop(t + 0.09)
  }

  private _sidebarToggle() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 600
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.10, t + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065)
    osc.connect(gain)
    gain.connect(out)
    osc.start(t)
    osc.stop(t + 0.07)
  }

  private _approve() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    // C5 then G5 — ascending confirm
    const notes: Array<[number, number]> = [[523.2, 0], [784, 0.14]]
    notes.forEach(([freq, offset]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t + offset)
      gain.gain.linearRampToValueAtTime(0.20, t + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.28)
      osc.connect(gain)
      gain.connect(out)
      osc.start(t + offset)
      osc.stop(t + offset + 0.30)
    })
  }

  private _reject() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.14, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20)
    osc.connect(gain)
    gain.connect(out)
    osc.start(t)
    osc.stop(t + 0.22)
  }

  private _notification() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1200
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.16, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.40)
    osc.connect(gain)
    gain.connect(out)
    osc.start(t)
    osc.stop(t + 0.42)
  }

  private _actionClick() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    // Very subtle filtered noise burst
    const bufferSize = ctx.sampleRate * 0.05
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1)

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1800
    filter.Q.value = 0.8

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.055, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(out)
    source.start(t)
    source.stop(t + 0.06)
  }

  private _taskComplete() {
    const ctx = this.getCtx()
    const out = this.out()
    const t = ctx.currentTime

    // C5-E5-G5 major chord, simultaneous
    const chord: number[] = [523.2, 659.3, 784]
    chord.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15, t + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.50)
      osc.connect(gain)
      gain.connect(out)
      osc.start(t)
      osc.stop(t + 0.52)
    })
  }
}

// ── Singleton ─────────────────────────────────────────────────
let _engine: SoundEngine | null = null

export function getSoundEngine(): SoundEngine | null {
  if (typeof window === 'undefined') return null
  if (!_engine) _engine = new SoundEngine()
  return _engine
}
