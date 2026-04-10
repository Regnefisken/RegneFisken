import type { SoundId } from '@regnefisken/audio-data';

/** Konkret vejledning så du kan skrive præcise prompts til Cursor om samme lyd som i spillet. */
export const SOUND_LAB_GUIDE: Record<
  SoundId,
  {
    label: string;
    where: string;
    /** Repo-sti fra rod — pegepind når du retter kode */
    codePointer: string;
  }
> = {
  ui: {
    label: 'UI-beep',
    where: 'Knapper, faner, modaler, indstillinger m.m. (mange steder).',
    codePointer: 'src/audio/audioEngine.ts → case \'ui\':',
  },
  error: {
    label: 'Fejl / afvist',
    where: 'Ugyldige handlinger, låst indhold, forkerte shop-køb osv.',
    codePointer: 'src/audio/audioEngine.ts → case \'error\': (samme som junk)',
  },
  junk: {
    label: 'Skrald-fangst',
    where: 'Boss/matematik-flow når fangsten er skrald.',
    codePointer: 'src/audio/audioEngine.ts → case \'junk\': (samme syntese som error)',
  },
  cast: {
    label: 'Kast',
    where: 'Kast agn; tutorial-hint (PierCabinHint).',
    codePointer: 'src/audio/audioEngine.ts → case \'cast\':',
  },
  splash: {
    label: 'Plask',
    where: 'Bobber, splash i catch-flow.',
    codePointer: 'src/audio/audioEngine.ts → case \'splash\':',
  },
  bite: {
    label: 'Bid',
    where: 'Fisk bider i FishingControls.',
    codePointer: 'src/audio/audioEngine.ts → case \'bite\':',
  },
  coin: {
    label: 'Mønt',
    where: 'Belønninger, salg, HUD m.m.',
    codePointer: 'src/audio/audioEngine.ts → case \'coin\':',
  },
  win: {
    label: 'Succes / fanget',
    where: 'Vellykket fangst, ønsker, mange “success”-situationer.',
    codePointer: 'src/audio/audioEngine.ts → case \'win\':',
  },
  legendary: {
    label: 'Legendarisk',
    where: 'Legendary/særlige fangster og NPC-øjeblikke.',
    codePointer: 'src/audio/audioEngine.ts → case \'legendary\':',
  },
  lose: {
    label: 'Tabt / forkert',
    where: 'Forkert svar i matematik-boss/kamp.',
    codePointer: 'src/audio/audioEngine.ts → case \'lose\':',
  },
  tick: {
    label: 'Tik (kort)',
    where: 'Nedtælling/timer i MathChallenge.',
    codePointer: 'src/audio/audioEngine.ts → case \'tick\':',
  },
  boss_hit: {
    label: 'Boss-træf (planlagt)',
    where: 'Ingen aktuelle play()-kald i spillet — kun engine-case.',
    codePointer: 'src/audio/audioEngine.ts → case \'boss_hit\':',
  },
  seagull: {
    label: 'Måge',
    where: 'AmbientLife ved åbne søer (ikke hytte); lyd + spawn-kø.',
    codePointer: 'src/audio/audioEngine.ts → case \'seagull\':',
  },
  bat_pass: {
    label: 'Flagermus (kort skrig)',
    where: 'Grotte — ca. hvert 15–20. sek. (ikke ved hver spawn).',
    codePointer: 'src/audio/audioEngine.ts → case \'bat_pass\':',
  },
  bat_pass_2: {
    label: 'Flagermus 2 (kort skrig)',
    where: 'Grotte — anden stemme; første efter ~24 s, derefter ca. hvert 30. sek.',
    codePointer: 'src/audio/audioEngine.ts → case \'bat_pass_2\':',
  },
  xp: {
    label: 'XP',
    where: 'Efter kamp-fangst med XP.',
    codePointer: 'src/audio/audioEngine.ts → case \'xp\':',
  },
  levelup: {
    label: 'Level up',
    where: 'LevelUpOverlay.',
    codePointer: 'src/audio/audioEngine.ts → case \'levelup\':',
  },
  unlock: {
    label: 'Lås op',
    where: 'Mål/shop/companions.',
    codePointer: 'src/audio/audioEngine.ts → case \'unlock\':',
  },
  purchase: {
    label: 'Køb',
    where: 'Shop-køb.',
    codePointer: 'src/audio/audioEngine.ts → case \'purchase\':',
  },
  thunder: {
    label: 'Torden',
    where: 'useWeatherEngine ved lyn.',
    codePointer: 'src/audio/audioEngine.ts → case \'thunder\':',
  },
  cave_drip: {
    label: 'Huledryp',
    where: 'CaveDrips i hule-miljøer.',
    codePointer: 'src/audio/audioEngine.ts → case \'cave_drip\':',
  },
  boss_ambience: {
    label: 'Boss (placeholder one-shot)',
    where: 'playSoundEffect(\'boss_ambience\') gør ingenting hørbar — rigtig boss-dron er startBossAmbience() i MathChallenge.',
    codePointer:
      'src/audio/audioEngine.ts → case \'boss_ambience\': (tom) — reelt loop: startBossAmbience() / stopBossAmbience()',
  },
};

export function buildCursorPrompt(id: SoundId): string {
  const g = SOUND_LAB_GUIDE[id];
  return [
    `Udskift Web Audio-implementeringen for SoundId "${id}" (${g.label}).`,
    '',
    `Pegepind: ${g.codePointer}`,
    '',
    `Kontekst i spillet: ${g.where}`,
    '',
    `Krav: Behold SoundId '${id}' og kontrakten omkring playSoundEffect; kun Web Audio-koden i den nævnte case (eller tilsvarende loop-funktion) ændres.`,
  ].join('\n');
}

export type AmbientSystemId = 'ocean' | 'rain' | 'boss_drone';

export const AMBIENT_LAB: Record<
  AmbientSystemId,
  {
    label: string;
    where: string;
    codePointer: string;
  }
> = {
  ocean: {
    label: 'Hav-/vind-loop (støj)',
    where:
      'Når spillet er startet og ikke muted — undtagen i grotte (cave). I hytte (cabin_*) og på Ørkensøen (desert_lake) er loopet svagere (getOceanAmbienceGainMultiplier).',
    codePointer:
      'src/audio/audioEngine.ts → startAmbience() · location-helpers: NO_OCEAN_AMBIENCE_LOCATIONS, getOceanAmbienceGainMultiplier',
  },
  rain: {
    label: 'Regn',
    where: 'setRainVolume fra vejr — 0 slår fra.',
    codePointer: 'src/audio/audioEngine.ts → setRainVolume()',
  },
  boss_drone: {
    label: 'Boss-dronen (lav tone)',
    where: 'MathChallenge: start ved boss, stop når kamp slutter.',
    codePointer: 'src/audio/audioEngine.ts → startBossAmbience() og stopBossAmbience()',
  },
};

export function buildAmbientCursorPrompt(id: AmbientSystemId): string {
  const g = AMBIENT_LAB[id];
  return [
    `Udskift Web Audio-implementeringen for: ${g.label}.`,
    '',
    `Pegepind: ${g.codePointer}`,
    '',
    `Kontekst: ${g.where}`,
    '',
    'Krav: Behold funktionsnavne og kaldsteder i spillet; kun syntese/grafer/noder i audioEngine ændres.',
  ].join('\n');
}
