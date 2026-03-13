import React, { Component } from 'react';
import { Text, View } from 'react-native';

export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fee2e2' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#b91c1c', marginBottom: 10 }}>Something went wrong.</Text>
          <Text style={{ color: '#7f1d1d' }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
