import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null; errorInfo: ErrorInfo | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info });
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      const { error, errorInfo } = this.state;
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
          <details className="mt-2 max-w-lg text-left text-slate-400">
            <summary className="cursor-pointer text-sm font-semibold text-slate-500 hover:text-slate-300">
              Vis detaljer
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-800/60 p-4 text-xs leading-relaxed text-slate-300">
              {error.name}: {error.message}
              {error.stack && `\n\n${error.stack}`}
              {errorInfo?.componentStack && `\n\nKomponent-stak:${errorInfo.componentStack}`}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
