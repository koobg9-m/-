"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

type Props = { children: ReactNode };

export default class RootErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50 to-orange-50">
          <div className="text-center max-w-md">
            <span className="text-6xl">😿</span>
            <h1 className="text-xl font-bold text-gray-800 mt-4">오류가 발생했습니다</h1>
            <p className="text-gray-600 mt-2 text-sm">잠시 후 다시 시도해 주세요.</p>
            <Link
              href="/"
              className="inline-block mt-6 px-8 py-3 bg-mimi-orange text-white rounded-full font-bold hover:bg-mimi-orange/90"
            >
              홈으로
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
