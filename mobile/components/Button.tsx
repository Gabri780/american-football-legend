import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', style }: ButtonProps) {
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[
        styles.label,
        variant === 'primary' ? styles.labelPrimary : styles.labelSecondary,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.textPrimary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  labelPrimary: {
    color: theme.colors.background,
  },
  labelSecondary: {
    color: theme.colors.textPrimary,
  },
});
