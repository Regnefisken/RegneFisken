import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useAudio } from '../../audio/useAudio';

export function CompetitionTab() {
  const { play } = useAudio();
  const startedAt = useGameStore((s) => s.competitionStartedAt);
  const catches = useGameStore((s) => s.competitionCatches);
  const finished = useGameStore((s) => s.competitionFinished);
  const startCompetition = useGameStore((s) => s.startCompetition);
  const resetCompetition = useGameStore((s) => s.resetCompetition);

  const [timeStr, setTimeStr] = useState('30:00');

  useEffect(() => {
    if (!startedAt || finished) return;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setTimeStr(`${min}:${sec.toString().padStart(2, '0')}`);
      if (remaining <= 0) {
        useGameStore.getState().setCompetitionFinished(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [wrongCode, setWrongCode] = useState(false);

  const hasWinnerTrophy = usePlayerStore((s) => s.unlockedFurniture.includes('winner_trophy'));

  /** Gyldige præmiekoder — uafhængigt af om 30-min konkurrencen kører eller er nulstillet. */
  const WINNER_CODES = new Set(['6767', '676767']);

  function handleUnlock() {
    if (WINNER_CODES.has(password)) {
      play('legendary');
      usePlayerStore.getState().unlockFurniture('winner_trophy');
      useUIStore.getState().setToastMessage(
        '🏆🎉 Tillykke! Du er klassens fiskemester! Vindertrofæet hænger nu stolt over din kamin!',
      );
      setShowPasswordInput(false);
      setPassword('');
      setWrongCode(false);
    } else {
      setWrongCode(true);
      setPassword('');
    }
  }

  /** Inputfeltet er altid tomt i DOM (value=""), så cifre kan ikke markeres/afsløres — kun state indeholder koden. */
  function handleCodeChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setWrongCode(false);
    if (raw === '') {
      setPassword('');
      return;
    }
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    if (!digits) return;
    setPassword((prev) => {
      if (raw.length === 1 && digits.length === 1) {
        return (prev + digits).slice(0, 12);
      }
      return digits;
    });
  }

  function handleCodeKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnlock();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      setPassword((p) => p.slice(0, -1));
      setWrongCode(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900/90 to-blue-950/40 p-6 text-center">
        <h3 className="text-2xl font-black text-blue-300">🐟 Fiskekonkurrence</h3>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
        {!startedAt ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                play('ui');
                startCompetition();
              }}
              className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-bold text-white transition-all hover:bg-blue-500"
            >
              ▶ Start konkurrencen
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <span
                className={`text-5xl font-black tabular-nums ${
                  finished ? 'text-red-400' : 'text-blue-300'
                }`}
              >
                {finished ? '00:00' : timeStr}
              </span>
              {finished && (
                <p className="mt-2 text-lg font-bold text-red-400">⏰ Tiden er udløbet!</p>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-900/20 px-6 py-4">
              <span className="text-4xl font-black text-amber-300">{catches}</span>
              <p className="text-sm text-amber-400/70">
                {catches === 1 ? 'fangst' : 'fangster'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                play('ui');
                resetCompetition();
                setTimeStr('30:00');
              }}
              className="rounded-xl bg-slate-700 px-6 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-slate-600"
            >
              🔄 Afslut/nulstil konkurrence
            </button>
          </div>
        )}
      </div>

      {!hasWinnerTrophy && (
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-slate-900/90 to-yellow-950/20 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h4 className="font-bold text-yellow-300">Vindertrofæ</h4>
              <p className="text-xs text-slate-400">Er du den heldige vinder idag?!</p>
            </div>
          </div>

          {!showPasswordInput ? (
            <button
              type="button"
              onClick={() => {
                play('ui');
                setShowPasswordInput(true);
              }}
              className="w-full rounded-xl bg-yellow-700/40 px-4 py-3 text-sm font-bold text-yellow-300 transition-all hover:bg-yellow-700/60"
            >
              🔑 Indløs præmie
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="relative block min-h-[3rem] rounded-xl border border-slate-600 bg-slate-800 focus-within:border-yellow-500">
                <span className="sr-only">Vinderkode</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value=""
                  onChange={handleCodeChange}
                  onKeyDown={handleCodeKeyDown}
                  className="relative z-10 w-full rounded-xl bg-transparent px-4 py-3 text-center text-lg font-mono caret-yellow-300 focus:outline-none"
                  aria-describedby={wrongCode ? 'code-error' : undefined}
                  autoFocus
                />
                <span
                  className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center text-lg font-mono text-white"
                  aria-hidden
                >
                  {password.length > 0 ? '*'.repeat(password.length) : ''}
                </span>
                {password.length === 0 && (
                  <span className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-lg font-mono text-slate-500">
                    Indtast kode...
                  </span>
                )}
              </label>
              {wrongCode && (
                <p id="code-error" className="text-center text-sm text-red-400">
                  Forkert kode — prøv igen!
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                    setWrongCode(false);
                  }}
                  className="flex-1 rounded-xl bg-slate-700 py-2 text-sm font-bold text-slate-400 hover:bg-slate-600"
                >
                  Annuller
                </button>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="flex-1 rounded-xl bg-yellow-600 py-2 text-sm font-bold text-white hover:bg-yellow-500"
                >
                  🏆 Tag imod din præmie
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {hasWinnerTrophy && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-900/10 p-6 text-center">
          <span className="text-4xl">🏆</span>
          <p className="mt-2 font-bold text-yellow-300">Du er klassens fiskemester!</p>
          <p className="text-xs text-slate-400">Vindertrofæet hænger i din fiskehytte.</p>
        </div>
      )}
    </div>
  );
}
