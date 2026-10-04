/**
 * Procedural audio engine built exclusively on the native Web Audio API.
 * No audio assets are loaded: ticks, chimes and soundscapes are all synthesized.
 */

export type TickPreset = "grandfather" | "pocket" | "soft";
export type ChimePreset = "bowl" | "shinkansen" | "bell";
export type AmbientKind = "brown" | "pink" | "rain";

export interface EngineLevels {
  muted: boolean;
  masterVolume: number;
  tickVolume: number;
  chimeVolume: number;
}

interface AmbientVoice {
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  timer: number | null;
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Perceptual volume taper: slider 0..1 -> linear gain. */
const taper = (v: number): number => Math.min(1, Math.max(0, v)) ** 2;

/** Per-soundscape ceiling so the three beds feel equally loud at the same slider position. */
const AMBIENT_CEILING: Record<AmbientKind, number> = { brown: 0.75, pink: 0.8, rain: 0.9 };

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tickBus: GainNode | null = null;
  private chimeBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private whiteBuffer: AudioBuffer | null = null;
  private pinkBuffer: AudioBuffer | null = null;

  private levels: EngineLevels = { muted: false, masterVolume: 0.8, tickVolume: 0.5, chimeVolume: 0.7 };
  private ambientVolumes: Record<AmbientKind, number> = { brown: 0.5, pink: 0.5, rain: 0.5 };
  private ambient: Record<AmbientKind, AmbientVoice | null> = { brown: null, pink: null, rain: null };
  private tickToggle = false;

  /** Creates (if needed) and resumes the AudioContext. Call from a user gesture. */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  }

  configure(levels: Partial<EngineLevels>): void {
    this.levels = { ...this.levels, ...levels };
    this.applyLevels();
  }

  setAmbientVolume(kind: AmbientKind, volume: number): void {
    this.ambientVolumes[kind] = Math.min(1, Math.max(0, volume));
    const voice = this.ambient[kind];
    if (voice && this.ctx) {
      voice.gain.gain.setTargetAtTime(this.ambientTarget(kind), this.ctx.currentTime, 0.1);
    }
  }

  isAmbientRunning(kind: AmbientKind): boolean {
    return this.ambient[kind] !== null;
  }

  // ---------------------------------------------------------------- ticks

  tick(preset: TickPreset): void {
    const ctx = this.ready();
    if (!ctx || !this.tickBus) return;
    const t = ctx.currentTime + 0.005;
    if (preset === "grandfather") this.tickGrandfather(ctx, t);
    else if (preset === "pocket") this.tickPocketWatch(ctx, t);
    else this.tickSoft(ctx, t);
  }

  private tickGrandfather(ctx: AudioContext, t: number): void {
    // Alternate "tick" (112 Hz) and "tock" (82 Hz) for a pendulum feel.
    const freq = this.tickToggle ? 82 : 112;
    this.tickToggle = !this.tickToggle;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.2);

    const body = ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(freq * 2, t);

    const resonance = ctx.createBiquadFilter();
    resonance.type = "lowpass";
    resonance.frequency.value = 340;
    resonance.Q.value = 7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    osc.connect(resonance);
    body.connect(resonance);
    resonance.connect(gain).connect(this.tickBus!);
    osc.start(t);
    body.start(t);
    osc.stop(t + 0.28);
    body.stop(t + 0.28);
  }

  private tickPocketWatch(ctx: AudioContext, t: number): void {
    // Balance-wheel escapement: two high-passed impulses 40 ms apart.
    this.click(ctx, t, 2500, 0.55);
    this.click(ctx, t + 0.04, 3200, 0.45);
  }

  private click(ctx: AudioContext, t: number, highpassHz: number, peak: number): void {
    const white = this.getWhite(ctx);
    const src = ctx.createBufferSource();
    src.buffer = white;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highpassHz;
    hp.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.0007);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);

    src.connect(hp).connect(gain).connect(this.tickBus!);
    src.start(t, Math.random() * (white.duration - 0.05), 0.03);
  }

  private tickSoft(ctx: AudioContext, t: number): void {
    // Subdued micro-click: 800 Hz, 15 ms.
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    osc.connect(gain).connect(this.tickBus!);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  // --------------------------------------------------------------- chimes

  chime(preset: ChimePreset): void {
    const ctx = this.ready();
    if (!ctx || !this.chimeBus) return;
    const t = ctx.currentTime + 0.02;
    if (preset === "bowl") this.chimeBowl(ctx, t);
    else if (preset === "shinkansen") this.chimeShinkansen(ctx, t);
    else this.chimeBell(ctx, t);
  }

  private chimeBowl(ctx: AudioContext, t: number): void {
    // Kyoto singing bowl: 440 Hz + 884 Hz (4 Hz beat vs the 880 Hz octave), 4.5 s decay.
    const duration = 4.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1.1, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 660;
    band.Q.value = 0.5;

    const partials: Array<[number, number]> = [
      [440, 1],
      [884, 0.6],
    ];
    for (const [freq, level] of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(band);
      osc.start(t);
      osc.stop(t + duration + 0.1);
    }
    band.connect(gain).connect(this.chimeBus!);
  }

  private chimeShinkansen(ctx: AudioContext, t: number): void {
    // C5 -> E5 -> G5 ascending.
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => this.chimeNote(ctx, t + i * 0.34, freq, 1.6, 0.55));
  }

  private chimeNote(ctx: AudioContext, t: number, freq: number, duration: number, peak: number): void {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    gain.connect(this.chimeBus!);

    const harmonics: Array<[number, OscillatorType, number]> = [
      [1, "sine", 1],
      [2, "sine", 0.3],
      [3, "triangle", 0.1],
    ];
    for (const [mult, type, level] of harmonics) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(gain);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    }
  }

  private chimeBell(ctx: AudioContext, t: number): void {
    // Desk bell: 2200 Hz strike with decaying high overtones.
    const partials: Array<[number, number, number]> = [
      [2200, 0.7, 1.8],
      [4400, 0.3, 1.1],
      [6600, 0.18, 0.7],
      [8800, 0.09, 0.4],
    ];
    for (const [freq, peak, decay] of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(g).connect(this.chimeBus!);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    }
  }

  // ------------------------------------------------------------- ambient

  startAmbient(kind: AmbientKind): void {
    this.unlock();
    const ctx = this.ensure();
    if (!ctx || !this.ambientBus || this.ambient[kind]) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.connect(this.ambientBus);

    const voice: AmbientVoice = { gain, sources: [], nodes: [gain], timer: null };

    if (kind === "brown") this.buildBrown(ctx, voice);
    else if (kind === "pink") this.buildPink(ctx, voice);
    else this.buildRain(ctx, voice);

    this.ambient[kind] = voice;
    gain.gain.setTargetAtTime(this.ambientTarget(kind), ctx.currentTime, 0.7);
  }

  stopAmbient(kind: AmbientKind): void {
    const voice = this.ambient[kind];
    const ctx = this.ctx;
    if (!voice || !ctx) return;
    this.ambient[kind] = null;
    if (voice.timer !== null) window.clearInterval(voice.timer);
    voice.gain.gain.cancelScheduledValues(ctx.currentTime);
    voice.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
    window.setTimeout(() => {
      for (const s of voice.sources) {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      }
      for (const n of voice.nodes) n.disconnect();
    }, 1500);
  }

  stopAllAmbient(): void {
    (Object.keys(this.ambient) as AmbientKind[]).forEach((k) => this.stopAmbient(k));
  }

  private buildBrown(ctx: AudioContext, voice: AmbientVoice): void {
    // White noise through two cascaded 200 Hz low-pass filters, then make-up gain.
    const src = this.loopSource(ctx, this.getWhite(ctx));
    const lp1 = ctx.createBiquadFilter();
    lp1.type = "lowpass";
    lp1.frequency.value = 200;
    const lp2 = ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 200;
    const makeup = ctx.createGain();
    makeup.gain.value = 10;
    src.connect(lp1).connect(lp2).connect(makeup).connect(voice.gain);
    src.start();
    voice.sources.push(src);
    voice.nodes.push(lp1, lp2, makeup);
  }

  private buildPink(ctx: AudioContext, voice: AmbientVoice): void {
    const src = this.loopSource(ctx, this.getPink(ctx));
    src.connect(voice.gain);
    src.start();
    voice.sources.push(src);
  }

  private buildRain(ctx: AudioContext, voice: AmbientVoice): void {
    // Pink base, band-limited like distant rainfall...
    const base = this.loopSource(ctx, this.getPink(ctx));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 500;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 7500;
    const bed = ctx.createGain();
    bed.gain.value = 0.55;
    base.connect(hp).connect(lp).connect(bed).connect(voice.gain);
    base.start();
    voice.sources.push(base);
    voice.nodes.push(hp, lp, bed);

    // ...plus randomized high-frequency droplets scheduled slightly ahead of time.
    const white = this.getWhite(ctx);
    const dropsPerSecond = 45;
    const tickMs = 80;
    voice.timer = window.setInterval(() => {
      if (ctx.state !== "running") return;
      const expected = (dropsPerSecond * tickMs) / 1000;
      const count = Math.floor(expected + Math.random());
      for (let i = 0; i < count; i++) {
        const when = ctx.currentTime + Math.random() * (tickMs / 1000);
        const drop = ctx.createBufferSource();
        drop.buffer = white;
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 2500 + Math.random() * 6500;
        band.Q.value = 4;
        const g = ctx.createGain();
        const peak = 0.05 + Math.random() * 0.25;
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(peak, when + 0.0005);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.006 + Math.random() * 0.012);
        drop.connect(band).connect(g).connect(voice.gain);
        drop.start(when, Math.random() * (white.duration - 0.05), 0.03);
      }
    }, tickMs);
  }

  // ------------------------------------------------------------- internals

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 6;
    master.connect(compressor).connect(ctx.destination);

    const bus = (): GainNode => {
      const g = ctx.createGain();
      g.connect(master);
      return g;
    };
    this.ctx = ctx;
    this.master = master;
    this.tickBus = bus();
    this.chimeBus = bus();
    this.ambientBus = bus();
    this.applyLevels();
    return ctx;
  }

  /** Context that is created and actually running (ticks/chimes are skipped before a user gesture). */
  private ready(): AudioContext | null {
    const ctx = this.ensure();
    return ctx && ctx.state === "running" ? ctx : null;
  }

  private applyLevels(): void {
    if (!this.ctx || !this.master || !this.tickBus || !this.chimeBus || !this.ambientBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.levels.muted ? 0 : taper(this.levels.masterVolume), t, 0.03);
    this.tickBus.gain.setTargetAtTime(taper(this.levels.tickVolume), t, 0.03);
    this.chimeBus.gain.setTargetAtTime(taper(this.levels.chimeVolume), t, 0.03);
    this.ambientBus.gain.setTargetAtTime(1, t, 0.03);
  }

  private ambientTarget(kind: AmbientKind): number {
    return taper(this.ambientVolumes[kind]) * AMBIENT_CEILING[kind];
  }

  private loopSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  private getWhite(ctx: AudioContext): AudioBuffer {
    if (this.whiteBuffer) return this.whiteBuffer;
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.whiteBuffer = buffer;
    return buffer;
  }

  /** Pink noise (-3 dB/octave) via Paul Kellet's refined filter. */
  private getPink(ctx: AudioContext): AudioBuffer {
    if (this.pinkBuffer) return this.pinkBuffer;
    const length = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    // Crossfade the loop seam to avoid a click.
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const w = i / fade;
      data[length - fade + i] = data[length - fade + i] * (1 - w) + data[i] * w;
    }
    this.pinkBuffer = buffer;
    return buffer;
  }
}

export const soundEngine = new SoundEngine();
