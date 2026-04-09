import { useEffect } from 'react';
import { CATCH_MASTER_DATA } from '../../data/fish.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { EditorBodyControls } from './EditorBodyControls.js';
import { EditorColorControls } from './EditorColorControls.js';
import { EditorExport } from './EditorExport.js';
import { EditorFeatureToggles } from './EditorFeatureToggles.js';
import { EditorFishSelector } from './EditorFishSelector.js';
import { EditorEyeControls } from './EditorEyeControls.js';
import { EditorPatternControls } from './EditorPatternControls.js';
import { EditorMouthControls } from './EditorMouthControls.js';
import { EditorFinControls } from './EditorFinControls.js';
import { EditorExtremeControls } from './EditorExtremeControls.js';
import { EditorPartAdjuster } from './EditorPartAdjuster.js';

export function FishEditorPanel() {
  const isOpen = useEditorStore((s) => s.isOpen);
  const close = useEditorStore((s) => s.close);
  const mode = useEditorStore((s) => s.mode);
  const selectedFishId = useEditorStore((s) => s.selectedFishId);
  const resetConfig = useEditorStore((s) => s.resetConfig);
  const editorPreviewSwimAnimation = useEditorStore((s) => s.editorPreviewSwimAnimation);
  const setEditorPreviewSwimAnimation = useEditorStore((s) => s.setEditorPreviewSwimAnimation);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const titleName =
    mode === 'edit' && selectedFishId
      ? (CATCH_MASTER_DATA.find((c) => c.id === selectedFishId)?.name ?? selectedFishId)
      : mode === 'create'
        ? 'Ny fisk'
        : 'Fisk-editor';

  const subtitle =
    mode === 'edit' && selectedFishId ? selectedFishId : mode === 'create' ? 'Opret-mode' : 'Vælg en fisk';

  return (
    <aside
      className="fixed top-0 right-0 bottom-0 z-[99999] w-96 overflow-y-auto border-l border-gray-700 bg-gray-900/90 text-white shadow-2xl backdrop-blur-md"
      aria-label="Fish editor"
    >
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-gray-700 bg-gray-900/95 p-3 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold" title="Dev-only fisk-editor">
              Fisk-editor
            </h2>
            <p className="text-xs text-gray-400" title="Aktiv fisk eller tilstand">
              {titleName}
            </p>
            <p className="font-mono text-[10px] text-gray-500">{subtitle}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
              onClick={() => resetConfig()}
              title="Gendan original config (edit) eller standard (create)"
            >
              Nulstil
            </button>
            <button
              type="button"
              className="rounded bg-red-900/80 px-2 py-1 text-xs hover:bg-red-800"
              onClick={() => close()}
              title="Luk (Escape)"
            >
              ✕
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-500">
          Genvej: <kbd className="rounded bg-gray-800 px-1">Ctrl</kbd>+{' '}
          <kbd className="rounded bg-gray-800 px-1">Shift</kbd>+{' '}
          <kbd className="rounded bg-gray-800 px-1">E</kbd>
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-gray-300">
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={editorPreviewSwimAnimation}
            onChange={(e) => setEditorPreviewSwimAnimation(e.target.checked)}
            title="Svømme-animation i 3D-preview (som i spillet uden spand)"
          />
          Svømme-animation i preview
        </label>
      </header>

      <div className="flex flex-col gap-1 p-2">
        <details open className="rounded border border-gray-700/80 p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-200" title="Vælg fisk eller opret ny">
            {'Fisk & tilstand'}
          </summary>
          <EditorFishSelector />
        </details>

        <details open className="rounded border border-gray-700/80 p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-200" title="Krop, skala, hastighed, hale">
            Krop &amp; hale
          </summary>
          <EditorBodyControls />
        </details>

        <details open className="rounded border border-gray-700/80 p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-200" title="Farver og glød">
            Farver
          </summary>
          <EditorColorControls />
        </details>

        {import.meta.env.DEV && (
          <details open className="rounded border border-gray-700/80 p-2">
            <summary
              className="cursor-pointer text-sm font-medium text-gray-200"
              title="Øjestørrelse, pupilform, farver og placering"
            >
              Øjne (eyeConfig)
            </summary>
            <EditorEyeControls />
          </details>
        )}

        {import.meta.env.DEV && (
          <details open className="rounded border border-gray-700/80 p-2">
            <summary
              className="cursor-pointer text-sm font-medium text-gray-200"
              title="Procedurale kropsmønstre og densitet"
            >
              Mønster (bodyPattern)
            </summary>
            <EditorPatternControls />
          </details>
        )}

        {import.meta.env.DEV && (
          <details open className="rounded border border-gray-700/80 p-2">
            <summary
              className="cursor-pointer text-sm font-medium text-gray-200"
              title="Tænder, mundform og åbenhed"
            >
              Mund &amp; tænder
            </summary>
            <EditorMouthControls />
          </details>
        )}

        {import.meta.env.DEV && (
          <details open className="rounded border border-gray-700/80 p-2">
            <summary
              className="cursor-pointer text-sm font-medium text-gray-200"
              title="Rygfinne, hale-skala, sidefinner, bughfinner, fin-farve"
            >
              Finner &amp; hale (skala)
            </summary>
            <EditorFinControls />
          </details>
        )}

        {import.meta.env.DEV && (
          <details open className="rounded border border-gray-700/80 p-2">
            <summary
              className="cursor-pointer text-sm font-medium text-gray-200"
              title="Bioluminescens, elektricitet, puffer-pigge"
            >
              Extreme &amp; magi
            </summary>
            <EditorExtremeControls />
          </details>
        )}

        <details open className="rounded border border-gray-700/80 p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-200" title="Væsen-type, flag, materiale">
            Features &amp; materiale
          </summary>
          <EditorFeatureToggles />
        </details>

        <details open className="rounded border border-gray-700/80 p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-200" title="Juster enkelte dele (standard fisk)">
            Per-del justering
          </summary>
          <EditorPartAdjuster />
        </details>

        <details open className="rounded border border-gray-700/80 p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-200" title="Kopiér til udklipsholder">
            Eksport
          </summary>
          <EditorExport />
        </details>
      </div>
    </aside>
  );
}
