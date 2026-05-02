import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { CareerState, processOffseasonContracts } from '../../src/engine/careerStep';

interface ContractDecisionScreenProps {
  careerState: CareerState;
  onUpdateState: (newState: CareerState) => void;
}

export function ContractDecisionScreen({ careerState, onUpdateState }: ContractDecisionScreenProps) {
  const handleSkip = () => {
    // Stub: auto-decline/skip leads to either a new contract or retirement if no market
    const newState = processOffseasonContracts(careerState, null);
    onUpdateState(newState);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titleSubtle}>OFFSEASON</Text>
          <Text style={styles.title}>CONTRACT DECISION</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.stubText}>
            Stub — full implementation of contract negotiations will be added in sub-task 3.2.
          </Text>
          <Text style={styles.description}>
            Skipping will auto-decline any extension offers and move to the next phase.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button label="Skip (Auto-decline)" onPress={handleSkip} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: theme.spacing.xl,
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
  content: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stubText: {
    color: theme.colors.accentWarning,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginBottom: theme.spacing.xxl,
  },
});
