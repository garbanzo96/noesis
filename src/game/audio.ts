// Synthesized sound: no audio files, no licensing, tiny bundle. A dry, "lab instrument"
// palette (sine/triangle blips, filtered noise) instead of chiptune.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let settings = { sfx: true, music: false, volume: 0.7 };
let drone: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = settings.volume * 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.0;
      musicGain.connect(master);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function configureAudio(next: Partial<typeof settings>) {
  settings = { ...settings, ...next };
  if (master && ctx) master.gain.setTargetAtTime(settings.volume * 0.5, ctx.currentTime, 0.05);
  if (settings.music) startDrone();
  else stopDrone();
}

function tone(
  freq: number,
  {
    at = 0,
    dur = 0.12,
    type = 'sine' as OscillatorType,
    gain = 0.18,
    attack = 0.006,
    slideTo,
    detune = 0,
  }: {
    at?: number;
    dur?: number;
    type?: OscillatorType;
    gain?: number;
    attack?: number;
    slideTo?: number;
    detune?: number;
  } = {},
) {
  const a = ac();
  if (!a || !master || !settings.sfx) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = detune;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({
  at = 0,
  dur = 0.25,
  gain = 0.08,
  from = 400,
  to = 4000,
  q = 2,
}: { at?: number; dur?: number; gain?: number; from?: number; to?: number; q?: number } = {}) {
  const a = ac();
  if (!a || !master || !settings.sfx) return;
  const t = a.currentTime + at;
  const len = Math.ceil(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + dur);
}

let lastTick = 0;
export const sfx = {
  hover: () => tone(1320, { dur: 0.03, gain: 0.025, type: 'sine' }),
  click: () => tone(880, { dur: 0.05, gain: 0.07, type: 'triangle' }),
  select: () => {
    tone(660, { dur: 0.06, gain: 0.07, type: 'triangle' });
    tone(990, { at: 0.04, dur: 0.07, gain: 0.05, type: 'triangle' });
  },
  tick: () => {
    const now = performance.now();
    if (now - lastTick < 28) return;
    lastTick = now;
    tone(1800 + Math.random() * 300, { dur: 0.012, gain: 0.018, type: 'square' });
  },
  advance: () => {
    tone(520, { dur: 0.08, gain: 0.06, type: 'sine' });
    tone(780, { at: 0.05, dur: 0.1, gain: 0.05, type: 'sine' });
  },
  snap: () => tone(1240, { dur: 0.05, gain: 0.08, type: 'triangle', slideTo: 1500 }),
  ok: (streak = 0) => {
    const base = 523.25 * Math.pow(2, Math.min(streak, 6) / 12);
    [1, 1.25, 1.5].forEach((m, i) =>
      tone(base * m, { at: i * 0.055, dur: 0.22, gain: 0.09, type: 'triangle' }),
    );
    tone(base * 2, { at: 0.17, dur: 0.35, gain: 0.05, type: 'sine' });
  },
  bad: () => {
    tone(196, { dur: 0.22, gain: 0.1, type: 'sawtooth', slideTo: 140 });
    tone(207, { dur: 0.22, gain: 0.06, type: 'square', slideTo: 150 });
  },
  hint: () => {
    tone(740, { dur: 0.12, gain: 0.05, type: 'sine' });
    tone(554, { at: 0.08, dur: 0.16, gain: 0.05, type: 'sine' });
  },
  whoosh: () => noise({ dur: 0.35, gain: 0.06, from: 300, to: 3000 }),
  boot: () => {
    noise({ dur: 0.5, gain: 0.05, from: 200, to: 1200 });
    [220, 330, 440, 660].forEach((f, i) => tone(f, { at: 0.1 + i * 0.07, dur: 0.3, gain: 0.05, type: 'sine' }));
  },
  unlock: () => {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, { at: i * 0.07, dur: 0.4, gain: 0.07, type: 'triangle' }),
    );
    noise({ at: 0.3, dur: 0.6, gain: 0.03, from: 2000, to: 8000, q: 1 });
  },
  complete: () => {
    const chord = (fs: number[], at: number, dur: number) =>
      fs.forEach((f) => tone(f, { at, dur, gain: 0.06, type: 'triangle' }));
    chord([261.63, 329.63, 392], 0, 0.4);
    chord([293.66, 369.99, 440], 0.22, 0.4);
    chord([329.63, 415.3, 493.88, 659.25], 0.44, 1.1);
  },
  hit: () => {
    noise({ dur: 0.18, gain: 0.12, from: 1500, to: 200, q: 1 });
    tone(110, { dur: 0.25, gain: 0.14, type: 'sine', slideTo: 55 });
  },
  glitch: () => {
    for (let i = 0; i < 5; i++)
      tone(200 + Math.random() * 1600, { at: i * 0.025, dur: 0.03, gain: 0.04, type: 'square' });
  },
  star: (i: number) => tone(880 * Math.pow(2, i / 6), { dur: 0.25, gain: 0.08, type: 'triangle' }),
};

function startDrone() {
  const a = ac();
  if (!a || !musicGain || drone) return;
  const oscs: OscillatorNode[] = [];
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 6;
  const lfo = a.createOscillator();
  const lfoGain = a.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  [55, 82.41, 110.0, 164.81].forEach((f, i) => {
    const o = a.createOscillator();
    o.type = i % 2 ? 'sawtooth' : 'triangle';
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 6;
    const g = a.createGain();
    g.gain.value = 0.08 / (i + 1);
    o.connect(g);
    g.connect(filter);
    o.start();
    oscs.push(o);
  });
  filter.connect(musicGain);
  lfo.start();
  musicGain.gain.setTargetAtTime(0.35, a.currentTime, 2);
  drone = {
    stop: () => {
      if (!musicGain || !ctx) return;
      musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
      setTimeout(() => {
        oscs.forEach((o) => o.stop());
        lfo.stop();
      }, 2500);
    },
  };
}
function stopDrone() {
  drone?.stop();
  drone = null;
}
