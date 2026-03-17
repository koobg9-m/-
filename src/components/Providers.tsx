"use client";

import { Component, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}
