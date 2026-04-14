import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAudio } from '../../audio/useAudio';
import { getBucketTier } from '../../data/equipment';
import { STREAK_EXCEPTION_TYPES, TRUE_BOSS_ITEM_TYPES } from '../../data/combat';
import { ENRICHED_CATCH_DATA } from '../../data/enrichment';
import { makeId } from '../../logic/catch-engine';
import { inventoryBucketCount } from '../../logic/bucket-inventory';
import { EMOJI_SIZES, generateMathProblem } from '../../logic/math-engine';
import { applyXP, calculateStreakBonus, xpForCatch } from '../../logic/xp-engine';
import type { RollCatchResult } from '../../types/fish';
import type { FarvandId, MathProblem } from '../../types/math';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useUIStore } from '../../store/useUIStore';
import { markSoeuhyreCaughtThisVisit } from '../../three/soeuhyre-ambient-flags.js';
import { NumberPad } from '../mobile/NumberPad';
import type {
  EmojiAntalData,
  EmojiChoiceData,
  EmojiData,
  EmojiEqualizeData,
  EmojiEvenOddData,
  EmojiFractionData,
  EmojiHalvdelData,
  EmojiPatternData,
  EmojiPercentData,
  EmojiSizeData,
  EmojiSortData,
} from '../../types/math';

function problemTypeBadgeLabel(p: MathProblem): string | null {
  switch (p.category) {
    case 'basic':
      return null;
    case 'tenfriends':
      return "🎯 10'er-venner";
    case '100friends':
      return "🎯 100'er-venner";
    case 'skaeve100friends':
      return "🎯 Skæve 100'er-venner";
    case 'equations':
      return '🔤 Ligninger';
    case 'multi-term':
      return '📐 Flere led';
    case 'decimals':
      return '🔬 Decimaler';
    case 'regnehistorier':
      return '📖 Regnehistorier';
    case 'lette-historier':
      return '📖 Lette historier';
    case 'emoji-antal':
      return '🔢 Antal';
    case 'emoji-counting':
      return '🎯 Emoji-tælling';
    case 'emoji-most-least':
      return '⚖️ Flest / færrest';
    case 'emoji-size-compare':
      return '🔍 Størst / mindst';
    case 'emoji-half':
      return '✂️ Find halvdelen';
    case 'emoji-double':
      return '🔄 Det dobbelte';
    case 'emoji-even-odd':
      return '🎲 Lige / ulige';
    case 'emoji-pattern':
      return '🔮 Mønster';
    case 'emoji-sort':
      return '📊 Sorter';
    case 'emoji-equalize':
      return '⚖️ Samme antal';
    case 'emoji-fraction':
      return '🍕 Brøkdele';
    case 'emoji-percent':
      return '📈 Procentdel';
    default:
      return null;
  }
}

function problemTypeBadgeIsGreen(p: MathProblem): boolean {
  return (
    p.category === 'tenfriends' ||
    p.category === '100friends' ||
    p.category === 'skaeve100friends'
  );
}

function EmojiMostLeastPanel({
  data,
  revealingAnswer,
  zenMode,
  clickRevealData,
  onChoose,
}: {
  data: EmojiChoiceData;
  revealingAnswer: boolean;
  zenMode: boolean;
  clickRevealData: { correctSide: 'left' | 'right' } | undefined;
  onChoose: (side: 'left' | 'right') => void;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div
        className={`text-center text-2xl font-bold ${
          data.mode === 'most' ? 'text-emerald-400' : 'text-amber-400'
        }`}
      >
        {data.mode === 'most' ? 'Tryk på den med FLEST!' : 'Tryk på den med FÆRREST!'}
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => onChoose('left')}
          className={`touch-manipulation flex min-h-[5rem] min-w-[100px] max-w-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 px-3 py-3 transition-all hover:border-cyan-300/80 hover:bg-cyan-800/40 active:scale-95 ${
            revealingAnswer && zenMode && clickRevealData?.correctSide === 'left'
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          <div className="flex max-w-[160px] flex-wrap justify-center gap-1">
            {Array.from({ length: data.leftCount }).map((_, i) => (
              <span key={`ml-${i}`} className="text-2xl leading-none">
                {data.leftEmoji}
              </span>
            ))}
          </div>
        </button>
        <span className="text-lg font-bold text-white/70">eller</span>
        <button
          type="button"
          onClick={() => onChoose('right')}
          className={`touch-manipulation flex min-h-[5rem] min-w-[100px] max-w-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 px-3 py-3 transition-all hover:border-cyan-300/80 hover:bg-cyan-800/40 active:scale-95 ${
            revealingAnswer && zenMode && clickRevealData?.correctSide === 'right'
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          <div className="flex max-w-[160px] flex-wrap justify-center gap-1">
            {Array.from({ length: data.rightCount }).map((_, i) => (
              <span key={`mr-${i}`} className="text-2xl leading-none">
                {data.rightEmoji}
              </span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}

function EmojiSizeComparePanel({
  data,
  revealingAnswer,
  zenMode,
  clickRevealData,
  onChoose,
}: {
  data: EmojiSizeData;
  revealingAnswer: boolean;
  zenMode: boolean;
  clickRevealData: { correctSide: 'left' | 'right' } | undefined;
  onChoose: (side: 'left' | 'right') => void;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div
        className={`text-center text-2xl font-bold ${
          data.mode === 'biggest' ? 'text-emerald-400' : 'text-amber-400'
        }`}
      >
        {data.mode === 'biggest' ? '🔍 Tryk på de STØRSTE!' : '🔍 Tryk på de MINDSTE!'}
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => onChoose('left')}
          className={`touch-manipulation flex min-h-[5rem] min-w-[100px] max-w-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-400/50 bg-purple-900/20 px-3 py-3 transition-all hover:border-purple-300/80 hover:bg-purple-800/40 active:scale-95 ${
            revealingAnswer && zenMode && clickRevealData?.correctSide === 'left'
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          <div className="flex max-w-[180px] flex-wrap justify-center gap-1">
            {Array.from({ length: data.leftCount }).map((_, i) => (
              <span
                key={`sl-${i}`}
                className="leading-none"
                style={{ fontSize: EMOJI_SIZES[data.leftSize].fontSize }}
              >
                {data.emoji}
              </span>
            ))}
          </div>
        </button>
        <span className="text-lg font-bold text-white/70">eller</span>
        <button
          type="button"
          onClick={() => onChoose('right')}
          className={`touch-manipulation flex min-h-[5rem] min-w-[100px] max-w-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-400/50 bg-purple-900/20 px-3 py-3 transition-all hover:border-purple-300/80 hover:bg-purple-800/40 active:scale-95 ${
            revealingAnswer && zenMode && clickRevealData?.correctSide === 'right'
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          <div className="flex max-w-[180px] flex-wrap justify-center gap-1">
            {Array.from({ length: data.rightCount }).map((_, i) => (
              <span
                key={`sr-${i}`}
                className="leading-none"
                style={{ fontSize: EMOJI_SIZES[data.rightSize].fontSize }}
              >
                {data.emoji}
              </span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}

function EmojiAntalPanel({ data }: { data: EmojiAntalData }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">Hvor mange er der?</div>
      <div className="max-w-[280px] rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: data.count }).map((_, i) => (
            <span key={`ea-${i}`} className="text-2xl leading-none">
              {data.emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmojiBox({ emoji, count, keyPrefix }: { emoji: string; count: number; keyPrefix: string }) {
  const cols = Math.min(count, 5);
  return (
    <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-3">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <span key={`${keyPrefix}-${i}`} className="text-2xl leading-none">
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmojiCountingPanel({ data }: { data: EmojiData }) {
  const opSymbol =
    data.operator === '*' ? '×' : data.operator === '/' ? '÷' : data.operator === '-' ? '−' : '+';
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        <EmojiBox emoji={data.emoji} count={data.leftCount} keyPrefix="ec-l" />
        <span className="text-4xl font-bold text-white/90">{opSymbol}</span>
        <EmojiBox emoji={data.emoji} count={data.rightCount} keyPrefix="ec-r" />
        <span className="text-4xl font-bold text-white/90">=</span>
      </div>
    </div>
  );
}

function EmojiHalvdelPanel({ data }: { data: EmojiHalvdelData }) {
  const isHalf = data.mode === 'half';
  const cols = Math.min(data.count, 5);
  const halfCount = data.count / 2;

  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">
        {isHalf ? '✂️ Hvor mange er halvdelen?' : '🔄 Hvor mange er det dobbelte?'}
      </div>
      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        {isHalf ? (
          <div className="flex flex-col items-center gap-0">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${halfCount}, min-content)` }}
            >
              {Array.from({ length: halfCount }).map((_, i) => (
                <span key={`h-top-${i}`} className="text-2xl leading-none">
                  {data.emoji}
                </span>
              ))}
            </div>
            <div className="my-1.5 w-full border-t-2 border-dashed border-white/30" />
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${halfCount}, min-content)` }}
            >
              {Array.from({ length: halfCount }).map((_, i) => (
                <span key={`h-bot-${i}`} className="text-2xl leading-none">
                  {data.emoji}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
          >
            {Array.from({ length: data.count }).map((_, i) => (
              <span key={`dbl-${i}`} className="text-2xl leading-none">
                {data.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-sm text-white/50">({data.count} stk i alt)</div>
    </div>
  );
}

function EmojiEvenOddPanel({
  data,
  revealingAnswer,
  zenMode,
  onChoose,
}: {
  data: EmojiEvenOddData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onChoose: (choice: 'even' | 'odd') => void;
}) {
  const rows = Math.ceil(data.count / 2);
  const hasLeftover = data.count % 2 !== 0;

  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className="text-center text-xl font-bold text-cyan-300">🎲 Er antallet lige eller ulige?</div>

      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="flex flex-col items-center gap-1">
          {Array.from({ length: rows }).map((_, row) => {
            const isLastRow = row === rows - 1 && hasLeftover;
            return (
              <div key={`row-${row}`} className="flex gap-3">
                <span className="text-2xl leading-none">{data.emoji}</span>
                {!isLastRow && <span className="text-2xl leading-none">{data.emoji}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-white/50">({data.count} stk)</div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChoose('even')}
          className={`touch-manipulation rounded-2xl border-2 border-emerald-400/50 bg-emerald-900/30 px-8 py-4 text-xl font-black text-emerald-300 transition-all hover:bg-emerald-800/50 active:scale-95 ${
            revealingAnswer && zenMode && data.isEven
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          Lige
        </button>
        <button
          type="button"
          onClick={() => onChoose('odd')}
          className={`touch-manipulation rounded-2xl border-2 border-amber-400/50 bg-amber-900/30 px-8 py-4 text-xl font-black text-amber-300 transition-all hover:bg-amber-800/50 active:scale-95 ${
            revealingAnswer && zenMode && !data.isEven
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          Ulige
        </button>
      </div>
    </div>
  );
}

function EmojiPatternPanel({
  data,
  revealingAnswer,
  zenMode,
  onChoose,
}: {
  data: EmojiPatternData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onChoose: (emoji: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className="text-center text-xl font-bold text-cyan-300">🔮 Hvad kommer nu?</div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 px-4 py-3">
        {data.sequence.map((emoji, i) => (
          <span key={`seq-${i}`} className="text-2xl leading-none">
            {emoji}
          </span>
        ))}
        <span className="ml-1 text-3xl font-black leading-none text-amber-400">?</span>
      </div>

      <div className="flex gap-3">
        {data.choices.map((emoji, i) => (
          <button
            key={`choice-${i}`}
            type="button"
            onClick={() => onChoose(emoji)}
            className={`touch-manipulation rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 px-5 py-3 text-3xl transition-all hover:border-cyan-300/80 hover:bg-cyan-800/40 active:scale-95 ${
              revealingAnswer && zenMode && emoji === data.correctNext
                ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
                : ''
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmojiSortPanel({
  data,
  revealingAnswer,
  onComplete,
  onWrong,
}: {
  data: EmojiSortData;
  revealingAnswer: boolean;
  onComplete: () => void;
  onWrong: () => void;
}) {
  const [clickedIndices, setClickedIndices] = useState<number[]>([]);

  useEffect(() => {
    setClickedIndices([]);
  }, [data]);

  function handleBoxClick(boxIndex: number) {
    if (revealingAnswer) return;
    if (clickedIndices.includes(boxIndex)) return;

    const nextStep = clickedIndices.length;
    const expectedIndex = data.correctOrder[nextStep];

    if (boxIndex === expectedIndex) {
      const newClicked = [...clickedIndices, boxIndex];
      setClickedIndices(newClicked);

      if (newClicked.length === 3) {
        onComplete();
      }
    } else {
      onWrong();
    }
  }

  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div
        className={`text-center text-xl font-bold ${
          data.mode === 'asc' ? 'text-emerald-400' : 'text-amber-400'
        }`}
      >
        📊{' '}
        {data.mode === 'asc'
          ? 'Tryk i rækkefølge: færrest → flest!'
          : 'Tryk i rækkefølge: flest → færrest!'}
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((step) => (
          <div
            key={step}
            className={`h-3 w-8 rounded-full transition-all ${
              step < clickedIndices.length
                ? 'bg-green-400'
                : step === clickedIndices.length
                  ? 'animate-pulse bg-amber-400'
                  : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {data.boxes.map((box, i) => {
          const alreadyClicked = clickedIndices.includes(i);
          const clickOrder = clickedIndices.indexOf(i);
          const cols = Math.min(box.count, 5);

          return (
            <button
              key={`sort-box-${i}`}
              type="button"
              onClick={() => handleBoxClick(i)}
              disabled={alreadyClicked}
              className={`touch-manipulation flex min-h-[5rem] min-w-[80px] max-w-[160px] flex-col items-center justify-center rounded-xl border-2 px-3 py-3 transition-all active:scale-95 ${
                alreadyClicked
                  ? 'border-green-400 bg-green-900/30 ring-2 ring-green-400/60'
                  : 'cursor-pointer border-dashed border-cyan-400/50 bg-cyan-900/20 hover:border-cyan-300/80 hover:bg-cyan-800/40'
              }`}
            >
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
              >
                {Array.from({ length: box.count }).map((_, j) => (
                  <span key={`sb-${i}-${j}`} className="text-2xl leading-none">
                    {box.emoji}
                  </span>
                ))}
              </div>
              {alreadyClicked && (
                <div className="mt-1 text-xs font-bold text-green-400">{clickOrder + 1}.</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmojiEqualizePanel({ data }: { data: EmojiEqualizeData }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">
        ⚖️ Hvor mange mangler, så der er lige mange?
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <EmojiBox emoji={data.emoji} count={data.leftCount} keyPrefix="eq-l" />
        <span className="text-2xl font-bold text-white/70">og</span>
        <EmojiBox emoji={data.emoji} count={data.rightCount} keyPrefix="eq-r" />
      </div>
    </div>
  );
}

function EmojiFractionPanel({
  data,
  revealingAnswer,
  zenMode,
  onChoose,
}: {
  data: EmojiFractionData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onChoose: (fraction: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className="text-center text-xl font-bold text-cyan-300">🍕 Hvor stor en del er fremhævet?</div>

      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const isHighlighted = i < data.highlighted;
            return (
              <span
                key={`frac-${i}`}
                className={`flex items-center justify-center rounded-lg text-2xl leading-none transition-all ${
                  isHighlighted
                    ? 'scale-110 ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent'
                    : 'opacity-40'
                }`}
                style={{ width: '2.5rem', height: '2.5rem' }}
              >
                {data.emoji}
              </span>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-white/50">
        {data.highlighted} ud af {data.total}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {data.choices.map((fraction, i) => (
          <button
            key={`fc-${i}`}
            type="button"
            onClick={() => onChoose(fraction)}
            className={`touch-manipulation rounded-xl border-2 border-dashed border-indigo-400/50 bg-indigo-900/20 px-5 py-3 text-xl font-black text-indigo-200 transition-all hover:border-indigo-300/80 hover:bg-indigo-800/40 active:scale-95 ${
              revealingAnswer && zenMode && fraction === data.correctFraction
                ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
                : ''
            }`}
          >
            {fraction}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmojiPercentPanel({ data }: { data: EmojiPercentData }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">📈 Hvor mange procent er fremhævet?</div>

      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const isHighlighted = i < data.highlighted;
            return (
              <span
                key={`pct-${i}`}
                className={`flex items-center justify-center rounded-lg text-2xl leading-none transition-all ${
                  isHighlighted
                    ? 'scale-110 ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent'
                    : 'opacity-40'
                }`}
                style={{ width: '2.5rem', height: '2.5rem' }}
              >
                {data.emoji}
              </span>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-white/50">
        {data.highlighted} ud af {data.total}
      </div>
    </div>
  );
}

function numericAnswerOk(user: string, expected: number): boolean {
  const n = Number(String(user).trim().replace(',', '.'));
  if (Number.isNaN(n)) return false;
  return Math.abs(n - expected) < 0.001;
}

export function MathChallenge() {
  const { play, startBossAmbience, stopBossAmbience } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const weatherType = useGameStore((s) => s.weatherType);

  const hookedFish = useFishingStore((s) => s.hookedFish);
  const fightStages = useFishingStore((s) => s.fightStages);
  const setFightStages = useFishingStore((s) => s.setFightStages);
  const setHookedFish = useFishingStore((s) => s.setHookedFish);
  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const setCurrentStreak = useFishingStore((s) => s.setCurrentStreak);
  const setStreakMilestoneToast = useFishingStore((s) => s.setStreakMilestoneToast);
  const setLastWasTrueBoss = useFishingStore((s) => s.setLastWasTrueBoss);
  const monkeyHelpsThisRound = useFishingStore((s) => s.monkeyHelpsThisRound);
  const setMonkeyHelpsThisRound = useFishingStore((s) => s.setMonkeyHelpsThisRound);
  const showMonkeyBubble = useCollectionStore((s) => s.showMonkeyBubble);
  const setShowMonkeyBubble = useCollectionStore((s) => s.setShowMonkeyBubble);

  const problem = useMathStore((s) => s.problem);
  const userAnswer = useMathStore((s) => s.userAnswer);
  const setUserAnswer = useMathStore((s) => s.setUserAnswer);
  const timeLeft = useMathStore((s) => s.timeLeft);
  const setTimeLeft = useMathStore((s) => s.setTimeLeft);
  const setProblem = useMathStore((s) => s.setProblem);
  const zenMode = useMathStore((s) => s.zenMode);
  const showNumberPad = useMathStore((s) => s.showNumberPad);
  const revealingAnswer = useMathStore((s) => s.revealingAnswer);
  const setRevealingAnswer = useMathStore((s) => s.setRevealingAnswer);
  const activeMathTypes = useMathStore((s) => s.activeMathTypes);
  const typeOps = useMathStore((s) => s.typeOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const selectedFarvand = useMathStore((s) => s.selectedFarvand);
  const setInitialTime = useMathStore((s) => s.setInitialTime);
  const zenSkipDelay = useMathStore((s) => s.zenSkipDelay);

  const uiMode = useUIStore((s) => s.uiMode);
  const reducedMotion = useReducedMotion();
  /** Tablet/desktop mismatch: altid numpad når mobil-layout (matcher plan + StartScreen). */
  const effectiveShowNumpad = showNumberPad || uiMode === 'mobile';

  const [skipReady, setSkipReady] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);

  useEffect(() => {
    setSkipReady(false);
    if (!zenMode || zenSkipDelay <= 0 || gameState !== 'fighting' || !problem) return;
    const id = window.setTimeout(() => setSkipReady(true), zenSkipDelay * 1000);
    return () => window.clearTimeout(id);
  }, [zenMode, zenSkipDelay, gameState, problem]);

  useEffect(() => {
    const q = () => setNarrowViewport(typeof window !== 'undefined' && window.innerWidth < 400);
    q();
    window.addEventListener('resize', q);
    return () => window.removeEventListener('resize', q);
  }, []);

  const progression = usePlayerStore((s) => s.progression);
  const setProgression = usePlayerStore((s) => s.setProgression);
  const inventory = usePlayerStore((s) => s.inventory);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const setStats = usePlayerStore((s) => s.setStats);
  const setKrakenDefeated = usePlayerStore((s) => s.setKrakenDefeated);
  const setSoeuhyreDefeated = usePlayerStore((s) => s.setSoeuhyreDefeated);
  const setActiveBait = usePlayerStore((s) => s.setActiveBait);
  const activeBait = usePlayerStore((s) => s.activeBait);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setKrakenLoss = usePlayerStore((s) => s.setKrakenLoss);

  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setXpToast = useUIStore((s) => s.setXpToast);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);

  const isMultiPhase = fightStages.total > 1;
  const isBossFight = isMultiPhase && hookedFish && ['kraken', 'boss_hvidhaj', 'soeuhyre', 'oyster', 'gnavne_gorm'].includes(hookedFish.itemType);

  /** Større abe når panelet har ekstra UI (boss, flere faser, emoji/historier/ligninger), så figuren ikke virker lille. */
  const monkeyBusyLayout = Boolean(
    problem &&
      (isMultiPhase ||
        problem.displayType === 'emoji-most-least' ||
        problem.displayType === 'emoji-size-compare' ||
        problem.displayType === 'emoji-antal' ||
        problem.displayType === 'emoji-counting' ||
        problem.displayType === 'emoji-half' ||
        problem.displayType === 'emoji-double' ||
        problem.displayType === 'emoji-even-odd' ||
        problem.displayType === 'emoji-pattern' ||
        problem.displayType === 'emoji-sort' ||
        problem.displayType === 'emoji-equalize' ||
        problem.displayType === 'emoji-fraction' ||
        problem.displayType === 'emoji-percent' ||
        problem.category === 'regnehistorier' ||
        problem.category === 'lette-historier' ||
        problem.category === 'equations'),
  );
  const monkeyHelperScaleClass = isBossFight
    ? 'scale-[1.92]'
    : monkeyBusyLayout
      ? 'scale-[1.55]'
      : 'scale-[1.38]';

  const lossFromTimerRef = useRef(false);
  const bossWrongAnswersRef = useRef(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === 'fighting') lossFromTimerRef.current = false;
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'fighting' && hookedFish && TRUE_BOSS_ITEM_TYPES.has(hookedFish.itemType)) {
      bossWrongAnswersRef.current = 0;
    }
  }, [gameState, hookedFish?.itemType, hookedFish?.id]);

  useEffect(() => {
    if (gameState !== 'fighting') {
      setMonkeyHelpsThisRound(false);
      setShowMonkeyBubble(false);
    }
  }, [gameState, setMonkeyHelpsThisRound, setShowMonkeyBubble]);

  useEffect(() => {
    setShowMonkeyBubble(false);
  }, [problem?.question, setShowMonkeyBubble]);

  const enterLostState = useCallback(() => {
    if (useGameStore.getState().gameState !== 'fighting') return;
    if (lossFromTimerRef.current) return;
    lossFromTimerRef.current = true;

    play('lose');
    setLastWasTrueBoss(false);
    const danger = useFishingStore.getState().hookedFish;
    if (danger?.itemType === 'jellyfish') {
      setStats((st) => ({ ...st, jellyfishCaught: (st.jellyfishCaught ?? 0) + 1 }));
    }
    if (danger?.itemType === 'kraken') {
      setCoins((prev) => {
        const loss = Math.min(prev, 1000);
        setKrakenLoss(loss);
        return prev - loss;
      });
      setGameState('kraken_lost');
    } else {
      setGameState('lost');
    }
    setHookedFish(null);
    setFightStages({ current: 0, total: 1 });
    setProblem(null);
    setUserAnswer('');
    setRevealingAnswer(false);
  }, [
    play,
    setLastWasTrueBoss,
    setStats,
    setCoins,
    setKrakenLoss,
    setGameState,
    setHookedFish,
    setFightStages,
    setProblem,
    setUserAnswer,
    setRevealingAnswer,
  ]);

  useEffect(() => {
    if (gameState !== 'fighting' || !isBossFight) {
      stopBossAmbience();
    } else {
      startBossAmbience();
    }
    return () => stopBossAmbience();
  }, [gameState, isBossFight, startBossAmbience, stopBossAmbience]);

  useEffect(() => {
    if (gameState !== 'fighting' || !problem || zenMode) return;
    const startDelay = window.setTimeout(() => {
      const id = window.setInterval(() => {
        const m = useMathStore.getState();
        if (useGameStore.getState().gameState !== 'fighting') {
          window.clearInterval(id);
          return;
        }
        if (m.timeLeft <= 0) {
          window.clearInterval(id);
          return;
        }
        if (m.timeLeft <= 1) {
          window.clearInterval(id);
          m.setTimeLeft(0);
          return;
        }
        play('tick');
        m.setTimeLeft(m.timeLeft - 1);
      }, 1000);
      timerIntervalRef.current = id;
    }, 150);
    return () => {
      window.clearTimeout(startDelay);
      if (timerIntervalRef.current != null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState, problem, zenMode, play]);

  useEffect(() => {
    if (gameState !== 'fighting' || zenMode || !problem) return;
    if (timeLeft !== 0) return;
    enterLostState();
  }, [gameState, timeLeft, zenMode, problem, enterLostState]);

  function nextProblem() {
    const fishNow = useFishingStore.getState().hookedFish;
    const p = generateMathProblem(
      activeMathTypes,
      mathDifficulty,
      selectedFarvand as FarvandId,
      typeOps
    );
    setProblem(p);
    setUserAnswer('');
    const entry = fishNow?.fishModelId
      ? ENRICHED_CATCH_DATA.find((e) => e.id === fishNow.fishModelId)
      : undefined;
    const limit = entry?.fightParams?.baseTimeLimit || 25;
    if (!zenMode) {
      setInitialTime(limit);
      setTimeLeft(limit);
    }
  }

  function finalizeCatch(fish: RollCatchResult) {
    if (fish.itemType === 'cabin_key') {
      usePlayerStore.getState().incrementTotalSuccessfulCatches();
      setLastCatch({ ...fish, value: fish.value });
      setHookedFish(null);
      setFightStages({ current: 0, total: 1 });
      setProblem(null);
      setUserAnswer('');
      setGameState('catch');
      play('win');
      return;
    }

    /** Østers-boss → perle-belønning (som legacy pearlDrop). */
    let resolved: RollCatchResult = fish;
    if (fish.itemType === 'oyster') {
      resolved = {
        ...fish,
        id: makeId(),
        fishModelId: undefined,
        species: 'Perle',
        itemType: 'pearl',
        weight: 0.08,
        value: 120,
        rarity: 'Mystisk',
        color: 0xf8f8ff,
        visual: 'pearl',
      };
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        pearlCount: c.pearlCount + 1,
      }));
    }

    const tier = getBucketTier(upgrades);
    const fishCount = inventoryBucketCount(inventory);
    if (
      resolved.itemType === 'fish' ||
      resolved.itemType === 'junk' ||
      resolved.itemType === 'treasure' ||
      resolved.itemType === 'piranha'
    ) {
      if (fishCount >= tier.capacity) {
        setToastMessage('Spanden er fuld!');
        setGameState('idle');
        setHookedFish(null);
        setProblem(null);
        return;
      }
    }

    let value = resolved.value;
    const streakBefore = useFishingStore.getState().currentStreak;
    const streakBonus = calculateStreakBonus(streakBefore + 1, zenMode, value);
    value += streakBonus;

    /** Legacy keepFish: XP/mønter for bosser og særlige fanget først ved klik på panelet — ikke her. */
    const deferPanelRewards =
      resolved.itemType === 'soeuhyre' ||
      resolved.itemType === 'gnavne_gorm' ||
      resolved.itemType === 'kraken' ||
      resolved.itemType === 'crystal_junk' ||
      resolved.itemType === 'pearl' ||
      resolved.itemType === 'boss_hvidhaj';
    let levelAfterCatch = progression.level;
    let xpApply: { level: number; xp: number; levelUps: number[]; xpAmt: number } | null = null;
    if (!deferPanelRewards) {
      const xpAmt = xpForCatch(resolved) + (upgrades.includes('luxury_boat') ? 15 : 0);
      const { level, xp, levelUps } = applyXP(progression.level, progression.xp, xpAmt);
      levelAfterCatch = level;
      xpApply = { level, xp, levelUps, xpAmt };
    }

    const addToInventory =
      resolved.itemType === 'fish' ||
      resolved.itemType === 'treasure' ||
      resolved.itemType === 'junk' ||
      resolved.itemType === 'crystal_junk' ||
      resolved.itemType === 'golden_frog' ||
      resolved.itemType === 'axolotl' ||
      resolved.itemType === 'halibut' ||
      resolved.itemType === 'pearl' ||
      resolved.itemType === 'piranha';
    if (addToInventory) {
      setInventory((inv) => [...inv, { ...resolved, value }]);
    }

    if (resolved.itemType === 'fossil') {
      setInventory((inv) => [...inv, { ...resolved, value }]);
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        fossilCount: c.fossilCount + 1,
      }));
    }
    if (resolved.itemType === 'conch') {
      setInventory((inv) => [...inv, { ...resolved, value }]);
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        conchCount: c.conchCount + 1,
      }));
    }

    if (resolved.itemType === 'bottle') {
      const p = usePlayerStore.getState();
      const hadMapRight =
        p.questItems.includes('map_right') || p.upgrades.includes('map_right');
      p.setQuestItems((prev) => (prev.includes('map_left') ? prev : [...prev, 'map_left']));
      if (hadMapRight) {
        setToastMessage('🍾 Du fandt det sidste stykke af skattekortet!');
        window.setTimeout(() => {
          useCollectionStore.getState().setShowMapReveal(true);
        }, 800);
      } else {
        setToastMessage('🍾 Du fandt et halvt skattekort!');
      }
    }

    const bossWin = TRUE_BOSS_ITEM_TYPES.has(fish.itemType);
    const gSnap = useGameStore.getState();
    const isNightCatch = gSnap.timePhase.name === 'Nat';
    const isSnowCatch = gSnap.weatherType === 'snow' || gSnap.weatherType === 'snowstorm';
    const locNow = String(gSnap.currentLocation);
    const fid = resolved.fishModelId;
    const perfectThisBoss = bossWin && bossWrongAnswersRef.current === 0;
    bossWrongAnswersRef.current = 0;

    const legendaryBaitWasActive = activeBait === 'legendary_bait';

    setCurrentStreak((n) => n + 1);
    setLastCatch({ ...resolved, value });
    setHookedFish(null);
    setFightStages({ current: 0, total: 1 });
    setProblem(null);
    setUserAnswer('');
    setGameState('catch');
    if (resolved.itemType === 'treasure' || resolved.rarity === 'Legendarisk') play('legendary');
    else if (resolved.itemType === 'junk') play('junk');
    else play('win');
    if (!deferPanelRewards) play('xp');

    requestAnimationFrame(() => {
      usePlayerStore.getState().incrementTotalSuccessfulCatches();
      if (xpApply) {
        setProgression({ level: xpApply.level, xp: xpApply.xp });
        if (xpApply.levelUps.length > 0) {
          setShowLevelUp(xpApply.levelUps[xpApply.levelUps.length - 1]!);
        }
        setXpToast(`+${xpApply.xpAmt} XP`);
      }
      setStats((s) => {
        const junk = resolved.itemType === 'junk';
        const nextJunk = junk ? s.currentJunkStreak + 1 : 0;
        let nextTropical = s.tropicalFishCaughtIds;
        if (
          locNow === 'tropical_island' &&
          fid &&
          (resolved.itemType === 'fish' || resolved.itemType === 'piranha')
        ) {
          if (!s.tropicalFishCaughtIds.includes(fid)) {
            nextTropical = [...s.tropicalFishCaughtIds, fid];
          }
        }
        return {
          ...s,
          totalCatches: s.totalCatches + (resolved.itemType === 'fish' ? 1 : 0),
          rareCatches: s.rareCatches + (resolved.rarity === 'Sjælden' ? 1 : 0),
          legendaryCatches: s.legendaryCatches + (resolved.rarity === 'Legendarisk' ? 1 : 0),
          treasureCatches: s.treasureCatches + (resolved.itemType === 'treasure' ? 1 : 0),
          maxLevel: Math.max(s.maxLevel, levelAfterCatch),
          currentJunkStreak: nextJunk,
          bestJunkStreak: Math.max(s.bestJunkStreak, nextJunk),
          maxCombo: Math.max(s.maxCombo ?? 0, streakBefore + 1),
          rainCatches:
            s.rainCatches + (weatherType === 'rain' && resolved.itemType === 'fish' ? 1 : 0),
          stormCatches:
            s.stormCatches + (weatherType === 'storm' && resolved.itemType === 'fish' ? 1 : 0),
          nightCatches: s.nightCatches + (isNightCatch && resolved.itemType === 'fish' ? 1 : 0),
          snowCatches: s.snowCatches + (isSnowCatch && resolved.itemType === 'fish' ? 1 : 0),
          junkCatches: s.junkCatches + (resolved.itemType === 'junk' ? 1 : 0),
          frogCatches:
            s.frogCatches +
            (resolved.fishModelId === 'fisk_frø' || resolved.itemType === 'golden_frog' ? 1 : 0),
          sharkCaught:
            s.sharkCaught ||
            resolved.itemType === 'boss_hvidhaj' ||
            resolved.fishModelId === 'fisk_haj',
          narwhalCaught: s.narwhalCaught || resolved.fishModelId === 'fisk_narhval',
          plesiosaurCaught: s.plesiosaurCaught || resolved.itemType === 'plesiosaur',
          goldenCarpCaught: s.goldenCarpCaught || resolved.fishModelId === 'fisk_gyldne_karpe',
          tropicalFishCaughtIds: nextTropical,
          tropicalSpeciesCaught: nextTropical.length,
          bottleCatches: s.bottleCatches + (resolved.itemType === 'bottle' ? 1 : 0),
          tireCaught: s.tireCaught + (resolved.fishModelId === 'junk_bildæk' ? 1 : 0),
          teddyCaught: s.teddyCaught + (resolved.fishModelId === 'junk_våd_bamse' ? 1 : 0),
          perfectBossWins: s.perfectBossWins + (perfectThisBoss ? 1 : 0),
          krakenCaught: s.krakenCaught || resolved.itemType === 'kraken',
          axolotlCaught: s.axolotlCaught || resolved.itemType === 'axolotl',
          crystalFound: s.crystalFound || resolved.itemType === 'crystal_junk',
          gormDefeated: s.gormDefeated || resolved.itemType === 'gnavne_gorm',
          bossWins: s.bossWins + (bossWin ? 1 : 0),
        };
      });
      if (resolved.itemType === 'kraken') {
        setKrakenDefeated(true);
        usePlayerStore.getState().setHvalbofActive(false);
      }
      if (resolved.itemType === 'soeuhyre') {
        setSoeuhyreDefeated(true);
        usePlayerStore.getState().setKoedklumpActive(false);
        markSoeuhyreCaughtThisVisit();
      }
      if (resolved.itemType === 'plesiosaur') {
        usePlayerStore.setState((s) => {
          const nextQuest = s.questItems.filter((x) => x !== 'bait');
          if (!nextQuest.includes('plesio_defeated')) nextQuest.push('plesio_defeated');
          return {
            questItems: nextQuest,
            activeBait: s.activeBait === 'bait' ? null : s.activeBait,
          };
        });
      }
      if (legendaryBaitWasActive) {
        setActiveBait(null);
      }
    });
  }

  function handleAnswerCorrect() {
    play('ui');

    if (problem) {
      const cat = problem.category;
      setStats((s) => {
        const cats = s.solvedCategories ?? [];
        const newCats = cats.includes(cat) ? cats : [...cats, cat];
        return {
          ...s,
          solvedCategories: newCats,
          fractionSolves: s.fractionSolves + (cat === 'emoji-fraction' ? 1 : 0),
          percentSolves: s.percentSolves + (cat === 'emoji-percent' ? 1 : 0),
          patternSolves: s.patternSolves + (cat === 'emoji-pattern' ? 1 : 0),
          halvdelDobbeltSolves:
            s.halvdelDobbeltSolves + (cat === 'emoji-half' || cat === 'emoji-double' ? 1 : 0),
        };
      });
    }

    const fs = useFishingStore.getState().fightStages;
    const next = fs.current + 1;
    const mSnap = useMathStore.getState();
    const speedEligible =
      !zenMode && mSnap.initialTime > 0 && mSnap.timeLeft / mSnap.initialTime > 0.8;
    if (next >= fs.total) {
      if (speedEligible) {
        setStats((s) => ({ ...s, speedSolves: s.speedSolves + 1 }));
      }
      const fish = hookedFish;
      if (!fish) return;
      if (fish.itemType === 'nothing') {
        setToastMessage('Tom krog…');
        setHookedFish(null);
        setProblem(null);
        setGameState('idle');
        return;
      }
      finalizeCatch(fish);
      return;
    }

    setFightStages({ ...fs, current: next });
    nextProblem();
  }

  function handleAnswerWrong() {
    play('error');
    const hook = hookedFish;
    if (hook && TRUE_BOSS_ITEM_TYPES.has(hook.itemType)) {
      bossWrongAnswersRef.current += 1;
    }
    if (hook && !STREAK_EXCEPTION_TYPES.has(hook.itemType)) {
      setCurrentStreak(0);
      setStreakMilestoneToast(null);
    }
    const mWrong = useMathStore.getState();
    mWrong.setTimeLeft(Math.max(0, mWrong.timeLeft - 3));
  }

  function handleEmojiChoice(side: 'left' | 'right') {
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    const choiceData = problem.emojiChoiceData || problem.emojiSizeData;
    if (!choiceData) return;
    const isCorrect = side === choiceData.correctSide;
    if (isCorrect) {
      handleAnswerCorrect();
    } else {
      handleAnswerWrong();
    }
  }

  function handleEvenOddChoice(choice: 'even' | 'odd') {
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    const data = problem.emojiEvenOddData;
    if (!data) return;
    const isCorrect = (choice === 'even') === data.isEven;
    if (isCorrect) handleAnswerCorrect();
    else handleAnswerWrong();
  }

  function handlePatternChoice(emoji: string) {
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    const data = problem.emojiPatternData;
    if (!data) return;
    const isCorrect = emoji === data.correctNext;
    if (isCorrect) handleAnswerCorrect();
    else handleAnswerWrong();
  }

  function handleFractionChoice(fraction: string) {
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    const data = problem.emojiFractionData;
    if (!data) return;
    const isCorrect = fraction === data.correctFraction;
    if (isCorrect) handleAnswerCorrect();
    else handleAnswerWrong();
  }

  function checkAnswer(e?: FormEvent) {
    e?.preventDefault();
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    if (problem.answer === -1) return;
    if (!numericAnswerOk(userAnswer, problem.answer)) {
      setUserAnswer('');
      handleAnswerWrong();
      return;
    }

    handleAnswerCorrect();
  }

  if (gameState !== 'fighting' || !problem) return null;

  const bossShakeClass =
    isBossFight && !reducedMotion
      ? uiMode === 'mobile'
        ? 'animate-shake-sm'
        : 'animate-shake'
      : '';

  const isClickBasedProblem =
    problem.displayType === 'emoji-most-least' ||
    problem.displayType === 'emoji-size-compare' ||
    problem.displayType === 'emoji-even-odd' ||
    problem.displayType === 'emoji-pattern' ||
    problem.displayType === 'emoji-sort' ||
    problem.displayType === 'emoji-fraction';

  const clickRevealData = problem.emojiChoiceData || problem.emojiSizeData;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="mx-auto w-full max-w-xl">
        <div
          className={`anim-zoom-in pointer-events-auto relative w-full overflow-visible rounded-3xl p-5 shadow-2xl md:p-10 ${
            isBossFight
              ? `border-8 border-red-600 bg-boss${bossShakeClass ? ` ${bossShakeClass}` : ''}`
              : isMultiPhase
                ? 'panel-dark border-4 border-amber-500'
                : 'panel-dark border-4 border-sky-500'
          }`}
        >
        {monkeyHelpsThisRound && problem && (
          <div
            className={`monkey-helper${isBossFight ? ' monkey-helper--boss' : ''}`}
            onClick={() => {
              play('ui');
              setShowMonkeyBubble(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                play('ui');
                setShowMonkeyBubble(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Abe-hjælper: klik for hint"
          >
            <div className={`origin-bottom ${monkeyHelperScaleClass}`}>
            <div
              className="flex flex-col items-center"
              style={{
                animation: 'monkeyBob 1.8s ease-in-out infinite alternate',
              }}
            >
              <div
                className="relative flex shrink-0 items-center justify-center rounded-full border-2 border-[#5C3518] bg-[#7B4F2E] shadow-lg"
                style={{ width: '2.8rem', height: '2.8rem', boxShadow: '0 3px 8px rgba(0,0,0,0.5)' }}
              >
                <div
                  className="absolute rounded-full bg-[#C4845A]"
                  style={{ width: '1.8rem', height: '1.5rem' }}
                >
                  <div
                    className="absolute rounded-full bg-[#1a1a1a]"
                    style={{ top: '0.25rem', left: '0.25rem', width: '0.35rem', height: '0.35rem' }}
                  />
                  <div
                    className="absolute rounded-full bg-[#1a1a1a]"
                    style={{ top: '0.25rem', right: '0.25rem', width: '0.35rem', height: '0.35rem' }}
                  />
                  <div
                    className="absolute left-1/2 rounded-b-[0.35rem] border-[1.5px] border-[#8B3A2A] border-t-0"
                    style={{
                      bottom: '0.2rem',
                      width: '0.7rem',
                      height: '0.35rem',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
                <div
                  className="absolute rounded-full border-[1.5px] border-[#5C3518] bg-[#7B4F2E]"
                  style={{ left: '-0.35rem', top: '0.4rem', width: '0.65rem', height: '0.65rem' }}
                />
                <div
                  className="absolute rounded-full border-[1.5px] border-[#5C3518] bg-[#7B4F2E]"
                  style={{ right: '-0.35rem', top: '0.4rem', width: '0.65rem', height: '0.65rem' }}
                />
              </div>
              <div
                className="relative -mt-1 rounded-[0.8rem_0.8rem_0.6rem_0.6rem] border-2 border-[#5C3518] bg-[#7B4F2E]"
                style={{ width: '2rem', height: '2.2rem' }}
              >
                <div
                  className="absolute left-1/2 top-[0.25rem] h-[1.1rem] w-[1rem] -translate-x-1/2 rounded-full bg-[#C4845A] opacity-60"
                />
                <div
                  className="absolute top-[0.3rem] h-[0.35rem] w-[0.9rem] rounded-[0.4rem] bg-[#7B4F2E]"
                  style={{
                    left: '-0.9rem',
                    transformOrigin: 'right center',
                    animation: 'waveArm 1s ease-in-out infinite',
                  }}
                />
                <div
                  className="absolute top-[0.3rem] h-[0.35rem] w-[0.9rem] rounded-[0.4rem] bg-[#7B4F2E]"
                  style={{
                    right: '-0.9rem',
                    transformOrigin: 'left center',
                    animation: 'waveArm 1s ease-in-out infinite reverse',
                  }}
                />
              </div>
              <div className="-mt-0.5 flex gap-1">
                <div
                  className="rounded-[0.25rem] border-[1.5px] border-[#5C3518] bg-[#7B4F2E]"
                  style={{ width: '0.6rem', height: '0.9rem' }}
                />
                <div
                  className="rounded-[0.25rem] border-[1.5px] border-[#5C3518] bg-[#7B4F2E]"
                  style={{ width: '0.6rem', height: '0.9rem' }}
                />
              </div>
              <div
                className="mt-0.5 text-[0.5rem] font-bold text-amber-100"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
              >
                Klik! 🐒
              </div>
            </div>
            </div>
            {showMonkeyBubble && problem && (
              <div className="speech-bubble-monkey">
                {problem.answer === -1 ? (
                  <>
                    Ooo aah! Tryk på den rigtige kasse!{' '}
                    <span className="ml-1 text-2xl leading-none">🐒</span>
                  </>
                ) : (
                  <>
                    Ooo aah! Svaret er{' '}
                    <span className="text-lg font-black text-[#b45309]">{problem.answer}</span>!{' '}
                    <span className="ml-1 text-2xl leading-none">🐒</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between border-b border-slate-700/50 pb-3 md:mb-8 md:pb-6">
          <div className="flex items-center">
            {problem && problemTypeBadgeLabel(problem) && (
              <span
                className="rounded-full border px-3 py-1 text-xs font-black tracking-widest uppercase"
                style={{
                  background: problemTypeBadgeIsGreen(problem)
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(99,102,241,0.25)',
                  color: problemTypeBadgeIsGreen(problem) ? '#6ee7b7' : '#a5b4fc',
                  borderColor: problemTypeBadgeIsGreen(problem)
                    ? 'rgba(16,185,129,0.4)'
                    : 'rgba(99,102,241,0.4)',
                }}
              >
                {problemTypeBadgeLabel(problem)}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-4">
            {zenMode ? (
              <div
                className="flex items-center gap-2 rounded-xl bg-black/40 px-4 py-2 font-mono text-2xl font-black text-emerald-400"
                style={{ minWidth: '7rem', justifyContent: 'center' }}
              >
                ♾️
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 rounded-xl bg-black/40 px-4 py-2 font-mono text-3xl font-black tabular-nums ${
                  timeLeft < 5 ? 'animate-pulse text-red-500' : 'text-sky-300'
                }`}
                style={{ minWidth: '7rem', justifyContent: 'center' }}
              >
                🕐 {timeLeft}s
              </div>
            )}
          </div>
        </div>

        {isBossFight && hookedFish && (
          <div
            className="mb-3 max-w-full px-1 text-center font-black leading-tight tracking-widest break-words text-red-400 uppercase"
            style={{ fontSize: 'clamp(0.8rem, 3.6vw, 1.5rem)' }}
          >
            ⚔️ Boss: {hookedFish.species}
          </div>
        )}

        {isMultiPhase && (
          <div
            className="mb-6 grid min-h-0 w-full min-w-0 max-w-full gap-1.5 px-1 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${fightStages.total}, minmax(0, 1fr))`,
            }}
          >
            {[...Array(fightStages.total)].map((_, i) => (
              <div
                key={i}
                className={`h-3.5 min-h-0 w-full max-w-full rounded-full transition-all duration-500 sm:h-4 ${
                  i < fightStages.current ? 'bg-slate-800' : 'bg-amber-500'
                }`}
                style={
                  i >= fightStages.current
                    ? { boxShadow: '0 0 10px rgba(245,158,11,0.6)' }
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="mb-6 w-full min-w-0 max-w-full text-center break-words [overflow-wrap:anywhere]">
          {problem.displayType === 'emoji-most-least' && problem.emojiChoiceData ? (
            <EmojiMostLeastPanel
              data={problem.emojiChoiceData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              clickRevealData={clickRevealData}
              onChoose={handleEmojiChoice}
            />
          ) : problem.displayType === 'emoji-size-compare' && problem.emojiSizeData ? (
            <EmojiSizeComparePanel
              data={problem.emojiSizeData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              clickRevealData={clickRevealData}
              onChoose={handleEmojiChoice}
            />
          ) : problem.displayType === 'emoji-antal' && problem.emojiAntalData ? (
            <EmojiAntalPanel data={problem.emojiAntalData} />
          ) : problem.displayType === 'emoji-counting' && problem.emojiData ? (
            <EmojiCountingPanel data={problem.emojiData} />
          ) : problem.displayType === 'emoji-half' && problem.emojiHalvdelData ? (
            <EmojiHalvdelPanel data={problem.emojiHalvdelData} />
          ) : problem.displayType === 'emoji-double' && problem.emojiHalvdelData ? (
            <EmojiHalvdelPanel data={problem.emojiHalvdelData} />
          ) : problem.displayType === 'emoji-even-odd' && problem.emojiEvenOddData ? (
            <EmojiEvenOddPanel
              data={problem.emojiEvenOddData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              onChoose={handleEvenOddChoice}
            />
          ) : problem.displayType === 'emoji-pattern' && problem.emojiPatternData ? (
            <EmojiPatternPanel
              data={problem.emojiPatternData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              onChoose={handlePatternChoice}
            />
          ) : problem.displayType === 'emoji-sort' && problem.emojiSortData ? (
            <EmojiSortPanel
              data={problem.emojiSortData}
              revealingAnswer={revealingAnswer}
              onComplete={handleAnswerCorrect}
              onWrong={handleAnswerWrong}
            />
          ) : problem.displayType === 'emoji-equalize' && problem.emojiEqualizeData ? (
            <EmojiEqualizePanel data={problem.emojiEqualizeData} />
          ) : problem.displayType === 'emoji-fraction' && problem.emojiFractionData ? (
            <EmojiFractionPanel
              data={problem.emojiFractionData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              onChoose={handleFractionChoice}
            />
          ) : problem.displayType === 'emoji-percent' && problem.emojiPercentData ? (
            <EmojiPercentPanel data={problem.emojiPercentData} />
          ) : problem.category === 'regnehistorier' || problem.category === 'lette-historier' ? (
            <div
              className="mb-3 rounded-2xl border border-emerald-400/30 bg-blue-950/80 p-4 text-center text-base font-bold text-emerald-300 break-words [overflow-wrap:anywhere]"
              style={{ lineHeight: 1.5 }}
            >
              📖 {problem.question}
            </div>
          ) : (
            <div
              className="math-question-text mb-3 flex min-h-[4.5rem] w-full min-w-0 items-center justify-center break-words px-1 text-6xl font-black tracking-tighter text-white tabular-nums md:text-8xl [overflow-wrap:anywhere]"
              style={
                problem.category === 'equations'
                  ? {
                      fontSize: narrowViewport
                        ? 'clamp(1.5rem, 5vw, 4.5rem)'
                        : 'clamp(2rem, 7vw, 4.5rem)',
                    }
                  : undefined
              }
            >
              {problem.question}
            </div>
          )}
        </div>

        {!isClickBasedProblem && (
          <div className="relative">
          {effectiveShowNumpad ? (
            <div className="flex w-full items-stretch gap-2">
              <div
                className="min-h-[4.5rem] min-w-0 flex-1 select-none rounded-3xl border-4 border-slate-600 px-4 py-5 text-center text-5xl font-black text-white"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  visibility: revealingAnswer ? 'hidden' : 'visible',
                  lineHeight: 1.2,
                }}
              >
                {userAnswer || <span className="text-slate-700">?</span>}
              </div>
            </div>
          ) : (
            <form onSubmit={checkAnswer} className="flex w-full items-stretch gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={userAnswer}
                onChange={(ev) => !revealingAnswer && setUserAnswer(ev.target.value)}
                className="min-w-0 flex-1 rounded-3xl border-4 border-slate-600 bg-black/40 px-4 py-6 text-center text-5xl font-black text-white placeholder-slate-700 focus:border-sky-500 focus:outline-none"
                style={{ visibility: revealingAnswer ? 'hidden' : 'visible' }}
                placeholder="?"
              />
              <button
                type="submit"
                className="touch-manipulation shrink-0 rounded-3xl border-4 border-emerald-600/50 bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 text-lg font-black whitespace-nowrap text-white shadow-lg hover:from-emerald-600 hover:to-cyan-600 active:scale-95"
              >
                Enter
              </button>
            </form>
          )}

          {revealingAnswer && (
            <div
              className="anim-zoom-in absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-4 border-green-700 bg-black/40"
            >
              <div className="animate-bounce text-5xl font-black text-green-400">
                {problem.answer}
              </div>
            </div>
          )}
          </div>
        )}

        {zenMode && skipReady && !isClickBasedProblem && (
          <button
            type="button"
            className="touch-manipulation mt-4 w-full rounded-2xl border border-emerald-500/50 py-3 font-bold text-emerald-300 hover:bg-emerald-900/30"
            onClick={() => {
              play('ui');
              setRevealingAnswer(true);
              window.setTimeout(() => {
                setRevealingAnswer(false);
                enterLostState();
              }, 900);
            }}
          >
            ✂️ Vis svar (zen)
          </button>
        )}

        {zenMode && skipReady && isClickBasedProblem && (
          <button
            type="button"
            className="touch-manipulation mt-4 w-full rounded-2xl border border-emerald-500/50 py-3 font-bold text-emerald-300 hover:bg-emerald-900/30"
            onClick={() => {
              play('ui');
              setRevealingAnswer(true);
              window.setTimeout(() => {
                setRevealingAnswer(false);
                enterLostState();
              }, 900);
            }}
          >
            ✂️ Vis svar (zen)
          </button>
        )}

        {!isClickBasedProblem && effectiveShowNumpad && (
          <NumberPad
            onDigit={(d) => setUserAnswer((a) => `${a}${d}`)}
            onBackspace={() => setUserAnswer((a) => a.slice(0, -1))}
            onSubmit={() => checkAnswer()}
          />
        )}
        </div>
      </div>
    </div>
  );
}
