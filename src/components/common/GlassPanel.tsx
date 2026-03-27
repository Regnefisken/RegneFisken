import type { CSSProperties, ReactNode } from 'react';

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function GlassPanel({ children, className = '', style }: GlassPanelProps) {
  return (
    <div className={`btn-glass rounded-2xl border border-white/20 ${className}`} style={style}>
      {children}
    </div>
  );
}
