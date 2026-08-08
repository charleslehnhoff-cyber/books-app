"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { XCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <XCircle size={48} color="#ef4444" style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "var(--font-primary)", marginBottom: "0.5rem" }}>Something went wrong.</h2>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", maxWidth: "400px" }}>
            We encountered an unexpected error while trying to load this component.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", background: "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
