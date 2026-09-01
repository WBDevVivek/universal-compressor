'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Props {
  children: ReactNode;
  title: string;
  description: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Universal Tool Wrapper - Features dynamic client-side error boundary containment
 * and standardized privacy "Ghost Mode" indicator headers.
 */
export class ToolWrapper extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Granular Pipeline Crash Caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-3xl mx-auto my-8 border-red-500/30 bg-red-950/10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 inline-flex items-center justify-center rounded-xl bg-red-500/10 text-2xl text-red-400">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-red-200">Execution Error</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Something went wrong during local file streaming. {this.state.errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Reset Pipeline
            </button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-4xl mx-auto my-6 border-slate-900 bg-slate-900/10">
        {/* Isolated Context Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900/60 pb-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">{this.props.title}</h1>
            <p className="text-xs font-medium text-slate-400">{this.props.description}</p>
          </div>
          <div className="flex items-center">
            <StatusBadge type="success" label="👻 Ghost Mode Active" className="bg-emerald-500/5 text-emerald-400/90 text-[10px]" />
          </div>
        </header>

        {/* Dynamic Sandbox View */}
        <div className="w-full">
          {this.props.children}
        </div>
      </Card>
    );
  }
}
