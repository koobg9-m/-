"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

type Props = { children: ReactNode };
type State = { hasError: boolean; isChunkError?: boolean };

export default class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError = error?.name === "ChunkLoadError" || /Loading chunk|ChunkLoadError/i.test(String(error?.message ?? ""));
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error) {
    if (error?.name === "ChunkLoadError" || /Loading chunk|ChunkLoadError/i.test(String(error?.message ?? ""))) {
      this.setState({ isChunkError: true });
    }
  }

  handleRetry = () => {
    if (this.state.isChunkError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50 to-orange-50">
          <div className="text-center max-w-md">
            <span className="text-6xl">😿</span>
            <h1 className="text-xl font-bold text-gray-800 mt-4">오류가 발생했습니다</h1>
            <p className="text-gray-600 mt-2 text-sm">
              {this.state.isChunkError ? "페이지 로딩 중 문제가 발생했습니다. 새로고침해 주세요." : "잠시 후 다시 시도해 주세요."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button
                onClick={this.handleRetry}
                className="px-8 py-3 bg-mimi-orange text-white rounded-full font-bold hover:bg-mimi-orange/90"
              >
                {this.state.isChunkError ? "새로고침" : "다시 시도"}
              </button>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-white text-mimi-orange border-2 border-mimi-orange rounded-full font-bold hover:bg-mimi-orange/10"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
