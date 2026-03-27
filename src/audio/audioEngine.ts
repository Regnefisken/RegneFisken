import type { SoundId } from '../data/audio.js';
import { useUIStore } from '../store/useUIStore.js';

let audioCtx: AudioContext | null = null;
let ambienceNode: AudioBufferSourceNode | null = null;
let ambienceGain: GainNode | null = null;
let rainNode: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
const seagullSpawnQueue: unknown[] = [];

let bossAmbienceOsc: OscillatorNode | null = null;
let bossAmbienceGain: GainNode | null = null;

function initAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function isMuted(): boolean {
  try {
    return useUIStore.getState().isMuted;
  } catch {
    return false;
  }
}

/** Kald fra AmbientLife: én `play('seagull')` kan udløse én spawn-batch (som i legacy). */
export function consumeSeagullSpawn(): boolean {
  if (seagullSpawnQueue.length === 0) return false;
  seagullSpawnQueue.shift();
  return true;
}

export function playSoundEffect(type: SoundId | string): void {
  if (isMuted()) return;
  const ctx = initAudio();
  if (!ctx) return;

  if (type === 'seagull') {
    seagullSpawnQueue.push(true);
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;

  switch (type) {
    case 'ui':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'error':
    case 'junk':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    case 'cast':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'splash':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'bite':
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      osc.frequency.setValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    case 'coin':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;
    case 'win':
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.4);
      });
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    case 'legendary':
      [392, 523, 659, 783, 1046, 1567].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sawtooth';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, now + i * 0.15);
        g.gain.linearRampToValueAtTime(0.001, now + i * 0.15 + 1.0);
        o.start(now + i * 0.15);
        o.stop(now + i * 0.15 + 1.0);
      });
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    case 'lose':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.8);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
      break;
    case 'tick':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    case 'boss_hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'seagull':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(1500, now + 0.2);
      osc.frequency.linearRampToValueAtTime(1000, now + 0.5);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.6);
      break;
    case 'xp':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    case 'levelup':
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.12, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 0.25);
      });
      {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        const vib = ctx.createOscillator();
        const vibGain = ctx.createGain();
        vib.frequency.value = 6;
        vibGain.gain.value = 15;
        vib.connect(vibGain);
        vibGain.connect(o2.frequency);
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(1047, now + 0.28);
        g2.gain.setValueAtTime(0.15, now + 0.28);
        g2.gain.linearRampToValueAtTime(0.001, now + 1.2);
        vib.start(now + 0.28);
        vib.stop(now + 1.2);
        o2.start(now + 0.28);
        o2.stop(now + 1.2);
      }
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    case 'unlock':
      [440, 554, 659, 880, 1108].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq * 0.8, now + i * 0.1);
        o.frequency.exponentialRampToValueAtTime(freq, now + i * 0.1 + 0.15);
        g.gain.setValueAtTime(0.08, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.5);
      });
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    case 'purchase': {
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.connect(g1);
      g1.connect(ctx.destination);
      o1.type = 'sine';
      o1.frequency.setValueAtTime(1200, now);
      o1.frequency.setValueAtTime(1800, now + 0.08);
      g1.gain.setValueAtTime(0.12, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o1.start(now);
      o1.stop(now + 0.3);
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.07, now + 0.25 + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.07 + 0.3);
        o.start(now + 0.25 + i * 0.07);
        o.stop(now + 0.25 + i * 0.07 + 0.3);
      });
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    }
    case 'thunder': {
      const noise = ctx.createBufferSource();
      const bSize = ctx.sampleRate * 2;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      noise.buffer = b;
      const tFilter = ctx.createBiquadFilter();
      tFilter.type = 'lowpass';
      tFilter.frequency.setValueAtTime(800, now);
      tFilter.frequency.exponentialRampToValueAtTime(100, now + 1.5);
      const tGain = ctx.createGain();
      tGain.gain.setValueAtTime(0.8, now);
      tGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      noise.connect(tFilter);
      tFilter.connect(tGain);
      tGain.connect(ctx.destination);
      noise.start(now);
      break;
    }
    case 'boss_ambience':
      // Styres via startBossAmbience / stopBossAmbience — ingen one-shot her
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    default:
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
  }
}

export function startAmbience(): void {
  if (isMuted()) return;
  const ctx = initAudio();
  if (!ctx || ambienceNode) return;
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.05;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  lfoGain.gain.value = 0.03;
  noise.connect(filter);
  filter.connect(gainNode);
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain);
  gainNode.connect(ctx.destination);
  noise.start();
  lfo.start();
  ambienceNode = noise;
  ambienceGain = gainNode;
}

export function stopAmbience(): void {
  if (ambienceNode) {
    try {
      ambienceNode.stop();
      ambienceNode.disconnect();
    } catch {
      /* ignore */
    }
    ambienceNode = null;
  }
  if (ambienceGain) {
    ambienceGain.disconnect();
    ambienceGain = null;
  }
  setRainVolume(0);
}

export function setRainVolume(vol: number): void {
  const ctx = initAudio();
  if (!ctx) return;
  if (vol > 0 && !rainNode) {
    const bSize = ctx.sampleRate;
    const buf = ctx.createBuffer(1, bSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
    rainNode = ctx.createBufferSource();
    rainNode.buffer = buf;
    rainNode.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 800;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainNode.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainNode.start();
  }
  if (rainGain) {
    rainGain.gain.setTargetAtTime(vol * 0.15, ctx.currentTime, 0.5);
  }
  if (vol === 0 && rainNode) {
    window.setTimeout(() => {
      if (rainGain && rainGain.gain.value < 0.001) {
        try {
          rainNode?.stop();
        } catch {
          /* ignore */
        }
        rainNode = null;
        rainGain = null;
      }
    }, 1000);
  }
}

export function startBossAmbience(): void {
  if (isMuted()) return;
  const ctx = initAudio();
  if (!ctx || bossAmbienceOsc) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = 58;
  g.gain.value = 0.035;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  bossAmbienceOsc = o;
  bossAmbienceGain = g;
}

export function stopBossAmbience(): void {
  if (bossAmbienceOsc) {
    try {
      bossAmbienceOsc.stop();
      bossAmbienceOsc.disconnect();
    } catch {
      /* ignore */
    }
    bossAmbienceOsc = null;
  }
  if (bossAmbienceGain) {
    bossAmbienceGain.disconnect();
    bossAmbienceGain = null;
  }
}

let ambienceStarted = false;
export function ensureAmbienceStarted(): void {
  if (ambienceStarted) return;
  ambienceStarted = true;
  startAmbience();
}
