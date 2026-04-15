import type { SoundId } from '../data/audio.js';
import { getOceanAmbienceGainMultiplier, shouldPlayOceanAmbience } from '../logic/location-helpers.js';
import { useGameStore } from '../store/useGameStore.js';
import { useUIStore } from '../store/useUIStore.js';

let audioCtx: AudioContext | null = null;
let ambienceNode: AudioBufferSourceNode | null = null;
let ambienceGain: GainNode | null = null;
let ambienceLfo: OscillatorNode | null = null;
let ambienceLfoGain: GainNode | null = null;
/** Afslutter `fadeOutStopAmbience` med hard `stopAmbience`. */
let ambienceFadeOutTimer: ReturnType<typeof setTimeout> | null = null;
let rainNode: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
let rainStopTimer: ReturnType<typeof setTimeout> | null = null;

/** Hav/regn ↔ grotte (og hav ind efter grotte): blød crossfade. */
export const LOCATION_AMBIENCE_CROSSFADE_SEC = 2;
/** Pier → hytte/ørken: kortere fade så havet ikke “hænger” i lokalet. */
export const INDOOR_OCEAN_FADE_OUT_SEC = 0.85;
/** Kun når du **forlader** grotte — kortere så loopet ikke hænger for længe. */
const CAVE_AMBIENCE_FADE_OUT_SEC = 1;
const seagullSpawnQueue: unknown[] = [];

let bossAmbienceOsc: OscillatorNode | null = null;
let bossAmbienceGain: GainNode | null = null;

/** Grotte-ambience (brun støj + sub + multi-delay) — kun i lokation `cave`. */
let caveMasterGain: GainNode | null = null;
let caveCompressor: DynamicsCompressorNode | null = null;
let caveSubOsc: OscillatorNode | null = null;
let caveSubGain: GainNode | null = null;
/** @deprecated API — bevidst brugt til samme brown-noise som HTML-demo. */
let caveNoiseProcessor: ScriptProcessorNode | null = null;
/** Fallback hvis `createScriptProcessor` ikke findes (loopet buffer med samme brown-algoritme). */
let caveNoiseBufferSource: AudioBufferSourceNode | null = null;
let caveLp1: BiquadFilterNode | null = null;
let caveLp2: BiquadFilterNode | null = null;
let caveNoiseGain: GainNode | null = null;
let caveBreathLFO: OscillatorNode | null = null;
let caveLfoDepth: GainNode | null = null;
let caveReverbInput: GainNode | null = null;
type CaveDelayTap = { delay: DelayNode; feedback: GainNode; damper: BiquadFilterNode };
const caveDelayTaps: CaveDelayTap[] = [];
let caveStopTimer: ReturnType<typeof setTimeout> | null = null;

/** Sættes af dev-værktøjer (fx `apps/sound-lab`) så `playSoundEffect` kan afspilles uden spillets UI-mute. */
let soundLabBypassMute = false;
export function setSoundLabBypassMute(enabled: boolean): void {
  soundLabBypassMute = enabled;
}

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
  if (soundLabBypassMute) return false;
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

/** Samme kø som `play('seagull')`, men uden lyd — fx hyttens stue/køkken (kun visuelle fugle). */
export function queueSeagullVisualSpawn(): void {
  seagullSpawnQueue.push(true);
}

/**
 * Vand-plop (SoundId splash) — baseret på v1 og v2 fra `references/version 1 og version 2.html`.
 * Hver afspilning: tilfældig variant + små jitter på frekvens, filter, gain og tid så plask ikke lyder identisk.
 */
function playSplashWaterPlopV1(ctx: AudioContext, when: number): void {
  const f0 = 520 + Math.random() * 220;
  const f1 = Math.max(45, 65 + Math.random() * 40);
  const tPitch = 0.09 + Math.random() * 0.05;
  const fLp0 = 900 + Math.random() * 600;
  const fLp1 = 140 + Math.random() * 120;
  const tFilter = 0.12 + Math.random() * 0.06;
  const q = 1.2 + Math.random() * 0.7;
  const peak = 0.28 + Math.random() * 0.14;
  const tTail = 0.17 + Math.random() * 0.06;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, when);
  osc.frequency.exponentialRampToValueAtTime(f1, when + tPitch);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(fLp0, when);
  filter.frequency.exponentialRampToValueAtTime(fLp1, when + tFilter);
  filter.Q.value = q;
  g.gain.setValueAtTime(peak, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + tTail);
  osc.connect(filter).connect(g).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.28);
}

function playSplashWaterPlopV2(ctx: AudioContext, when: number): void {
  const f0 = 330 + Math.random() * 140;
  const f1 = Math.max(40, 48 + Math.random() * 28);
  const tOsc = 0.12 + Math.random() * 0.05;
  const gPeak = 0.34 + Math.random() * 0.14;
  const tOscTail = 0.18 + Math.random() * 0.06;
  const osc = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, when);
  osc.frequency.exponentialRampToValueAtTime(f1, when + tOsc);
  g1.gain.setValueAtTime(gPeak, when);
  g1.gain.exponentialRampToValueAtTime(0.001, when + tOscTail);
  osc.connect(g1).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.28);
  const noiseDur = 0.045 + Math.random() * 0.03;
  const bufLen = Math.floor(ctx.sampleRate * noiseDur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const nScale = 0.22 + Math.random() * 0.14;
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * nScale;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 240 + Math.random() * 140;
  nf.Q.value = 1.4 + Math.random() * 1;
  const ng = ctx.createGain();
  const nAttack = 0.16 + Math.random() * 0.1;
  const nDecay = 0.05 + Math.random() * 0.035;
  ng.gain.setValueAtTime(nAttack, when);
  ng.gain.exponentialRampToValueAtTime(0.001, when + nDecay);
  noise.connect(nf).connect(ng).connect(ctx.destination);
  noise.start(when);
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
    case 'splash': {
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      if (Math.random() < 0.5) {
        playSplashWaterPlopV1(ctx, now);
      } else {
        playSplashWaterPlopV2(ctx, now);
      }
      break;
    }
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
    case 'bat_pass':
    case 'bat_pass_2': {
      const second = type === 'bat_pass_2';
      const duration = second ? 0.15 : 0.16;
      const bOsc = ctx.createOscillator();
      bOsc.type = 'square';
      const f0 = second ? 2100 : 2400;
      const f1 = second ? 7600 : 8200;
      const peak = second ? 0.065 : 0.07;
      bOsc.frequency.setValueAtTime(f0, now);
      bOsc.frequency.exponentialRampToValueAtTime(f1, now + duration);
      const bGain = ctx.createGain();
      bGain.gain.setValueAtTime(0, now);
      bGain.gain.linearRampToValueAtTime(peak, now + 0.008);
      bGain.gain.setValueAtTime(peak, now + duration - 0.015);
      bGain.gain.linearRampToValueAtTime(0.001, now + duration);
      const bFilter = ctx.createBiquadFilter();
      bFilter.type = 'highpass';
      bFilter.frequency.setValueAtTime(second ? 880 : 950, now);
      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + duration + 0.05);
      gain.gain.setValueAtTime(0, now);
      osc.start(now);
      osc.stop(now + 0.01);
      break;
    }
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
    case 'cave_drip': {
      osc.type = 'sine';
      const freq = 1200 + Math.random() * 800;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.15);
      gain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
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

const OCEAN_AMBIENCE_TARGET_GAIN = 0.05;
const OCEAN_AMBIENCE_LFO_DEPTH = 0.03;

function getOceanAmbienceTargetGain(): number {
  try {
    const loc = useGameStore.getState().currentLocation;
    return OCEAN_AMBIENCE_TARGET_GAIN * getOceanAmbienceGainMultiplier(loc);
  } catch {
    return OCEAN_AMBIENCE_TARGET_GAIN;
  }
}

function canPlayOceanAmbienceNow(): boolean {
  try {
    return shouldPlayOceanAmbience(useGameStore.getState().currentLocation);
  } catch {
    return true;
  }
}

export function startAmbience(fadeInSec?: number): void {
  if (isMuted()) return;
  const ctx = initAudio();
  if (!ctx) return;

  if (ambienceNode && ambienceGain) {
    if (!canPlayOceanAmbienceNow()) {
      if (ambienceFadeOutTimer !== null) {
        clearTimeout(ambienceFadeOutTimer);
        ambienceFadeOutTimer = null;
      }
      stopAmbience();
      return;
    }
    if (fadeInSec != null && fadeInSec > 0) {
      if (ambienceFadeOutTimer !== null) {
        clearTimeout(ambienceFadeOutTimer);
        ambienceFadeOutTimer = null;
      }
      const now = ctx.currentTime;
      ambienceGain.gain.cancelScheduledValues(now);
      const v = Math.max(ambienceGain.gain.value, 0.0001);
      ambienceGain.gain.setValueAtTime(v, now);
      const target = getOceanAmbienceTargetGain();
      ambienceGain.gain.linearRampToValueAtTime(target, now + fadeInSec);
      if (ambienceLfoGain) {
        const mult = getOceanAmbienceGainMultiplier(useGameStore.getState().currentLocation);
        ambienceLfoGain.gain.value = OCEAN_AMBIENCE_LFO_DEPTH * mult;
      }
    }
    return;
  }

  if (!canPlayOceanAmbienceNow()) return;

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
  const now = ctx.currentTime;
  const doFadeIn = fadeInSec != null && fadeInSec > 0;
  const mult = getOceanAmbienceGainMultiplier(useGameStore.getState().currentLocation);
  const targetGain = OCEAN_AMBIENCE_TARGET_GAIN * mult;
  gainNode.gain.value = doFadeIn ? 0 : targetGain;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  lfoGain.gain.value = OCEAN_AMBIENCE_LFO_DEPTH * mult;
  noise.connect(filter);
  filter.connect(gainNode);
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain);
  gainNode.connect(ctx.destination);
  noise.start();
  lfo.start();
  if (doFadeIn) {
    gainNode.gain.linearRampToValueAtTime(targetGain, now + fadeInSec!);
  }
  ambienceNode = noise;
  ambienceGain = gainNode;
  ambienceLfo = lfo;
  ambienceLfoGain = lfoGain;
}

/** Hav + regn fades ned og stoppes efter `durationSec` (til lokationsskift mod grotte el.l.). */
export function fadeOutStopAmbience(durationSec: number): void {
  const ctx = initAudio();
  if (!ctx) return;
  if (ambienceFadeOutTimer !== null) {
    clearTimeout(ambienceFadeOutTimer);
    ambienceFadeOutTimer = null;
  }

  if (!ambienceNode || !ambienceGain) {
    if (rainGain) {
      const now = ctx.currentTime;
      rainGain.gain.cancelScheduledValues(now);
      rainGain.gain.setValueAtTime(rainGain.gain.value, now);
      rainGain.gain.linearRampToValueAtTime(0, now + durationSec);
      window.setTimeout(() => setRainVolume(0), durationSec * 1000 + 100);
    }
    return;
  }

  const now = ctx.currentTime;
  ambienceGain.gain.cancelScheduledValues(now);
  ambienceGain.gain.setValueAtTime(ambienceGain.gain.value, now);
  ambienceGain.gain.linearRampToValueAtTime(0, now + durationSec);
  if (rainGain) {
    rainGain.gain.cancelScheduledValues(now);
    rainGain.gain.setValueAtTime(rainGain.gain.value, now);
    rainGain.gain.linearRampToValueAtTime(0, now + durationSec);
  }

  ambienceFadeOutTimer = window.setTimeout(() => {
    ambienceFadeOutTimer = null;
    stopAmbience();
  }, durationSec * 1000 + 100);
}

export function stopAmbience(): void {
  if (ambienceFadeOutTimer !== null) {
    clearTimeout(ambienceFadeOutTimer);
    ambienceFadeOutTimer = null;
  }
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
  if (ambienceLfo) {
    try {
      ambienceLfo.stop();
      ambienceLfo.disconnect();
    } catch {
      /* ignore */
    }
    ambienceLfo = null;
  }
  if (ambienceLfoGain) {
    ambienceLfoGain.disconnect();
    ambienceLfoGain = null;
  }
  setRainVolume(0);
}

export function setRainVolume(vol: number): void {
  const ctx = initAudio();
  if (!ctx) return;

  if (rainStopTimer !== null) {
    clearTimeout(rainStopTimer);
    rainStopTimer = null;
  }

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
    rainStopTimer = window.setTimeout(() => {
      rainStopTimer = null;
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

function createCaveBrownNoiseProcessor(ctx: AudioContext): ScriptProcessorNode | null {
  if (typeof (ctx as BaseAudioContext & { createScriptProcessor?: unknown }).createScriptProcessor !== 'function') {
    return null;
  }
  const bufferSize = 4096;
  const node = (
    ctx as BaseAudioContext & {
      createScriptProcessor(bufferSize: number, numberOfInputChannels: number, numberOfOutputChannels: number): ScriptProcessorNode;
    }
  ).createScriptProcessor(bufferSize, 0, 1);
  let lastOut = 0;
  node.onaudioprocess = (e: AudioProcessingEvent) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.018 * white) / 1.018;
      output[i] = lastOut * 1.65;
    }
  };
  return node;
}

function createCaveBrownNoiseBufferSource(ctx: AudioContext): AudioBufferSourceNode {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let v = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    v = (v + 0.018 * white) / 1.018;
    data[i] = Math.max(-1, Math.min(1, v * 1.65));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function disposeCaveAmbienceGraphSync(): void {
  for (const tap of caveDelayTaps) {
    try {
      tap.delay.disconnect();
    } catch {
      /* ignore */
    }
    try {
      tap.feedback.disconnect();
    } catch {
      /* ignore */
    }
    try {
      tap.damper.disconnect();
    } catch {
      /* ignore */
    }
  }
  caveDelayTaps.length = 0;
  try {
    caveSubOsc?.stop();
  } catch {
    /* ignore */
  }
  try {
    caveBreathLFO?.stop();
  } catch {
    /* ignore */
  }
  caveNoiseProcessor?.disconnect();
  try {
    caveNoiseBufferSource?.stop();
  } catch {
    /* ignore */
  }
  caveNoiseBufferSource?.disconnect();
  caveSubOsc?.disconnect();
  caveSubGain?.disconnect();
  caveLp1?.disconnect();
  caveLp2?.disconnect();
  caveNoiseGain?.disconnect();
  caveBreathLFO?.disconnect();
  caveLfoDepth?.disconnect();
  caveReverbInput?.disconnect();
  caveMasterGain?.disconnect();
  caveCompressor?.disconnect();
  caveSubOsc = null;
  caveSubGain = null;
  caveNoiseProcessor = null;
  caveNoiseBufferSource = null;
  caveLp1 = null;
  caveLp2 = null;
  caveNoiseGain = null;
  caveBreathLFO = null;
  caveLfoDepth = null;
  caveReverbInput = null;
  caveMasterGain = null;
  caveCompressor = null;
}

const CAVE_MASTER_TARGET_GAIN = 0.48;

/** Grotte-rungen (HTML-demo): 2 s LFO-puls, brun støj, sub, multi-delay, compressor. */
export function startCaveAmbience(fadeInSec?: number): void {
  const ctx = initAudio();
  if (!ctx) return;
  if (isMuted()) return;

  if (caveStopTimer !== null) {
    clearTimeout(caveStopTimer);
    caveStopTimer = null;
    disposeCaveAmbienceGraphSync();
  } else if (caveMasterGain) {
    return;
  }

  const noiseProc = createCaveBrownNoiseProcessor(ctx);
  let noiseIntoLp1: AudioNode;
  if (noiseProc) {
    caveNoiseProcessor = noiseProc;
    noiseIntoLp1 = noiseProc;
  } else {
    caveNoiseBufferSource = createCaveBrownNoiseBufferSource(ctx);
    noiseIntoLp1 = caveNoiseBufferSource;
  }

  caveMasterGain = ctx.createGain();
  const caveNow = ctx.currentTime;
  const caveFadeIn = fadeInSec != null && fadeInSec > 0;
  caveMasterGain.gain.value = caveFadeIn ? 0 : CAVE_MASTER_TARGET_GAIN;

  caveCompressor = ctx.createDynamicsCompressor();
  caveCompressor.threshold.setValueAtTime(-22, caveNow);
  caveCompressor.knee.setValueAtTime(18, caveNow);
  caveCompressor.ratio.setValueAtTime(14, caveNow);
  caveCompressor.attack.setValueAtTime(0.003, caveNow);
  caveCompressor.release.setValueAtTime(0.25, caveNow);

  caveSubOsc = ctx.createOscillator();
  caveSubOsc.type = 'sine';
  caveSubOsc.frequency.setValueAtTime(27, caveNow);

  caveSubGain = ctx.createGain();
  caveSubGain.gain.value = 0.22;
  caveSubOsc.connect(caveSubGain);
  caveSubGain.connect(caveMasterGain);

  caveLp1 = ctx.createBiquadFilter();
  caveLp1.type = 'lowpass';
  caveLp1.frequency.setValueAtTime(140, caveNow);
  caveLp1.Q.value = 1.1;

  caveLp2 = ctx.createBiquadFilter();
  caveLp2.type = 'lowpass';
  caveLp2.frequency.setValueAtTime(68, caveNow);
  caveLp2.Q.value = 0.9;

  noiseIntoLp1.connect(caveLp1);
  caveLp1.connect(caveLp2);

  caveNoiseGain = ctx.createGain();
  caveNoiseGain.gain.value = 0.65;
  caveLp2.connect(caveNoiseGain);
  caveNoiseGain.connect(caveMasterGain);

  caveBreathLFO = ctx.createOscillator();
  caveBreathLFO.type = 'sine';
  caveBreathLFO.frequency.setValueAtTime(0.5, caveNow);

  caveLfoDepth = ctx.createGain();
  caveLfoDepth.gain.value = 0.26;
  caveBreathLFO.connect(caveLfoDepth);
  caveLfoDepth.connect(caveNoiseGain.gain);

  caveReverbInput = ctx.createGain();
  caveReverbInput.gain.value = 1;
  caveSubGain.connect(caveReverbInput);
  caveNoiseGain.connect(caveReverbInput);

  const delayTimes = [0.48, 0.91, 1.34, 1.82];
  const fbValues = [0.64, 0.55, 0.46, 0.38];
  const dampFreq = [1100, 820, 610, 390];

  delayTimes.forEach((time, i) => {
    const delay = ctx.createDelay(3);
    delay.delayTime.value = time;

    const feedback = ctx.createGain();
    feedback.gain.value = fbValues[i]!;

    const damper = ctx.createBiquadFilter();
    damper.type = 'lowpass';
    damper.frequency.value = dampFreq[i]!;

    delay.connect(damper);
    damper.connect(feedback);
    feedback.connect(delay);
    damper.connect(caveMasterGain!);
    caveReverbInput!.connect(delay);

    caveDelayTaps.push({ delay, feedback, damper });
  });

  caveMasterGain.connect(caveCompressor);
  caveCompressor.connect(ctx.destination);

  caveSubOsc.start();
  caveBreathLFO.start();
  if (caveNoiseBufferSource) {
    caveNoiseBufferSource.start();
  }
  if (caveFadeIn) {
    caveMasterGain.gain.linearRampToValueAtTime(CAVE_MASTER_TARGET_GAIN, caveNow + fadeInSec!);
  }
}

export function stopCaveAmbience(): void {
  const ctx = initAudio();
  if (!ctx) return;
  if (!caveMasterGain) return;

  const now = ctx.currentTime;
  const fadeTime = CAVE_AMBIENCE_FADE_OUT_SEC;

  caveMasterGain.gain.cancelScheduledValues(now);
  caveMasterGain.gain.setValueAtTime(caveMasterGain.gain.value, now);
  caveMasterGain.gain.linearRampToValueAtTime(0, now + fadeTime);

  if (caveBreathLFO) {
    try {
      caveBreathLFO.stop(now + fadeTime + 0.05);
    } catch {
      /* ignore */
    }
  }
  if (caveSubOsc) {
    try {
      caveSubOsc.stop(now + fadeTime + 0.05);
    } catch {
      /* ignore */
    }
  }

  if (caveStopTimer !== null) {
    clearTimeout(caveStopTimer);
    caveStopTimer = null;
  }

  caveStopTimer = window.setTimeout(() => {
    caveStopTimer = null;
    disposeCaveAmbienceGraphSync();
  }, (fadeTime + 0.35) * 1000);
}

let ambienceStarted = false;
export function ensureAmbienceStarted(): void {
  try {
    if (!shouldPlayOceanAmbience(useGameStore.getState().currentLocation)) return;
  } catch {
    /* ignore */
  }
  if (ambienceStarted) return;
  ambienceStarted = true;
  startAmbience();
}
