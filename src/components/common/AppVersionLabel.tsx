import { APP_VERSION } from '../../data/version.js';

type AppVersionLabelProps = {
  className?: string;
};

export function AppVersionLabel({ className = '' }: AppVersionLabelProps) {
  return (
    <p
      className={`text-center font-mono text-[10px] font-medium tracking-wide text-white/40 md:text-[11px] ${className}`}
      aria-label={`App version ${APP_VERSION}`}
    >
      <span className="sr-only">App version </span>
      v{APP_VERSION}
    </p>
  );
}
