'use client';

const TOGGLE_GROUP = 'flex flex-col overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/10';

const OPTION = [
  'size-10 text-sm font-bold transition',
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
].join(' ');

const OPTION_ACTIVE = 'bg-brand text-white';

// Inactive mode styling (hover for feedback)
const OPTION_IDLE = 'text-slate-600 hover:bg-slate-100';

// 2D/3D toggle — one active, one dormant
export default function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: '2d' | '3d';
  onChange: (mode: '2d' | '3d') => void;
}) {
  return (
    <div role="group" aria-label="Map view mode" className={TOGGLE_GROUP}>
      {(['2d', '3d'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          // aria-pressed (toggle state) rather than aria-current
          aria-pressed={mode === option}
          className={`${OPTION} ${mode === option ? OPTION_ACTIVE : OPTION_IDLE}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
