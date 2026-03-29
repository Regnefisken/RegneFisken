import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/useAudio';
import { PARROT_JOKES } from '../../data/world';
import { shuffleParrotJokes } from '../../logic/parrot-jokes';
import { useCollectionStore } from '../../store/useCollectionStore';

/** Papegøje-dialog på molen — som legacy ~12633–12695. */
export function ParrotModal() {
  const { play } = useAudio();
  const showParrot = useCollectionStore((s) => s.showParrot);
  const setShowParrot = useCollectionStore((s) => s.setShowParrot);
  const parrotTypedText = useCollectionStore((s) => s.parrotTypedText);
  const setParrotTypedText = useCollectionStore((s) => s.setParrotTypedText);
  const parrotFullText = useCollectionStore((s) => s.parrotFullText);
  const setParrotFullText = useCollectionStore((s) => s.setParrotFullText);
  const parrotJokePhase = useCollectionStore((s) => s.parrotJokePhase);
  const setParrotJokePhase = useCollectionStore((s) => s.setParrotJokePhase);

  const shuffledRef = useRef<number[]>(shuffleParrotJokes(-1));
  const ptrRef = useRef(0);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!showParrot) {
      setParrotTypedText('');
      setParrotJokePhase('question');
      if (typeTimerRef.current) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
      return;
    }
    const idx = shuffledRef.current[ptrRef.current] ?? 0;
    const joke = PARROT_JOKES[idx];
    if (!joke) return;
    const full = joke.q;
    setParrotJokePhase('question');
    setParrotFullText(full);
    setParrotTypedText('');
    let i = 0;
    typeTimerRef.current = setInterval(() => {
      i += 1;
      setParrotTypedText(full.slice(0, i));
      if (i >= full.length && typeTimerRef.current) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
    }, 80);
    return () => {
      if (typeTimerRef.current) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
    };
  }, [showParrot, setParrotFullText, setParrotJokePhase, setParrotTypedText]);

  if (!showParrot) return null;

  const jokeIdx = shuffledRef.current[ptrRef.current] ?? 0;
  const joke = PARROT_JOKES[jokeIdx];
  if (!joke) return null;

  const isQuestion = parrotJokePhase === 'question';
  const typewriterDone = parrotTypedText.length >= parrotFullText.length;

  function closeParrot() {
    if (!isQuestion) {
      const currentIdx = shuffledRef.current[ptrRef.current] ?? 0;
      const nextPtr = ptrRef.current + 1;
      if (nextPtr >= shuffledRef.current.length) {
        shuffledRef.current = shuffleParrotJokes(currentIdx);
        ptrRef.current = 0;
      } else {
        ptrRef.current = nextPtr;
      }
    }
    setShowParrot(false);
  }

  function revealAnswer() {
    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current);
      typeTimerRef.current = null;
    }
    const full = joke.a;
    setParrotJokePhase('answer');
    setParrotFullText(full);
    setParrotTypedText('');
    let i = 0;
    typeTimerRef.current = setInterval(() => {
      i += 1;
      setParrotTypedText(full.slice(0, i));
      if (i >= full.length && typeTimerRef.current) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
    }, 80);
  }

  function nextJoke() {
    const currentIdx = shuffledRef.current[ptrRef.current] ?? 0;
    const nextPtr = ptrRef.current + 1;
    if (nextPtr >= shuffledRef.current.length) {
      shuffledRef.current = shuffleParrotJokes(currentIdx);
      ptrRef.current = 0;
    } else {
      ptrRef.current = nextPtr;
    }
    setShowParrot(false);
    window.setTimeout(() => setShowParrot(true), 50);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parrot-modal-title"
      className="pointer-events-auto fixed inset-0 z-[99997] flex items-end justify-center bg-black/60 pb-24 backdrop-blur-[6px]"
      style={{ WebkitBackdropFilter: 'blur(6px)' }}
      onClick={closeParrot}
      onKeyDown={(e) => e.key === 'Escape' && closeParrot()}
    >
      <div
        className="anim-slide-in-up w-[92%] max-w-[380px] rounded-3xl border-2 border-[rgba(52,211,153,0.4)] bg-[rgba(5,25,15,0.97)] p-7 text-left shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3.5">
          <div className="shrink-0 text-[2.5rem] leading-none">🦜</div>
          <div>
            <div
              id="parrot-modal-title"
              className="text-[0.7rem] font-black tracking-[0.15em] text-[#6ee7b7] uppercase"
            >
              Papegøjen
            </div>
            <div className="text-[0.7rem] text-[#34d399] opacity-70">
              {isQuestion ? 'Har en gåde til dig! SKAWK!' : 'Svaret er... SKAWK!'}
            </div>
          </div>
        </div>
        {!isQuestion && (
          <p className="mb-2 text-[0.88rem] leading-relaxed text-[#86efac] opacity-70">{joke.q}</p>
        )}
        <p className="mb-5 min-h-[3em] text-[1.05rem] leading-relaxed font-normal italic text-[#d1fae5]">
          {parrotTypedText}
          <span style={{ opacity: typewriterDone ? 0 : 1 }}>▌</span>
        </p>
        <div className="flex gap-2">
          {isQuestion && typewriterDone && (
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-xl border border-[rgba(52,211,153,0.5)] bg-[rgba(16,185,129,0.25)] py-2.5 text-[0.85rem] font-bold text-[#6ee7b7] animate-pulse"
              onClick={() => {
                play('ui');
                revealAnswer();
              }}
            >
              🤔 Vis svaret!
            </button>
          )}
          {!isQuestion && typewriterDone && (
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-xl border border-[rgba(52,211,153,0.5)] bg-[rgba(16,185,129,0.25)] py-2.5 text-[0.85rem] font-bold text-[#6ee7b7]"
              onClick={() => {
                play('ui');
                nextJoke();
              }}
            >
              🦜 Næste gåde!
            </button>
          )}
          <button
            type="button"
            className={`cursor-pointer rounded-xl border border-[rgba(52,211,153,0.2)] bg-[rgba(10,50,30,0.8)] py-2.5 text-[0.85rem] font-bold text-[#6ee7b7] ${
              isQuestion && !typewriterDone ? 'flex-1' : 'min-w-[4.5rem]'
            }`}
            onClick={() => {
              play('ui');
              closeParrot();
            }}
          >
            {isQuestion && !typewriterDone ? 'SKAWK! Luk' : 'Luk'}
          </button>
        </div>
      </div>
    </div>
  );
}
