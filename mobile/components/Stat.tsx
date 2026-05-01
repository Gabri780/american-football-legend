import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface StatProps {
  label: string;
  value: string | number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  style?: ViewStyle;
}

export function Stat({ label, value, size = 'md', style }: StatProps) {
  const valueSize = {
    sm: theme.fontSize.lg,
    md: theme.fontSize.xl,
    lg: theme.fontSize.xxl,
    hero: theme.fontSize.hero,
  }[size];

  return (
    <View style={style}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { fontSize: valueSize }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  value: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
  },
});
