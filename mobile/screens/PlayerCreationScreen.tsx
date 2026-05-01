import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';

export interface PlayerCreationData {
  firstName: string;
  lastName: string;
  position: 'QB' | 'RB' | 'WR';
}

interface PlayerCreationScreenProps {
  onStart: (data: PlayerCreationData) => void;
  onBack: () => void;
}

const POSITIONS: Array<{ value: 'QB' | 'RB' | 'WR'; label: string; description: string }> = [
  { value: 'QB', label: 'QB', description: 'Quarterback. The face of the franchise.' },
  { value: 'RB', label: 'RB', description: 'Running Back. Physical, short careers.' },
  { value: 'WR', label: 'WR', description: 'Wide Receiver. Speed and explosive plays.' },
];

export function PlayerCreationScreen({ onStart, onBack }: PlayerCreationScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState<'QB' | 'RB' | 'WR' | null>(null);

  const canStart = firstName.trim().length > 0
    && lastName.trim().length > 0
    && position !== null;

  const handleStart = () => {
    if (!canStart || !position) return;
    onStart({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position,
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.titleSubtle}>CREATE YOUR PLAYER</Text>
          <Text style={styles.title}>NEW CAREER</Text>
        </View>

        {/* Name section */}
        <View style={styles.section}>
          <Text style={styles.label}>NAME</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            maxLength={20}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            maxLength={20}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Position section */}
        <View style={styles.section}>
          <Text style={styles.label}>POSITION</Text>
          {POSITIONS.map(p => (
            <Pressable
              key={p.value}
              onPress={() => setPosition(p.value)}
              style={[
                styles.positionCard,
                position === p.value && styles.positionCardSelected,
              ]}
            >
              <Text style={[
                styles.positionLabel,
                position === p.value && styles.positionLabelSelected,
              ]}>
                {p.label}
              </Text>
              <Text style={[
                styles.positionDescription,
                position === p.value && styles.positionDescriptionSelected,
              ]}>
                {p.description}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Start button */}
        <View style={styles.footer}>
          <Button
            label="Start Career"
            onPress={handleStart}
            style={!canStart ? styles.disabledButton : undefined}
          />
          <Text style={styles.footerHint}>
            Your team will be assigned at random.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginBottom: theme.spacing.lg,
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  titleSubtle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  positionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  positionCardSelected: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.textPrimary,
  },
  positionLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  positionLabelSelected: {
    color: theme.colors.background,
  },
  positionDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  positionDescriptionSelected: {
    color: theme.colors.background,
    opacity: 0.7,
  },
  footer: {
    marginTop: 'auto',
  },
  footerHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.4,
  },
});
