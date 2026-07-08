import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorAlert } from './ErrorAlert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { children } = this.props as Props;
    if (this.state.hasError) {
      return <ErrorAlert message="Ocorreu um erro inesperado na aplicação." />;
    }
    return children;
  }
}
