import { useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { COMPETITION_PRIZE_CODE_ENTRIES } from '../../data/competitionPrizeCodes.js';
import { addOneLevelFromTeacherOrAdmin, addThousandCoinsFromTeacherOrAdmin } from '../../logic/teacher-progression.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { TEACHER_DASH_CODE, useTeacherStore } from '../../store/useTeacherStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { useIsMobile } from '../../hooks/useIsMobile';

/**
 * Læreroversigt: kode 123123 (client-side, ikke sikker mod målbevidst elever).
 * Boosts persisteres ikke i save; session-kode holdes i sessionStorage.
 */
export function TeacherDashboardScreen() {
  const { play } = useAudio();
  const setShow = useUIStore((s) => s.setShowTeacherDashboard);
  const close = () => {
    play('ui');
    setShow(false);
  };

  const uiMode = useUIStore((s) => s.uiMode);
  const { isPortrait } = useIsMobile();
  const mobileLandscape = uiMode === 'mobile' && !isPortrait;

  const sessionUnlocked = useTeacherStore((s) => s.sessionUnlocked);
  const setSessionUnlocked = useTeacherStore((s) => s.setSessionUnlocked);
  const doubleCatchMoneyXp = useTeacherStore((s) => s.doubleCatchMoneyXp);
  const setDoubleCatchMoneyXp = useTeacherStore((s) => s.setDoubleCatchMoneyXp);
  const clearSessionUnlock = useTeacherStore((s) => s.clearSessionUnlock);

  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);
  const progression = usePlayerStore((s) => s.progression);
  const coins = usePlayerStore((s) => s.coins);

  function tryUnlock() {
    if (code === TEACHER_DASH_CODE) {
      play('win');
      setWrong(false);
      setSessionUnlocked(true);
      setCode('');
    } else {
      play('error');
      setWrong(true);
      setCode('');
    }
  }

  return (
    <div
      className={`pointer-events-auto fixed inset-0 z-[99998] flex justify-center bg-black/75 backdrop-blur-sm ${
        mobileLandscape ? 'items-center overflow-y-auto overscroll-y-contain p-4' : 'items-center'
      }`}
      onClick={close}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      role="presentation"
    >
      <div
        className={`panel-dark anim-zoom-in flex min-h-0 w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-emerald-800/50 shadow-2xl ${
          mobileLandscape
            ? 'h-[min(92dvh,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)]'
            : 'max-h-[min(680px,92dvh)]'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="teacher-dashboard-title"
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-2">
          <h2 id="teacher-dashboard-title" className="text-xl font-black text-emerald-300">
            Lærerdashboard
          </h2>
          <button
            type="button"
            onClick={close}
            className="panel-close-btn bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            ✕ Luk
          </button>
        </div>

        {!sessionUnlocked ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
            <p className="text-sm text-slate-400">Indtast læreradgangskode for at fortsætte.</p>
            <input
              type="password"
              autoComplete="off"
              value={code}
              onChange={(e) => {
                setWrong(false);
                setCode(e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
              placeholder="Kode"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-white placeholder-slate-500"
            />
            {wrong && <p className="text-sm text-red-400">Forkert kode.</p>}
            <button
              type="button"
              onClick={tryUnlock}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500"
            >
              Lås op
            </button>
            <p className="text-xs text-slate-500">
              Kode er kun skjult i brugergrænsefladen; den erstatter ikke server-side
              sikkerhed.
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
            <p className="text-sm text-slate-400">
              Status: level {progression.level} — {coins.toLocaleString('da-DK')} kr
            </p>

            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/60 p-4">
              <h3 className="mb-3 text-sm font-bold tracking-wide text-slate-300">Elevsession</h3>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-500"
                  checked={doubleCatchMoneyXp}
                  onChange={(e) => {
                    play('ui');
                    setDoubleCatchMoneyXp(e.target.checked);
                    useUIStore.getState().setToastMessage(
                      e.target.checked
                        ? '🎁 Boost: dobbelt penge & XP ved fangster (denne enhed, gemmes ikke i save)'
                        : 'Boost slået fra',
                    );
                  }}
                />
                <span className="text-sm text-slate-200">
                  Dobbelt penge og XP ved fangster (dette spil, ikke i save)
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/60 p-4">
              <h3 className="mb-3 text-sm font-bold tracking-wide text-slate-300">Hurtig hjælp</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-500"
                  onClick={() => {
                    play('ui');
                    addOneLevelFromTeacherOrAdmin();
                    useUIStore.getState().setToastMessage('+1 level (lærer)');
                  }}
                >
                  +1 level
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-500"
                  onClick={() => {
                    play('ui');
                    addThousandCoinsFromTeacherOrAdmin();
                    useUIStore.getState().setToastMessage('+1.000 kr (lærer)');
                  }}
                >
                  +1.000 kr
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/60 p-4">
              <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-300">
                Præmiekoder (fiskekonkurrence)
              </h3>
              <p className="mb-3 text-xs text-slate-500">Gyldige koder, som eleverne kan indløse under Mål.</p>
              <ul className="space-y-3 text-sm text-slate-200">
                {COMPETITION_PRIZE_CODE_ENTRIES.map((e) => (
                  <li key={e.shortLabel} className="border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-emerald-200">{e.shortLabel}</div>
                    <div className="text-xs text-slate-400">Kode: {e.codes.join(' · ')}</div>
                    {e.reward.type === 'podium' && (
                      <div className="mt-0.5 text-xs font-medium text-amber-200/90">
                        Indløses som: +{e.reward.coins.toLocaleString('da-DK')} kr + trofæ (
                        {e.reward.furnitureId === 'winner_trophy_gold'
                          ? 'guld'
                          : e.reward.furnitureId === 'winner_trophy_silver'
                            ? 'sølv'
                            : 'bronze'}
                        )
                      </div>
                    )}
                    <div className="mt-1 text-slate-300">{e.description}</div>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                play('ui');
                clearSessionUnlock();
                setWrong(false);
                setCode('');
              }}
              className="text-sm text-slate-500 underline hover:text-slate-300"
            >
              Lås læreradgang igen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
