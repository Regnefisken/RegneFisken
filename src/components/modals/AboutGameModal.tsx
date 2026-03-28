import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

/** Legacy: legacy-game.html showAboutModal */
export function AboutGameModal() {
  const show = useUIStore((s) => s.showAboutModal);
  const setShowAboutModal = useUIStore((s) => s.setShowAboutModal);
  const { play } = useAudio();

  if (!show) return null;

  function close() {
    play('ui');
    setShowAboutModal(false);
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-[8px]"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      onClick={close}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="about-game-title"
        className="panel-dark anim-zoom-in max-h-[80dvh] w-[92%] max-w-[480px] overflow-y-auto rounded-3xl border-2 border-sky-400/30 p-8 shadow-2xl"
        style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 id="about-game-title" className="text-xl font-black text-white">
            ❓ Om spillet
          </h3>
          <button
            type="button"
            onClick={close}
            className="cursor-pointer border-none bg-transparent text-xl text-slate-400"
          >
            ✕
          </button>
        </div>
        <h3 className="mb-3 text-lg font-black text-white">🎣 Velkommen til RegneFisken 3D!</h3>
        <p className="mb-5 text-[0.92rem] leading-relaxed text-slate-300">
          RegneFisken er et fiskespil, hvor du kombinerer afslappet fiskeri med matematik-udfordringer. Målet er at
          fange fisk, løse regnestykker, optjene XP og mønter, og udforske nye områder. Perfekt til at træne hjernen
          mens du slapper af ved vandet!
        </p>
        <h4 className="mb-2 text-base font-bold text-sky-400">🌊 Hvad går spillet ud på?</h4>
        <ul className="mb-5 list-disc space-y-1 pl-5 text-[0.92rem] leading-relaxed text-slate-300">
          <li>Du starter på Den Gamle Mole og kaster din snøre ud i vandet.</li>
          <li>Når en fisk bider, skal du løse et regnestykke for at hale den ind.</li>
          <li>Fang fisk for at tjene mønter og XP — brug dem i butikken til opgraderinger.</li>
          <li>Nå højere levels for at låse op for sjældne fisk, skatte og nye områder.</li>
        </ul>
        <h4 className="mb-2 text-base font-bold text-sky-400">🎮 Trin-for-trin tutorial</h4>
        <ol className="mb-5 list-decimal space-y-1 pl-5 text-[0.92rem] leading-relaxed text-slate-300">
          <li>
            <strong className="text-white">Kast snøren:</strong> Klik på &quot;Kast ud&quot; og vent på bid.
          </li>
          <li>
            <strong className="text-white">Bid!</strong> Klik hurtigt når &quot;BID!&quot; vises — du har begrænset tid!
          </li>
          <li>
            <strong className="text-white">Løs regnestykket:</strong> Indtast svaret og tryk enter. Sværhedsgrad stiger
            med dit level.
          </li>
          <li>
            <strong className="text-white">Fangsten:</strong> Fisken har en kroneværdi og vægt. Sæl den for mønter.
          </li>
          <li>
            <strong className="text-white">Spanden:</strong> Fyld spanden og sælg alt på én gang for streak-bonus!
          </li>
        </ol>
        <h4 className="mb-2 text-base font-bold text-sky-400">💡 Tips og mekanikker</h4>
        <ul className="mb-5 list-disc space-y-1 pl-5 text-[0.92rem] leading-relaxed text-slate-300">
          <li>
            <strong className="text-white">Vejr-system:</strong> Vejret skifter mellem sol, regn og storm — oplev
            forskellige visuelle effekter!
          </li>
          <li>
            <strong className="text-white">Butikken:</strong> Køb bedre stang (mere tid), krog (sjældnere fisk) eller
            større spand.
          </li>
          <li>
            <strong className="text-white">Områder:</strong> Lås nye steder op via navigationsknappen — hvert sted har
            unikke fisk.
          </li>
          <li>
            <strong className="text-white">Mål:</strong> Gennemfør mål for ekstra XP og mønter. Tjek dem løbende!
          </li>
          <li>
            <strong className="text-white">Pro tip:</strong> Udforsk molen grundigt — der er hemmeligheder gemt!
          </li>
        </ul>
        <p className="mb-5 text-[0.82rem] italic text-slate-500">
          RegneFisken er skabt af Anders E. D. Larsen.
          <br />
          © 2026 – Gratis nu • Alle rettigheder forbeholdt.
          <br />
          Har du spørgsmål eller feedback? Skriv gerne til{' '}
          <a href="mailto:Anderserner@gmail.com" className="text-emerald-400 hover:underline">
            Anderserner@gmail.com
          </a>
        </p>
        <button
          type="button"
          onClick={close}
          className="w-full cursor-pointer rounded-xl border-none bg-sky-500 py-3 text-base font-bold text-white"
        >
          Luk
        </button>
      </div>
    </div>
  );
}
