import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { autoDetectGraphics, EXPOSURE_FOR_TIER } from '../../logic/auto-detect-graphics.js';
import { fpsMon } from '../../logic/fps-monitor.js';
import type { ColorBlindMode } from '../../store/useUIStore';
import type { GraphicsQuality } from '../../types/game';
import { useUIStore } from '../../store/useUIStore';

/** Legacy: legacy-game.html showScreenSettings modal (~13080–13156) — samme sektioner og inline-styles. */
export function ScreenSettings() {
  const { play } = useAudio();
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);
  const uiMode = useUIStore((s) => s.uiMode);
  const setUiMode = useUIStore((s) => s.setUiMode);
  const fontSize = useUIStore((s) => s.fontSize);
  const setFontSize = useUIStore((s) => s.setFontSize);
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useUIStore((s) => s.setGraphicsQuality);
  const pmremExposure = useUIStore((s) => s.pmremExposure);
  const setPmremExposure = useUIStore((s) => s.setPmremExposure);
  const skyExposure = useUIStore((s) => s.skyExposure);
  const setSkyExposure = useUIStore((s) => s.setSkyExposure);
  const reducedMotion = useUIStore((s) => s.reducedMotion);
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);
  const setAutoQualityEnabled = useUIStore((s) => s.setAutoQualityEnabled);
  const ultraBloomEnabled = useUIStore((s) => s.ultraBloomEnabled);
  const setUltraBloomEnabled = useUIStore((s) => s.setUltraBloomEnabled);
  const showInGameFps = useUIStore((s) => s.showInGameFps);
  const setShowInGameFps = useUIStore((s) => s.setShowInGameFps);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const highContrast = useUIStore((s) => s.highContrast);
  const setHighContrast = useUIStore((s) => s.setHighContrast);
  const colorBlindMode = useUIStore((s) => s.colorBlindMode);
  const setColorBlindMode = useUIStore((s) => s.setColorBlindMode);

  function closeWithSound() {
    play('ui');
    setShowScreenSettings(false);
  }

  const [fpsDisplay, setFpsDisplay] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        play('ui');
        setShowScreenSettings(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [play, setShowScreenSettings]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFpsDisplay(Math.round(fpsMon.getAverageFps()));
    }, 500);
    return () => clearInterval(id);
  }, []);

  function syncPmremWindow(v: number) {
    setPmremExposure(v);
    if (typeof window !== 'undefined') {
      (window as unknown as { pmremExposure?: number }).pmremExposure = v;
    }
  }

  const panelStyle: CSSProperties = {
    background: 'rgba(15,23,42,0.98)',
    border: '2px solid rgba(56,189,248,0.25)',
    borderRadius: '1.75rem',
    padding: '2rem',
    maxWidth: '26rem',
    width: '92%',
    maxHeight: '88dvh',
    overflowY: 'auto',
    boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
    animation: 'zoomIn 0.2s ease-out forwards',
  };

  const recommendedMaxPmrem =
    graphicsQuality === 'low' ? 0.7 : graphicsQuality === 'medium' ? 0.9 : 1.2;

  const gfxOptions: { val: GraphicsQuality; label: string; c: string }[] = [
    { val: 'low', label: 'Lav', c: '#f87171' },
    { val: 'medium', label: 'Mellem', c: '#fbbf24' },
    { val: 'high', label: 'Høj', c: '#34d399' },
    { val: 'ultra', label: 'Ultra ✨', c: '#a78bfa' },
  ];

  const cbOptions: { val: ColorBlindMode; label: string; icon: string }[] = [
    { val: 'none', label: 'Ingen', icon: '✅' },
    { val: 'deuteranopia', label: 'Deuteranopi', icon: '🔴' },
    { val: 'protanopia', label: 'Protanopi', icon: '🟢' },
    { val: 'tritanopia', label: 'Tritanopi', icon: '🔵' },
  ];

  return (
    <div
      className="screen-settings-legacy-scroll pointer-events-auto"
      role="dialog"
      aria-modal
      aria-labelledby="screen-settings-title"
      style={panelStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '1rem',
        }}
      >
        <h3
          id="screen-settings-title"
          style={{
            color: 'white',
            fontWeight: 900,
            fontSize: '1.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
          }}
        >
          🖥️ Skærmindstillinger
        </h3>
        <button
          type="button"
          onClick={closeWithSound}
          className="touch-manipulation"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '1.5rem',
            cursor: 'pointer',
            lineHeight: 1,
            minWidth: 44,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Luk"
        >
          ✕
        </button>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem', marginTop: 0 }}>Layout:</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setUiMode('desktop');
          }}
          className="touch-manipulation"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            minHeight: 44,
            padding: '1.1rem 0.5rem',
            borderRadius: '1rem',
            border: uiMode === 'desktop' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
            background: uiMode === 'desktop' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🖥️</span>
          <span
            style={{
              color: uiMode === 'desktop' ? '#e0f2fe' : '#94a3b8',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            Stor skærm
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setUiMode('mobile');
          }}
          className="touch-manipulation"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            minHeight: 44,
            padding: '1.1rem 0.5rem',
            borderRadius: '1rem',
            border: uiMode === 'mobile' ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
            background: uiMode === 'mobile' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🎒</span>
          <span
            style={{
              color: uiMode === 'mobile' ? '#d1fae5' : '#94a3b8',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            Lille skærm
          </span>
        </button>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: 0 }}>🔤 Tekststørrelse:</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
          marginBottom: '1.25rem',
        }}
      >
        {(
          [
            { val: 70, label: 'Mikro', s: 10 },
            { val: 85, label: 'Lille', s: 13 },
            { val: 100, label: 'Standard', s: 16 },
            { val: 125, label: 'Stor', s: 20 },
          ] as const
        ).map(({ val, label, s }) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              play('ui');
              setFontSize(val);
            }}
            className="touch-manipulation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: 44,
              padding: '0.6rem 0.75rem',
              borderRadius: '0.875rem',
              border: fontSize === val ? '2px solid #818cf8' : '1px solid rgba(51,65,85,0.6)',
              background: fontSize === val ? 'rgba(99,102,241,0.18)' : 'rgba(30,41,59,0.5)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontSize: s,
                fontWeight: 900,
                color: fontSize === val ? '#c4b5fd' : '#64748b',
                width: 18,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              A
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.8rem',
                color: fontSize === val ? '#c4b5fd' : '#94a3b8',
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: 0 }}>🎨 3D Grafik:</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {gfxOptions.map(({ val, label, c }) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              play('ui');
              setGraphicsQuality(val);
              setAutoQualityEnabled(false);
            }}
            className="touch-manipulation"
            style={{
              flex: 1,
              minHeight: 44,
              padding: '0.65rem 0',
              borderRadius: '0.875rem',
              border: graphicsQuality === val ? `2px solid ${c}` : '1px solid rgba(51,65,85,0.6)',
              background: graphicsQuality === val ? 'rgba(52,211,153,0.12)' : 'rgba(30,41,59,0.5)',
              color: graphicsQuality === val ? c : '#64748b',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {graphicsQuality === 'ultra' ? (
        <div style={{ marginBottom: '0.85rem' }}>
          <label
            className="touch-manipulation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={ultraBloomEnabled}
              onChange={(e) => {
                play('ui');
                setUltraBloomEnabled(e.target.checked);
              }}
              style={{ width: '1.1rem', height: '1.1rem', accentColor: '#a78bfa', cursor: 'pointer' }}
            />
            ✨ Bloom (udendørs)
          </label>
          <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '0.35rem 0 0 1.6rem', lineHeight: 1.35 }}>
            I fiskehytten er bloom altid fra (undgår artefakter ved vinduet).
          </p>
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginTop: 0,
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            color: '#94a3b8',
            fontSize: '0.75rem',
            margin: 0,
            fontFamily: 'monospace',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          ⚡ {fpsDisplay} FPS <span style={{ color: '#64748b' }}>(gennemsnit)</span>
        </p>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setShowInGameFps(!showInGameFps);
          }}
          className="touch-manipulation shrink-0"
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '0.65rem',
            border: showInGameFps ? '1px solid rgba(56,189,248,0.45)' : '1px solid rgba(51,65,85,0.7)',
            background: showInGameFps ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.55)',
            color: showInGameFps ? '#e0f2fe' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.7rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {showInGameFps ? 'FPS i spil: til' : 'FPS i spil: fra'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          play('ui');
          localStorage.removeItem('regnefisken_gpu_bench');
          const result = autoDetectGraphics();
          useUIStore.getState().setGraphicsQuality(result.quality);
          useUIStore.getState().setPmremExposure(result.exposure);
          useUIStore.getState().setAutoQualityEnabled(true);
          if (typeof window !== 'undefined') {
            (window as unknown as { pmremExposure?: number }).pmremExposure = result.exposure;
          }
          setToastMessage(`Grafik testet: ${result.quality} (score: ${result.hwScore})`);
        }}
        className="touch-manipulation"
        style={{
          width: '100%',
          padding: '0.55rem',
          borderRadius: '0.875rem',
          border: '1px solid rgba(51,65,85,0.6)',
          background: 'rgba(30,41,59,0.5)',
          color: '#94a3b8',
          fontWeight: 600,
          fontSize: '0.75rem',
          cursor: 'pointer',
          marginBottom: '1.25rem',
        }}
      >
        🔄 Test grafik igen
      </button>

      <button
        type="button"
        onClick={() => {
          play('ui');
          const pm = EXPOSURE_FOR_TIER[graphicsQuality];
          syncPmremWindow(pm);
          setSkyExposure(0.4);
          const tierLabel = gfxOptions.find((o) => o.val === graphicsQuality)?.label ?? graphicsQuality;
          setToastMessage(`Anbefalet exposure: PMREM ${pm.toFixed(2)}, himmel 0.40 (${tierLabel})`);
        }}
        className="touch-manipulation"
        style={{
          width: '100%',
          padding: '0.55rem',
          borderRadius: '0.875rem',
          border: '1px solid rgba(56,189,248,0.25)',
          background: 'rgba(56,189,248,0.08)',
          color: '#bae6fd',
          fontWeight: 600,
          fontSize: '0.75rem',
          cursor: 'pointer',
          marginBottom: '1.25rem',
        }}
      >
        ✨ Anbefalet exposure
      </button>

      <div className="screen-settings-range-row" style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem',
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>💡 PMREM Exposure</p>
          <span
            style={{
              color: '#e0f2fe',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              background: 'rgba(56,189,248,0.12)',
              padding: '0.15rem 0.5rem',
              borderRadius: '0.5rem',
            }}
          >
            {pmremExposure.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0.2}
          max={1.2}
          step={0.05}
          value={pmremExposure}
          onChange={(e) => {
            syncPmremWindow(parseFloat(e.target.value));
          }}
          style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          aria-valuemin={0.2}
          aria-valuemax={1.2}
          aria-valuenow={pmremExposure}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#475569',
            fontSize: '0.7rem',
            marginTop: '0.2rem',
          }}
        >
          <span>0.20</span>
          <span>1.20</span>
        </div>
        {pmremExposure > recommendedMaxPmrem && (
          <p style={{ color: '#f59e0b', fontSize: '0.7rem', marginTop: '0.3rem' }}>
            ⚠️ Høj exposure kan påvirke ydelsen på din valgte grafikkvalitet
          </p>
        )}
      </div>

      <div className="screen-settings-range-row" style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem',
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>🌅 Himmel Exposure</p>
          <span
            style={{
              color: '#e0f2fe',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              background: 'rgba(56,189,248,0.12)',
              padding: '0.15rem 0.5rem',
              borderRadius: '0.5rem',
            }}
          >
            {skyExposure.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={skyExposure}
          onChange={(e) => setSkyExposure(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
          aria-valuemin={0.1}
          aria-valuemax={1.0}
          aria-valuenow={skyExposure}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#475569',
            fontSize: '0.7rem',
            marginTop: '0.2rem',
          }}
        >
          <span>0.10</span>
          <span>1.00</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setReducedMotion(!reducedMotion);
          }}
          className="touch-manipulation"
          style={{
            flex: 1,
            minHeight: 44,
            padding: '0.75rem',
            borderRadius: '1rem',
            border: !reducedMotion ? '2px solid #0ea5e9' : '1px solid rgba(51,65,85,0.6)',
            background: !reducedMotion ? 'rgba(14,165,233,0.15)' : 'rgba(30,41,59,0.5)',
            color: !reducedMotion ? '#7dd3fc' : '#64748b',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          ✨ {reducedMotion ? 'Animationer: FRA' : 'Animationer: TIL'}
        </button>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setHighContrast(!highContrast);
          }}
          className="touch-manipulation"
          style={{
            flex: 1,
            minHeight: 44,
            padding: '0.75rem',
            borderRadius: '1rem',
            border: highContrast ? '2px solid #eab308' : '1px solid rgba(51,65,85,0.6)',
            background: highContrast ? 'rgba(234,179,8,0.15)' : 'rgba(30,41,59,0.5)',
            color: highContrast ? '#fde68a' : '#64748b',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          🔆 {highContrast ? 'Kontrast: HØJ' : 'Kontrast: Normal'}
        </button>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: 0 }}>👁️ Farveblindhed:</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
          marginBottom: '1.25rem',
        }}
      >
        {cbOptions.map(({ val, label, icon }) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              play('ui');
              setColorBlindMode(val);
            }}
            className="touch-manipulation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              minHeight: 44,
              padding: '0.6rem 0.75rem',
              borderRadius: '0.875rem',
              border: colorBlindMode === val ? '2px solid #818cf8' : '1px solid rgba(51,65,85,0.6)',
              background: colorBlindMode === val ? 'rgba(99,102,241,0.18)' : 'rgba(30,41,59,0.5)',
              color: colorBlindMode === val ? '#c4b5fd' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={closeWithSound}
        className="touch-manipulation"
        style={{
          width: '100%',
          minHeight: 44,
          padding: '0.85rem',
          borderRadius: '0.875rem',
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#cbd5e1',
          fontWeight: 700,
          fontSize: '0.95rem',
          cursor: 'pointer',
        }}
      >
        Luk
      </button>
    </div>
  );
}
