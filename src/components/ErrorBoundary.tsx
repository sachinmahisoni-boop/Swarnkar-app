import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Swarnkar ERP:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-white">
          <div className="max-w-md w-full bg-stone-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">त्रुटि (Application Error)</h2>
              <p className="text-xs text-stone-400">
                ऐप निष्पादन में अस्थाई त्रुटि आई है। आपका डेटा सुरक्षित है।
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>पेज रिफ्रेश करें (Reload ERP)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
