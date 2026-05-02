import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { CareerState, processOffseasonWealth } from '../../src/engine/careerStep';

interface WealthScreenProps {
  careerState: CareerState;
  onUpdateState: (newState: CareerState) => void;
}

export function WealthScreen({ careerState, onUpdateState }: WealthScreenProps) {
  const handleSkip = () => {
    const newState = processOffseasonWealth(careerState, {
      buyPropertyIds: [],
      sellPropertyIds: [],
      buyVehicleIds: [],
      sellVehicleIds: []
    });
    onUpdateState(newState);
  };

  const balance = (careerState.wealthState.balance / 1000000).toFixed(2);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titleSubtle}>FINANCES</Text>
          <Text style={styles.title}>WEALTH MANAGEMENT</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <Text style={styles.balanceValue}>${balance}M</Text>
          </View>

          <Text style={styles.stubText}>
            Stub — full implementation of properties and vehicles will be added in sub-task 3.3.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button label="Skip" onPress={handleSkip} />
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
  balanceSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  balanceLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  balanceValue: {
    color: theme.colors.accentPositive,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  stubText: {
    color: theme.colors.accentWarning,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
  },
  footer: {
    marginBottom: theme.spacing.xxl,
  },
});
