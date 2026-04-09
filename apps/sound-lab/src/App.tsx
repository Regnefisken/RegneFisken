import { useCallback, useEffect, useState } from 'react';
import {
  playSoundEffect,
  setRainVolume,
  setSoundLabBypassMute,
  startAmbience,
  startBossAmbience,
  stopAmbience,
  stopBossAmbience,
} from '@regnefisken/audio-engine';
import { SOUND_IDS, type SoundId } from '@regnefisken/audio-data';
import { AMBIENT_LAB, buildAmbientCursorPrompt, buildCursorPrompt, SOUND_LAB_GUIDE } from './soundLabGuide.js';

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt('Kopiér manuelt:', text);
  }
}

export function App() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [oceanOn, setOceanOn] = useState(false);
  const [rain, setRain] = useState(0);
  const [bossOn, setBossOn] = useState(false);

  useEffect(() => {
    setSoundLabBypassMute(true);
    return () => {
      setSoundLabBypassMute(false);
      try {
        stopAmbience();
        setRainVolume(0);
        stopBossAmbience();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const flashCopied = useCallback((id: string) => {
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1600);
  }, []);

  const playOneShot = useCallback((id: SoundId) => {
    playSoundEffect(id);
  }, []);

  const toggleOcean = useCallback(() => {
    if (oceanOn) {
      stopAmbience();
      setOceanOn(false);
    } else {
      startAmbience();
      setOceanOn(true);
    }
  }, [oceanOn]);

  const onRainInput = useCallback((v: number) => {
    setRain(v);
    setRainVolume(v);
  }, []);

  const toggleBoss = useCallback(() => {
    if (bossOn) {
      stopBossAmbience();
      setBossOn(false);
    } else {
      startBossAmbience();
      setBossOn(true);
    }
  }, [bossOn]);

  return (
    <>
      <p className="badge">Mini-app · Web Audio som i spillet</p>
      <h1>Regnefisken — Sound Lab</h1>
      <p className="lead">
        Samme <code>playSoundEffect</code> og ambience-funktioner som i hovedspillet (import fra{' '}
        <code>src/audio/audioEngine.ts</code>). Brug <strong>Kopiér Cursor-prompt</strong> for en konkret pegepind til
        udskiftning i Cursor.
      </p>

      <h2>One-shot lyde ({SOUND_IDS.length})</h2>
      <table>
        <thead>
          <tr>
            <th>SoundId</th>
            <th>Beskrivelse</th>
            <th>Hvor i spillet</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {SOUND_IDS.map((id) => {
            const g = SOUND_LAB_GUIDE[id];
            return (
              <tr key={id}>
                <td>
                  <code>{id}</code>
                </td>
                <td>{g.label}</td>
                <td className="mono">{g.where}</td>
                <td>
                  <div className="actions">
                    <button type="button" onClick={() => playOneShot(id)}>
                      Afspil
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={async () => {
                        await copyText(buildCursorPrompt(id));
                        flashCopied(id);
                      }}
                    >
                      {copiedId === id ? 'Kopieret' : 'Kopiér Cursor-prompt'}
                    </button>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#7a8e9e' }}>
                    <strong>Kode:</strong> <span className="mono">{g.codePointer}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Loops &amp; stemning (ikke SoundId)</h2>
      <p className="lead" style={{ marginBottom: '0.75rem' }}>
        Disse styres af egne funktioner i <code>audioEngine.ts</code>, ikke <code>playSoundEffect</code>.
      </p>

      <div className="panel">
        <h3>{AMBIENT_LAB.ocean.label}</h3>
        <div className="row">
          <button type="button" onClick={toggleOcean}>
            {oceanOn ? 'Stop hav' : 'Start hav'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              await copyText(buildAmbientCursorPrompt('ocean'));
              flashCopied('ambient-ocean');
            }}
          >
            {copiedId === 'ambient-ocean' ? 'Kopieret' : 'Kopiér Cursor-prompt'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#8a9cad' }}>{AMBIENT_LAB.ocean.codePointer}</p>
      </div>

      <div className="panel">
        <h3>{AMBIENT_LAB.rain.label}</h3>
        <div className="row">
          <label>
            Styrke{' '}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={rain}
              onChange={(e) => onRainInput(Number(e.target.value))}
            />{' '}
            <span className="mono">{rain.toFixed(2)}</span>
          </label>
          <button type="button" className="secondary" onClick={() => onRainInput(0)}>
            Sluk (0)
          </button>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              await copyText(buildAmbientCursorPrompt('rain'));
              flashCopied('ambient-rain');
            }}
          >
            {copiedId === 'ambient-rain' ? 'Kopieret' : 'Kopiér Cursor-prompt'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#8a9cad' }}>{AMBIENT_LAB.rain.codePointer}</p>
      </div>

      <div className="panel">
        <h3>{AMBIENT_LAB.boss_drone.label}</h3>
        <div className="row">
          <button type="button" onClick={toggleBoss}>
            {bossOn ? 'Stop boss-dronen' : 'Start boss-dronen'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              await copyText(buildAmbientCursorPrompt('boss_drone'));
              flashCopied('ambient-boss');
            }}
          >
            {copiedId === 'ambient-boss' ? 'Kopieret' : 'Kopiér Cursor-prompt'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#8a9cad' }}>{AMBIENT_LAB.boss_drone.codePointer}</p>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#6a7d8e', marginTop: '2rem' }}>
        Kør fra repo-rod: <code className="mono">npm run dev:sound-lab</code> · port <code>5174</code> · afhænger af
        samme kode som spillet — når du ændrer <code>audioEngine.ts</code>, genindlæs lab for at høre det.
      </p>
    </>
  );
}
