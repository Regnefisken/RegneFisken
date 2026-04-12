type NumberPadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
};

export function NumberPad({ onDigit, onBackspace, onSubmit }: NumberPadProps) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '-'];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onDigit(k)}
          className="touch-manipulation min-h-[44px] min-w-[44px] rounded-2xl bg-slate-700 py-4 text-2xl font-black text-white transition-colors hover:bg-slate-600 active:scale-95"
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="touch-manipulation min-h-[44px] min-w-[44px] rounded-2xl bg-slate-800 py-4 text-sm font-bold text-slate-300 hover:bg-slate-700"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="touch-manipulation col-span-2 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 text-lg font-black text-white hover:from-emerald-600 hover:to-cyan-600"
      >
        OK
      </button>
    </div>
  );
}
