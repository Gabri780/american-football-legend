import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { CareerState, finalizeCareer } from '../../src/engine/careerStep';

interface CareerSummaryScreenProps {
  careerState: CareerState;
  onExit: () => void;
}

export function CareerSummaryScreen({ careerState, onExit }: CareerSummaryScreenProps) {
  const result = finalizeCareer(careerState);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titleSubtle}>CAREER COMPLETE</Text>
          <Text style={styles.title}>LEGACY SUMMARY</Text>
        </View>

        <View style={styles.mainStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>YEARS</Text>
            <Text style={styles.statValue}>{result.yearsPlayed}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PEAK OVR</Text>
            <Text style={styles.statValue}>{result.peakOverall}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BOWLS</Text>
            <Text style={styles.statValue}>{result.championshipsWon}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Retirement Reason</Text>
            <Text style={styles.detailValue}>{result.retirementReason.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Career Pass Yards</Text>
            <Text style={styles.detailValue}>{result.careerRegularStats.passYards.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Career Pass TDs</Text>
            <Text style={styles.detailValue}>{result.careerRegularStats.passTDs}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Career Rush Yards</Text>
            <Text style={styles.detailValue}>{result.careerRegularStats.rushYards.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button label="Back to Main Menu" onPress={onExit} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
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
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  details: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    textTransform: 'capitalize',
  },
  footer: {
    marginTop: 'auto',
  },
});
