import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-900 p-6 text-center text-white"
          style={{
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
          }}
        >
          <p className="max-w-md text-lg font-bold text-slate-200">
            Noget gik galt under visningen af spillet.
          </p>
          <button
            type="button"
            className="touch-manipulation rounded-2xl bg-sky-600 px-8 py-3.5 text-base font-black text-white shadow-lg transition-colors hover:bg-sky-500 active:scale-[0.98]"
            onClick={() => window.location.reload()}
          >
            Genindlæs siden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
