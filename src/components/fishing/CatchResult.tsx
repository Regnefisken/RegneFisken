import { useAudio } from '../../audio/useAudio';
import { applyXP, getFinalStreakBonus, xpForCatch } from '../../logic/xp-engine';
import type { RollCatchResult } from '../../types/fish';
import { useBucketDropStore } from '../../store/useBucketDropStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { rarityTextClass } from '../hud/rarityColor';
import { CatchLegendaryCompanionPreview } from './CatchLegendaryCompanionPreview';

/** Som legacy `keepFish` — `animateFishToBucket` undtagen flaske/plesio/helleflynder + companion-specialer. */
function shouldAnimateFishToBucket(fish: RollCatchResult): boolean {
  return (
    fish.itemType !== 'bottle' &&
    fish.itemType !== 'plesiosaur' &&
    fish.itemType !== 'halibut' &&
    fish.itemType !== 'golden_frog' &&
    fish.itemType !== 'axolotl' &&
    fish.itemType !== 'fossil' &&
    fish.itemType !== 'conch'
  );
}

export function CatchResult() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const lastCatch = useFishingStore((s) => s.lastCatch);
  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const currentStreak = useFishingStore((s) => s.currentStreak);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const zenMode = useMathStore((s) => s.zenMode);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const helleflynderCaught = useCollectionStore((s) => s.helleflynderCaught);
  const setHelleflynderCaught = useCollectionStore((s) => s.setHelleflynderCaught);
  const usedWishes = useCollectionStore((s) => s.usedWishes);
  const setWishOptions = useCollectionStore((s) => s.setWishOptions);
  const setShowWishModal = useCollectionStore((s) => s.setShowWishModal);
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);
  const goldenFrogCount = useCollectionStore((s) => s.goldenFrogCount);
  const setHasGoldenFrog = useCollectionStore((s) => s.setHasGoldenFrog);
  const setGoldenFrogCount = useCollectionStore((s) => s.setGoldenFrogCount);
  const progression = usePlayerStore((s) => s.progression);
  const setProgression = usePlayerStore((s) => s.setProgression);
  const questItems = usePlayerStore((s) => s.questItems);
  const setQuestItems = usePlayerStore((s) => s.setQuestItems);
  const setStats = usePlayerStore((s) => s.setStats);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setXpToast = useUIStore((s) => s.setXpToast);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);

  if (gameState !== 'catch' || !lastCatch) return null;

  if (lastCatch.itemType === 'cabin_key') {
    function keepKey() {
      play('ui');
      setQuestItems((prev) => (prev.includes('cabin_key') ? prev : [...prev, 'cabin_key']));
      setLastCatch(null);
      setGameState('idle');
    }

    return (
      <div className="pointer-events-auto absolute inset-0 z-[10040] flex items-center justify-center bg-black/50 p-4">
        <div
          className="anim-zoom-in relative max-h-[85dvh] w-full max-w-md overflow-hidden overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl"
          style={{
            borderColor: '#DAA520',
            background: 'rgba(18,11,4,0.98)',
            boxShadow: '0 0 60px rgba(218,165,32,0.35)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(218,165,32,0.18), transparent 65%)',
            }}
          />
          <div className="relative z-10">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-6 py-1.5 text-xs font-black tracking-widest uppercase"
              style={{ background: 'rgba(120,80,10,0.85)', color: '#fde68a' }}
            >
              🗝️ Quest-genstand fundet!
            </div>
            <h2 className="mb-2 text-4xl font-black text-amber-100">Fiskehyttens Nøgle</h2>
            <p className="mb-6 text-sm leading-relaxed text-amber-300/80">
              En tung, gammel messingnøgle dækket af havtang.
              <br />
              Den passer perfekt til den gamle fiskehyttes dør…
            </p>
            <button
              type="button"
              onClick={keepKey}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(to bottom, #d97706, #b45309)',
                borderColor: '#78350f',
              }}
            >
              🗝️ Tag nøglen med
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'halibut') {
    const halibutId = lastCatch.id;
    const allWishes = [
      {
        id: 'friend' as const,
        label: '🐵 Venskab',
        description: 'En abe-ven bliver din matematik-hjælper for evigt!',
      },
      {
        id: 'love' as const,
        label: '❤️ Kærlighed',
        description: 'Kærlighed fra dybet! En magisk hjerteballon der elsker gemmeleg.',
      },
      {
        id: 'wealth' as const,
        label: '💰 Rigdom',
        description: '+1.000 kroner direkte i lommen!',
      },
    ];

    function dismissKongFlynder() {
      play('splash');
      setInventory((prev) => prev.filter((f) => f.id !== halibutId));
      setLastCatch(null);
      setGameState('idle');
    }

    function releaseForWish() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== halibutId));
      const catchNum = helleflynderCaught + 1;
      setHelleflynderCaught(catchNum);
      const available = allWishes.filter((w) => !usedWishes.includes(w.id));
      const maxChoices = 4 - catchNum;
      setWishOptions(available.slice(0, Math.max(1, maxChoices)));
      setShowWishModal(true);
      setLastCatch(null);
      setGameState('idle');
    }

    if (helleflynderCaught >= 3) {
      return (
        <div className="pointer-events-none fixed inset-0 z-[10031] flex flex-col items-center justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="anim-zoom-in pointer-events-auto mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-yellow-500/50 bg-slate-800/95 p-6 text-center shadow-[0_0_30px_rgba(234,179,8,0.15)] md:mt-80">
            <div className="mb-4 animate-bounce text-6xl">👑</div>
            <h3 className="mb-3 text-2xl font-black tracking-wide text-yellow-400">
              KONG FLYNDER SIGER HEJ
            </h3>
            <p className="mb-6 text-base leading-relaxed font-medium text-slate-300">
              Et kæmpe plask! Det er Kong Flynder. Han lod sig fange med vilje, bare for at kigge forbi og sige
              hej.
              <br />
              Du har allerede fået alle hans gaver, så i dag er det bare et hyggeligt besøg fra en gammel ven. Han
              blinker med sit ene øje.
            </p>
            <button
              type="button"
              onClick={dismissKongFlynder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 text-lg font-black text-white shadow-[0_4px_0_#0284c7,0_10px_20px_rgba(0,0,0,0.3)] transition-all hover:bg-sky-500 active:translate-y-1 active:shadow-none"
            >
              Vink farvel og slip Kongen fri 👋🌊
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pointer-events-none fixed inset-0 z-[10031] flex flex-col items-center justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          className="anim-zoom-in panel-dark pointer-events-auto mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={{
            borderColor: '#DEB887',
            background: 'rgba(15,10,5,0.97)',
          }}
        >
          <div className="mb-4 text-7xl" style={{ filter: 'drop-shadow(0 0 20px #DEB887)' }}>
            🐟
          </div>
          <h2 className="mb-2 text-4xl font-black text-amber-200">Helleflynder!</h2>
          <p className="mb-2 text-slate-300">En magisk fisk... den taler til dig.</p>
          <p className="mb-6 font-bold italic text-amber-300">
            &quot;Fang mig 3 gange, og du må ønske dig noget...&quot;
          </p>
          <p className="mb-6 text-sm text-slate-500">
            Fanget {helleflynderCaught} / 3 gange
          </p>
          <button
            type="button"
            onClick={releaseForWish}
            className="w-full rounded-2xl border-b-4 border-amber-900 bg-amber-800 py-4 text-xl font-bold text-white hover:bg-amber-700"
          >
            Smid ud og ønsk... 🌟
          </button>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'golden_frog') {
    const catchId = lastCatch.id;
    function keepGoldenFrog() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== catchId));
      setGoldenFrogCount((c) => c + 1);
      if (!hasGoldenFrog) {
        setHasGoldenFrog(true);
        play('legendary');
        setToastMessage(
          '🐸 Den Gyldne Frø! Den flytter ind i fiskehytten — du kan flytte den rundt!',
        );
        const xpGained = 250;
        const { level, xp, levelUps } = applyXP(progression.level, progression.xp, xpGained);
        setProgression({ level, xp });
        if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
        setXpToast(`+${xpGained} XP`);
      } else {
        play('win');
        setToastMessage(
          `🐸 Den Gyldne Frø igen! Du sætter den nænsomt ud igen. (Fangst #${goldenFrogCount + 1})`,
        );
      }
      setLastCatch(null);
      setGameState('idle');
    }

    return (
      <div className="pointer-events-none fixed inset-0 z-[10031] flex flex-col items-center justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <CatchLegendaryCompanionPreview variant="golden_frog" />
        <div
          className="anim-zoom-in pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={{
            borderColor: '#fbbf24',
            background: 'rgba(15,12,5,0.98)',
            boxShadow: '0 0 40px rgba(251,191,36,0.3)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at top, rgba(255,215,0,0.15), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="text-7xl mb-4 animate-pulse">🐸</div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black uppercase tracking-wider"
              style={{ background: '#fbbf24', color: '#78350f' }}
            >
              ✨ Legendarisk fund!
            </div>
            <h2 className="mb-2 text-4xl font-black" style={{ color: '#fde68a' }}>
              Den Gyldne Frø
            </h2>
            <p className="mb-2 text-sm text-slate-400">
              En mystisk frø der glimter af rent guld. Dens øjne er kloge og rolige.
            </p>
            {!hasGoldenFrog ? (
              <>
                <p className="mb-2 text-sm font-bold" style={{ color: '#fbbf24' }}>
                  📍 Nyt kæledyr til hytten!
                </p>
                <p className="mb-6 text-sm text-yellow-200">
                  Den flytter ind i fiskehytten — du kan flytte den rundt som de andre møbler!
                </p>
              </>
            ) : (
              <p className="mb-6 text-sm text-yellow-400">
                Du har allerede en. Du sætter den nænsomt ud igen. (Fangst #{goldenFrogCount + 1})
              </p>
            )}
            <button
              type="button"
              onClick={keepGoldenFrog}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-black"
              style={{
                background: '#fbbf24',
                borderColor: '#92400e',
              }}
            >
              {!hasGoldenFrog ? '🐸 Tag den med til hytten' : '💧 Sæt ud igen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'axolotl') {
    const catchId = lastCatch.id;
    const hasAxolotl = questItems.includes('has_axolotl');
    function keepAxolotl() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== catchId));
      if (!hasAxolotl) {
        setQuestItems((prev) => (prev.includes('has_axolotl') ? prev : [...prev, 'has_axolotl']));
        setStats((s) => ({ ...s, axolotlCaught: true }));
        play('legendary');
        setToastMessage(
          '🦎 Den Glødende Axolotl! Den er så smuk, at du ikke kan sælge den — den flytter ind i fiskehytten!',
        );
        const xpGained = 300;
        const { level, xp, levelUps } = applyXP(progression.level, progression.xp, xpGained);
        setProgression({ level, xp });
        if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
        setXpToast(`+${xpGained} XP`);
      } else {
        play('win');
        setToastMessage(
          '🦎 Axolotlen igen! Du sætter den nænsomt tilbage i vandet — den ser ud til at sætte pris på det.',
        );
      }
      setLastCatch(null);
      setGameState('idle');
    }

    return (
      <div className="pointer-events-none fixed inset-0 z-[10031] flex flex-col items-center justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <CatchLegendaryCompanionPreview variant="axolotl" />
        <div
          className="anim-zoom-in pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={{
            borderColor: '#FF69B4',
            background: 'rgba(15,5,12,0.98)',
            boxShadow: '0 0 40px rgba(255,20,147,0.3)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at top, rgba(255,20,147,0.12), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="text-7xl mb-4 animate-pulse">🦎</div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black uppercase tracking-wider text-white"
              style={{ background: '#FF1493' }}
            >
              ✨ Legendarisk fund!
            </div>
            <h2 className="mb-2 text-4xl font-black" style={{ color: '#FFB6C1' }}>
              Glødende Axolotl
            </h2>
            <p className="mb-2 text-sm text-slate-400">
              Et smilende padde-dyr der nægter at blive voksen. Dens fjer-gæller lyser svagt af en
              uforklarlig energi.
            </p>
            {!hasAxolotl ? (
              <p className="mb-6 text-sm font-bold text-pink-300">
                🏠 Den er for smuk til at sælge — den flytter ind i fiskehytten!
              </p>
            ) : (
              <p className="mb-6 text-sm text-pink-400">
                Du har allerede en. Du sætter den nænsomt tilbage i vandet.
              </p>
            )}
            <button
              type="button"
              onClick={keepAxolotl}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-white"
              style={{
                background: '#C71585',
                borderColor: '#8B0057',
              }}
            >
              {!hasAxolotl ? '🦎 Tag den med til hytten' : '💧 Sæt tilbage i vandet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'fossil') {
    function dismissFossil() {
      play('ui');
      setLastCatch(null);
      setGameState('idle');
    }
    return (
      <div className="pointer-events-auto absolute inset-0 z-[10040] flex items-center justify-center bg-black/55 p-4">
        <div
          className="anim-zoom-in relative max-h-[85dvh] w-full max-w-md overflow-hidden rounded-3xl border-2 p-8 text-center shadow-2xl"
          style={{
            borderColor: 'rgba(120,80,40,0.7)',
            background: 'linear-gradient(165deg, rgba(25,15,8,0.98) 0%, rgba(15,10,5,0.99) 100%)',
            boxShadow: '0 0 50px rgba(180,83,9,0.2)',
          }}
        >
          <div className="mb-4 text-6xl">🦴</div>
          <h2 className="mb-3 text-3xl font-black text-amber-100">Mystisk fossil</h2>
          <p className="mb-6 text-sm leading-relaxed text-amber-200/80">
            Du har fundet et gammelt fossil fra havets dyb! Det lægges i din skatteliste — ikke i spanden.
          </p>
          <button
            type="button"
            onClick={dismissFossil}
            className="w-full rounded-2xl border-b-4 py-4 text-lg font-bold text-amber-50 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: '#92400e', borderColor: '#451a03' }}
          >
            Fortsæt
          </button>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'conch') {
    function dismissConch() {
      play('ui');
      setLastCatch(null);
      setGameState('idle');
    }
    return (
      <div className="pointer-events-auto absolute inset-0 z-[10040] flex items-center justify-center bg-black/55 p-4">
        <div
          className="anim-zoom-in relative max-h-[85dvh] w-full max-w-md overflow-hidden rounded-3xl border-2 p-8 text-center shadow-2xl"
          style={{
            borderColor: 'rgba(56,189,248,0.45)',
            background: 'linear-gradient(165deg, rgba(8,25,40,0.98) 0%, rgba(5,15,28,0.99) 100%)',
          }}
        >
          <div className="mb-4 text-6xl">🐚</div>
          <h2 className="mb-3 text-3xl font-black text-sky-100">Konkylie</h2>
          <p className="mb-6 text-sm leading-relaxed text-sky-200/85">
            En smuk konkylie! Den gemmes til pingvinen og vises under Skatte i kisten.
          </p>
          <button
            type="button"
            onClick={dismissConch}
            className="w-full rounded-2xl border-b-4 border-sky-900 bg-sky-600 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-sky-500"
          >
            Fortsæt
          </button>
        </div>
      </div>
    );
  }

  const xpEarned = xpForCatch(lastCatch) + (upgrades.includes('luxury_boat') ? 15 : 0);
  const streakBonusShown = getFinalStreakBonus(currentStreak, zenMode, lastCatch.value);

  const upgradeBadges: { icon: string; text: string; color: string }[] = [];
  if (upgrades.includes('heldig_firkloever'))
    upgradeBadges.push({ icon: '🍀', text: '+8 Held', color: '#4ade80' });
  if (upgrades.includes('pirate_hat')) upgradeBadges.push({ icon: '🏴‍☠️', text: '+5 Held', color: '#fbbf24' });
  if (upgrades.includes('golden_hook')) upgradeBadges.push({ icon: '🪝', text: '+15 Rigdom', color: '#fde047' });
  if (upgrades.includes('luxury_boat')) upgradeBadges.push({ icon: '⛵', text: '+15 Erfaring', color: '#a78bfa' });
  if (Date.now() < conchBaitExpiry) upgradeBadges.push({ icon: '🍯', text: '+6 Held', color: '#f9a8d4' });
  if (Date.now() < hajBloodExpiry) upgradeBadges.push({ icon: '🩸', text: '+15 Held', color: '#fca5a5' });
  if (Date.now() < flyBaitExpiry) upgradeBadges.push({ icon: '🪰', text: '+12 Held', color: '#a3e635' });
  if (Date.now() < perleLimExpiry) upgradeBadges.push({ icon: '🦪', text: '+15 Held', color: '#c4b5fd' });

  function keepFish() {
    const caught = lastCatch;
    play('ui');
    if (caught && shouldAnimateFishToBucket(caught)) {
      useBucketDropStore.getState().enqueue(caught);
    }
    setLastCatch(null);
    setGameState('idle');
  }

  const badge =
    lastCatch.itemType === 'treasure'
      ? { label: '💎 Jackpot!', className: 'bg-yellow-500 text-black' }
      : lastCatch.itemType === 'junk'
        ? { label: '🗑 UPSI!', className: 'bg-stone-600 text-stone-200' }
        : { label: '🏆 Fanget!', className: 'bg-sky-500 text-white' };

  const gradTop =
    lastCatch.itemType === 'treasure'
      ? '#eab308'
      : lastCatch.itemType === 'junk'
        ? '#44403c'
        : lastCatch.rarity === 'Legendarisk'
          ? '#9333ea'
          : '#0284c7';

  return (
    <div className="pointer-events-none fixed inset-0 z-[10031] flex flex-col items-center justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="anim-zoom-in panel-black pointer-events-auto relative mt-auto mb-14 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 p-8 text-center shadow-2xl md:mt-80">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(to bottom, ${gradTop}, transparent)`,
          }}
        />
        <div className="relative z-10">
          <div
            className={`mb-6 inline-flex -rotate-2 transform items-center gap-2 rounded-full px-6 py-1.5 text-sm font-black tracking-wider uppercase ${badge.className}`}
          >
            {badge.label}
          </div>
          <h2 className={`mb-2 text-5xl font-black leading-tight ${rarityTextClass(lastCatch)}`}>
            {lastCatch.species}
          </h2>
          <div className="my-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="mb-1 block text-xs font-bold text-slate-400 uppercase">Vægt</span>
              <span className="font-mono text-2xl font-bold text-white">{lastCatch.weight} kg</span>
            </div>
            <div className="rounded-2xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="mb-1 block text-xs font-bold text-slate-400 uppercase">Værdi</span>
              <span
                className={`font-mono text-2xl font-bold ${lastCatch.value > 0 ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {lastCatch.value} kr.
              </span>
            </div>
          </div>
          <div className="mb-6 flex items-center justify-center gap-2 text-sm font-bold text-emerald-400">
            <span>⭐</span>
            <span>+{xpEarned} XP optjent</span>
          </div>

          {upgradeBadges.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-1.5">
              {upgradeBadges.map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border font-bold"
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.7rem',
                    background: 'rgba(0,0,0,0.35)',
                    borderColor: `${b.color}44`,
                    color: b.color,
                  }}
                >
                  {b.icon} {b.text}
                </span>
              ))}
            </div>
          )}

          {currentStreak > 0 && lastCatch.value > 0 && (
            <div
              className={`mb-4 text-sm font-black uppercase ${
                currentStreak >= 5 ? 'animate-bounce text-orange-300' : 'text-slate-300'
              }`}
            >
              {currentStreak >= 5
                ? `🔥 Perfekt streak: +${streakBonusShown} Rigdom`
                : `⚡ Streak: ${currentStreak}`}
            </div>
          )}

          <button
            type="button"
            onClick={keepFish}
            className={`w-full rounded-2xl border-b-4 py-4 text-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 active:border-b-0 ${
              lastCatch.itemType === 'junk'
                ? 'border-stone-800 bg-stone-600 text-white hover:bg-stone-500'
                : 'border-sky-800 bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {lastCatch.itemType === 'junk' ? 'Smid i spanden' : 'Læg i Spanden'}
          </button>
        </div>
      </div>
    </div>
  );
}
