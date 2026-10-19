// Synthesized sound: no audio files, no licensing, tiny bundle. A generative synthwave score
// (pad, bass, arpeggio, drums) whose layers follow the screen, and sound effects that play notes
// of the chord sounding at that moment, so feedback lands inside the music.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
/** effects sit above the score */
let sfxBus: GainNode | null = null;
let settings = { sfx: true, music: false, volume: 0.7 };

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = settings.volume * 0.9;
      // safety limiter on the output
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -6;
      lim.knee.value = 4;
      lim.ratio.value = 12;
      lim.attack.value = 0.003;
      lim.release.value = 0.2;
      master.connect(lim);
      lim.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 3;
      sfxBus.connect(master);
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
  if (master && ctx) master.gain.setTargetAtTime(settings.volume * 0.9, ctx.currentTime, 0.05);
  if (settings.music) startMusic();
  else stopMusic();
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
  if (!a || !sfxBus || !settings.sfx) return;
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
  g.connect(sfxBus!);
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
  if (!a || !sfxBus || !settings.sfx) return;
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
  g.connect(sfxBus!);
  src.start(t);
  src.stop(t + dur);
}

// ---------------------------------------------------------------------------------------------
// harmony shared by the score and the effects
// ---------------------------------------------------------------------------------------------
const MODES = {
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};
/** progressions as scale degrees, one chord per bar; the second half of each 8-bar phrase
 *  borrows the next progression so the loop does not repeat every 10 seconds */
const PROGS = [
  [0, 5, 2, 6],
  [0, 3, 5, 4],
  [0, 6, 5, 6],
  [5, 6, 0, 0],
  [0, 5, 3, 4],
];
/** bass root (MIDI) and colour per world; 0 is the city (title, map) */
const ROOTS = [45, 45, 41, 43, 40, 46, 42, 44, 47, 39, 45, 41, 43, 40, 46];
const MODE_OF: (keyof typeof MODES)[] = ['aeolian', 'dorian', 'aeolian', 'phrygian'];
type Key = { root: number; scale: number[]; prog: number };
const keyOf = (w: number): Key => ({
  root: ROOTS[w % ROOTS.length],
  scale: MODES[MODE_OF[w % MODE_OF.length]],
  prog: w % PROGS.length,
});
let key: Key = keyOf(0);
let nextKey: Key = key;
let bar = 0;
const semi = (k: Key, d: number) => k.scale[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
/** chord of a bar: root, third, fifth and seventh of the scale degree, in semitones */
function chordAt(k: Key, b: number) {
  const prog = PROGS[(k.prog + (b % 8 >= 4 ? 1 : 0)) % PROGS.length];
  const d = prog[b % 4];
  return [0, 2, 4, 6].map((i) => semi(k, d + i));
}
/** k-th chord tone of the sounding chord, `oct` octaves above the bass root */
const N = (k: number, oct: number) => {
  const ch = chordAt(key, bar);
  return key.root + 12 * oct + ch[k % 4] + 12 * Math.floor(k / 4);
};
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

let sfxEcho: GainNode | null = null;
/** a short synth note for feedback: filtered, with an optional echo */
function pluck(
  midi: number,
  {
    at = 0,
    dur = 0.18,
    gain = 0.07,
    type = 'square' as OscillatorType,
    bright = 2600,
    echo = 0,
    slide = 0,
  } = {},
) {
  const a = ac();
  if (!a || !sfxBus || !settings.sfx) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(hz(midi), t);
  if (slide) o.frequency.exponentialRampToValueAtTime(hz(midi + slide), t + dur);
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(bright, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(300, bright / 4), t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  f.connect(g);
  g.connect(sfxBus!);
  if (echo) {
    if (!sfxEcho) {
      sfxEcho = a.createGain();
      const d = a.createDelay(1);
      d.delayTime.value = 0.234;
      const fb = a.createGain();
      fb.gain.value = 0.32;
      const lp = a.createBiquadFilter();
      lp.frequency.value = 2400;
      sfxEcho.connect(d);
      d.connect(lp);
      lp.connect(fb);
      fb.connect(d);
      lp.connect(sfxBus!);
    }
    const s = a.createGain();
    s.gain.value = echo;
    g.connect(s);
    s.connect(sfxEcho);
  }
  o.start(t);
  o.stop(t + dur + 0.02);
}

let lastTick = 0;
export const sfx = {
  hover: () => pluck(N(2, 3), { dur: 0.04, gain: 0.018, type: 'sine' }),
  click: () => pluck(N(0, 3), { dur: 0.06, gain: 0.05, type: 'triangle', bright: 4000 }),
  select: () => {
    pluck(N(1, 3), { dur: 0.07, gain: 0.05, bright: 3000 });
    pluck(N(2, 3), { at: 0.045, dur: 0.1, gain: 0.045, bright: 3000, echo: 0.3 });
  },
  tick: () => {
    const now = performance.now();
    if (now - lastTick < 28) return;
    lastTick = now;
    tone(1800 + Math.random() * 300, { dur: 0.012, gain: 0.018, type: 'square' });
  },
  advance: () => {
    pluck(N(0, 2), { dur: 0.1, gain: 0.05, type: 'sawtooth', bright: 1800 });
    pluck(N(2, 2), {
      at: 0.06,
      dur: 0.14,
      gain: 0.045,
      type: 'sawtooth',
      bright: 2200,
      echo: 0.35,
    });
  },
  snap: () => pluck(N(3, 3), { dur: 0.06, gain: 0.06, type: 'triangle', slide: 2 }),
  /** a rising arpeggio of the sounding chord; each answer in a row starts one chord tone higher */
  ok: (streak = 0) => {
    const s0 = Math.min(streak, 6);
    [0, 1, 2].forEach((i) =>
      pluck(N(s0 + i, 2), { at: i * 0.06, dur: 0.22, gain: 0.07, bright: 3200, echo: 0.35 }),
    );
    pluck(N(s0 + 4, 3), { at: 0.18, dur: 0.5, gain: 0.04, type: 'sine', echo: 0.5 });
  },
  /** a low, dull semitone and the music closes its filter for a moment */
  bad: () => {
    pluck(key.root + 12, { dur: 0.28, gain: 0.1, type: 'sawtooth', bright: 700, slide: -1 });
    pluck(key.root + 13, { dur: 0.28, gain: 0.07, type: 'square', bright: 600, slide: -1 });
    muffle();
  },
  hint: () => {
    pluck(N(2, 3), { dur: 0.16, gain: 0.045, type: 'sine', echo: 0.4 });
    pluck(N(1, 3), { at: 0.1, dur: 0.22, gain: 0.045, type: 'sine', echo: 0.4 });
  },
  whoosh: () => noise({ dur: 0.35, gain: 0.05, from: 300, to: 3000 }),
  boot: () => {
    noise({ dur: 0.6, gain: 0.04, from: 200, to: 1600 });
    [0, 1, 2, 3].forEach((k) =>
      pluck(N(k, 2), {
        at: 0.12 + k * 0.08,
        dur: 0.6,
        gain: 0.04,
        type: 'sawtooth',
        bright: 1600,
        echo: 0.4,
      }),
    );
  },
  unlock: () => {
    [0, 1, 2, 3, 4].forEach((k) =>
      pluck(N(k, 2), { at: k * 0.07, dur: 0.35, gain: 0.06, bright: 3600, echo: 0.3 }),
    );
    noise({ at: 0.3, dur: 0.6, gain: 0.03, from: 2000, to: 8000, q: 1 });
  },
  /** a cadence in the key of the world: VI, VII, i */
  complete: () => {
    [5, 6, 7].forEach((d, j) =>
      [0, 2, 4].forEach((i) =>
        pluck(key.root + 24 + semi(key, d + i), {
          at: j * 0.24,
          dur: j === 2 ? 1.2 : 0.4,
          gain: 0.045,
          type: 'sawtooth',
          bright: 2400,
          echo: j === 2 ? 0.5 : 0.2,
        }),
      ),
    );
  },
  hit: () => {
    noise({ dur: 0.18, gain: 0.12, from: 1500, to: 200, q: 1 });
    tone(110, { dur: 0.25, gain: 0.14, type: 'sine', slideTo: 55 });
  },
  glitch: () => {
    for (let i = 0; i < 5; i++)
      tone(200 + Math.random() * 1600, { at: i * 0.025, dur: 0.03, gain: 0.04, type: 'square' });
  },
  star: (i: number) => pluck(N(i * 2, 3), { dur: 0.3, gain: 0.07, type: 'triangle', echo: 0.4 }),
};

// ---------------------------------------------------------------------------------------------
// the score: 96 BPM, one chord per bar, vertical layers that follow the screen
// ---------------------------------------------------------------------------------------------
type Layer = 'pad' | 'bass' | 'arp' | 'drums' | 'hats' | 'lead';
export type Mood = 'title' | 'map' | 'scene' | 'lesson' | 'demo' | 'challenge' | 'boss' | 'results';
/** e: energy, picks the patterns on the next bar; mix: layer levels, glide right away */
const MOODS: Record<Mood, { e: number; mix: Partial<Record<Layer, number>> }> = {
  title: { e: 0, mix: { pad: 1, arp: 0.6, bass: 0.6 } },
  scene: { e: 0, mix: { pad: 0.8, arp: 0.2, bass: 0.45 } },
  lesson: { e: 1, mix: { pad: 0.75, arp: 0.4, bass: 0.45, hats: 0.2 } },
  map: { e: 1, mix: { pad: 0.9, arp: 0.7, bass: 0.7, hats: 0.45, drums: 0.45 } },
  demo: { e: 2, mix: { pad: 0.7, arp: 0.5, bass: 0.75, hats: 0.55, drums: 0.55 } },
  challenge: { e: 3, mix: { pad: 0.55, arp: 0.65, bass: 0.9, hats: 0.7, drums: 0.85 } },
  boss: { e: 3, mix: { pad: 0.6, arp: 0.75, bass: 1, hats: 0.8, drums: 1, lead: 0.7 } },
  results: { e: 1, mix: { pad: 1, arp: 0.8, bass: 0.5, lead: 0.5 } },
};
const LAYERS: Layer[] = ['pad', 'bass', 'arp', 'drums', 'hats', 'lead'];
const SEND: Record<Layer, { duck: boolean; rev: number; dly: number }> = {
  pad: { duck: true, rev: 0.7, dly: 0 },
  bass: { duck: true, rev: 0.05, dly: 0 },
  arp: { duck: true, rev: 0.25, dly: 0.45 },
  drums: { duck: false, rev: 0.08, dly: 0 },
  hats: { duck: false, rev: 0.05, dly: 0.1 },
  lead: { duck: false, rev: 0.4, dly: 0.35 },
};
const STEP = 60 / 96 / 4;
let mood: Mood = 'title';
let energy = 0;

type Graph = {
  layer: Record<Layer, GainNode>;
  duck: GainNode;
  tone: BiquadFilterNode;
  noise: AudioBuffer;
};
let graph: Graph | null = null;
let timer: number | null = null;
let stopTimer: number | null = null;
let step = 0;
let nextT = 0;

function build(a: AudioContext): Graph {
  // tone: the whole score passes through one lowpass, closed briefly on a wrong answer
  const toneF = a.createBiquadFilter();
  toneF.type = 'lowpass';
  toneF.frequency.value = 16000;
  toneF.connect(musicGain!);
  const duck = a.createGain();
  duck.connect(toneF);
  // reverb from a generated impulse: 2.6 s of decaying stereo noise
  const len = Math.floor(a.sampleRate * 2.6);
  const ir = a.createBuffer(2, len, a.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const rev = a.createConvolver();
  rev.buffer = ir;
  rev.connect(toneF);
  // dotted-eighth echo
  const dly = a.createDelay(2);
  dly.delayTime.value = STEP * 3;
  const fb = a.createGain();
  fb.gain.value = 0.38;
  const dlp = a.createBiquadFilter();
  dlp.frequency.value = 2800;
  dly.connect(dlp);
  dlp.connect(fb);
  fb.connect(dly);
  dlp.connect(toneF);
  const layer = {} as Record<Layer, GainNode>;
  for (const l of LAYERS) {
    const g = a.createGain();
    g.gain.value = 0;
    g.connect(SEND[l].duck ? duck : toneF);
    for (const [amt, to] of [
      [SEND[l].rev, rev],
      [SEND[l].dly, dly],
    ] as const) {
      if (!amt) continue;
      const s = a.createGain();
      s.gain.value = amt;
      g.connect(s);
      s.connect(to);
    }
    layer[l] = g;
  }
  const nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { layer, duck, tone: toneF, noise: nb };
}

const level = (l: Layer) => MOODS[mood].mix[l] ?? 0;

function voice(
  a: AudioContext,
  out: AudioNode,
  t: number,
  {
    freq,
    type,
    dur,
    gain,
    attack = 0.005,
    cut,
    cutEnd,
    q = 1,
    detune = 0,
    pan = 0,
  }: {
    freq: number;
    type: OscillatorType;
    dur: number;
    gain: number;
    attack?: number;
    cut: number;
    cutEnd?: number;
    q?: number;
    detune?: number;
    pan?: number;
  },
) {
  const o = a.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(cut, t);
  if (cutEnd) f.frequency.exponentialRampToValueAtTime(cutEnd, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  f.connect(g);
  if (pan) {
    const p = a.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    p.connect(out);
  } else g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function hiss(
  a: AudioContext,
  g: Graph,
  out: AudioNode,
  t: number,
  dur: number,
  gain: number,
  hp: number,
) {
  const src = a.createBufferSource();
  src.buffer = g.noise;
  const f = a.createBiquadFilter();
  f.type = hp > 3000 ? 'highpass' : 'bandpass';
  f.frequency.value = hp;
  f.Q.value = 0.8;
  const e = a.createGain();
  e.gain.setValueAtTime(gain, t);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(e);
  e.connect(out);
  src.start(t, Math.random() * 1.5, dur + 0.05);
}

function playStep(a: AudioContext, g: Graph, s: number, t: number) {
  const i = s % 16;
  if (i === 0) {
    bar = Math.floor(s / 16);
    key = nextKey;
    energy = MOODS[mood].e;
  }
  const e = energy;
  const ch = chordAt(key, bar);
  const R = key.root;
  const L = g.layer;
  const on = (l: Layer) => L[l].gain.value > 0.003 || level(l) > 0;
  // a breath every 16 bars: drums drop out for the last bar of the phrase
  const breath = bar % 16 === 15;

  if (i === 0 && on('pad'))
    ch.forEach((c, k) =>
      [-9, 9].forEach((det) =>
        voice(a, L.pad, t, {
          freq: hz(R + 24 + c),
          type: 'sawtooth',
          dur: STEP * 16 + 1.2,
          gain: 0.06 - k * 0.008,
          attack: 0.9,
          cut: 700 + e * 260,
          detune: det,
        }),
      ),
    );

  if (on('bass')) {
    const hit =
      e === 0 ? i === 0 : e === 1 ? i % 4 === 2 || i === 0 : e === 2 ? i % 2 === 0 : i % 4 !== 1;
    if (hit) {
      const up = e >= 2 && i % 4 === 2 ? 12 : 0;
      const long = e === 0;
      voice(a, L.bass, t, {
        freq: hz(R + ch[0] + up),
        type: 'sawtooth',
        dur: long ? STEP * 15 : STEP * (e === 3 ? 0.9 : 1.6),
        gain: long ? 0.22 : 0.2,
        attack: long ? 0.3 : 0.004,
        cut: long ? 380 : 900 + e * 250,
        cutEnd: long ? 220 : 160,
        q: 5,
      });
    }
  }

  if (on('arp') && i % (e >= 2 ? 1 : 2) === 0) {
    const pat = bar % 2 ? [0, 2, 1, 3, 2, 4, 3, 1] : [0, 1, 2, 3, 4, 3, 2, 1];
    const k = pat[(i / (e >= 2 ? 1 : 2)) % 8];
    voice(a, L.arp, t, {
      freq: hz(R + 24 + ch[k % 4] + 12 * Math.floor(k / 4)),
      type: 'square',
      dur: STEP * 1.1,
      gain: 0.08,
      cut: 3200,
      cutEnd: 800,
      q: 3,
      pan: i % 4 < 2 ? -0.3 : 0.3,
    });
  }

  if (!breath && on('drums') && e >= 1) {
    const kick = e === 3 ? i % 4 === 0 : e === 2 ? i === 0 || i === 10 : i === 0;
    if (kick) {
      const o = a.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
      const k = a.createGain();
      k.gain.setValueAtTime(0.55, t);
      k.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(k);
      k.connect(L.drums);
      o.start(t);
      o.stop(t + 0.4);
      // sidechain pump: pad, bass and arpeggio breathe with the kick
      const depth = 0.55 * level('drums');
      g.duck.gain.setValueAtTime(1 - depth, t);
      g.duck.gain.linearRampToValueAtTime(1, t + 0.22);
    }
    if (e >= 2 && (i === 4 || i === 12 || (e === 3 && bar % 8 === 7 && i >= 13))) {
      hiss(a, g, L.drums, t, 0.17, 0.32, 1700);
      voice(a, L.drums, t, { freq: 185, type: 'triangle', dur: 0.08, gain: 0.18, cut: 2000 });
    }
  }
  if (!breath && on('hats') && e >= 1) {
    const swing = i % 2 ? STEP * 0.12 : 0;
    if (e >= 2 || i % 4 === 2) {
      const open = i % 4 === 2;
      hiss(a, g, L.hats, t + swing, open ? 0.14 : 0.035, open ? 0.09 : 0.05, 7500);
    }
  }

  if (on('lead') && bar % 2 === 1 && (i === 0 || i === 6 || i === 12)) {
    const motif = [
      [4, 2, 0],
      [5, 4, 2],
      [4, 6, 7],
      [2, 1, 0],
    ][Math.floor(bar / 2) % 4];
    const d = motif[i / 6];
    voice(a, L.lead, t, {
      freq: hz(R + 36 + semi(key, d)),
      type: 'sawtooth',
      dur: STEP * 5,
      gain: 0.08,
      attack: 0.03,
      cut: 2200,
      cutEnd: 1200,
      detune: 6,
    });
  }
}

function tick() {
  const a = ctx;
  if (!a || !graph) return;
  if (nextT < a.currentTime) nextT = a.currentTime + 0.05;
  while (nextT < a.currentTime + 0.15) {
    playStep(a, graph, step, nextT);
    nextT += STEP;
    step++;
  }
}

function applyMix(glide = 1.2) {
  if (!graph || !ctx) return;
  for (const l of LAYERS) graph.layer[l].gain.setTargetAtTime(level(l), ctx.currentTime, glide / 3);
}

function startMusic() {
  const a = ac();
  if (!a || !musicGain) return;
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  graph ??= build(a);
  applyMix(0.1);
  musicGain.gain.setTargetAtTime(0.9, a.currentTime, 1.2);
  if (timer === null && !document.hidden) {
    nextT = a.currentTime + 0.1;
    timer = window.setInterval(tick, 25);
  }
}
function stopMusic() {
  if (!musicGain || !ctx) return;
  musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  if (timer !== null && !stopTimer)
    stopTimer = window.setTimeout(() => {
      if (timer !== null) clearInterval(timer);
      timer = null;
      stopTimer = null;
    }, 2000);
}
/** a wrong answer: the score goes dull for under a second */
function muffle() {
  if (!graph || !ctx || timer === null) return;
  const f = graph.tone.frequency;
  const t = ctx.currentTime;
  f.cancelScheduledValues(t);
  f.setValueAtTime(f.value, t);
  f.exponentialRampToValueAtTime(420, t + 0.06);
  f.exponentialRampToValueAtTime(16000, t + 0.9);
}

if (typeof document !== 'undefined')
  document.addEventListener('visibilitychange', () => {
    if (!settings.music) return;
    if (document.hidden) {
      if (timer !== null) clearInterval(timer);
      timer = null;
      if (musicGain && ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    } else startMusic();
  });

/** QA: the context and master bus, to measure and record the mix (qa/listen.mjs) */
export const audioTap = () => ({ ctx: ac(), master });

export const music = {
  /** which screen we are on: layers glide now, patterns change on the next bar */
  mood(m: Mood) {
    if (m === mood) return;
    mood = m;
    applyMix();
  },
  /** key of the world (0 = the city); applied on the next bar */
  world(n: number) {
    nextKey = keyOf(n);
    if (timer === null) key = nextKey;
  },
};
