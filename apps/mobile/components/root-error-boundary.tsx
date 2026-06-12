import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { captureException } from '@/lib/sentry';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

/**
 * Top-level error boundary for the mobile app.
 *
 * Catches render errors that would otherwise show a blank white screen on
 * release builds. Displays a minimal fallback UI with the error summary and a
 * "Coba Lagi" button that resets the boundary. Sentry or any other reporter
 * can be wired into `componentDidCatch` later.
 *
 * Note: does NOT catch async errors (promises, setTimeout), event handlers,
 * or errors in React Query. Those are handled by each hook's onError.
 */
export class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[RootErrorBoundary] caught error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });

    // Report to Sentry — swallows if DSN not configured so tests stay green.
    captureException(error, {
      componentStack: info.componentStack,
      source: 'RootErrorBoundary',
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage = this.state.error?.message || 'Terjadi kesalahan yang tidak diketahui.';

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Aplikasi Mengalami Kendala</Text>
          <Text style={styles.description}>
            Ada bagian dari aplikasi yang gagal memuat. Kami sudah mencatat masalah ini. Coba muat ulang atau tutup dan buka kembali aplikasi.
          </Text>

          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>Detail teknis</Text>
            <Text style={styles.errorText} numberOfLines={6}>
              {errorMessage}
            </Text>
          </View>

          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Coba Lagi</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    width: '100%',
    maxWidth: 420,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontFamily: 'monospace',
    lineHeight: 17,
  },
  button: {
    backgroundColor: '#0E7490',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
