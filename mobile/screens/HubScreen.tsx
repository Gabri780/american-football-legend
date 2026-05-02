import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { CareerState } from '../../src/engine/careerStep';

interface HubScreenProps {
  careerState: CareerState;
  onPlayNextGame: () => void;
  onOpenContract: () => void;
  onOpenWealth: () => void;
  onRetireDecision: (retire: boolean) => void;
  onStartNextSeason: () => void;
  onViewSummary: () => void;
}

export function HubScreen({
  careerState,
  onPlayNextGame,
  onOpenContract,
  onOpenWealth,
  onRetireDecision,
  onStartNextSeason,
  onViewSummary,
}: HubScreenProps) {
  const { currentPlayer, phase, currentTeams, currentTeamId } = careerState;
  const userTeam = currentTeams.find(t => t.id === currentTeamId);

  const renderSeasonStatus = () => {
    if (phase === 'preseason' || phase === 'regular_season') {
      let wins = 0;
      let losses = 0;
      let ties = 0;

      for (let i = 0; i < careerState.currentRegularGameIndex; i++) {
        const g = careerState.userRegularGamesQueue[i];
        if (g.winnerTeamId === currentTeamId) wins++;
        else if (g.winnerTeamId === null) ties++;
        else losses++;
      }
      const wlt = `${wins}-${losses}-${ties}`;
      return (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SEASON STATUS</Text>
          <Text style={styles.cardValue}>WEEK {careerState.gamesPlayedThisYear + 1} / 17</Text>
          <Text style={styles.cardSubValue}>{wlt}</Text>
        </View>
      );
    }
    if (phase === 'playoffs') {
      return (
        <View style={[styles.card, { borderColor: theme.colors.accentWarning }]}>
          <Text style={styles.cardLabel}>SEASON STATUS</Text>
          <Text style={[styles.cardValue, { color: theme.colors.accentWarning }]}>PLAYOFFS</Text>
        </View>
      );
    }
    if (phase === 'retired') {
      return (
        <View style={[styles.card, { borderColor: theme.colors.accentNegative }]}>
          <Text style={styles.cardLabel}>SEASON STATUS</Text>
          <Text style={[styles.cardValue, { color: theme.colors.accentNegative }]}>RETIRED</Text>
        </View>
      );
    }
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>SEASON STATUS</Text>
        <Text style={styles.cardValue}>OFFSEASON</Text>
      </View>
    );
  };

  const renderActionButton = () => {
    switch (phase) {
      case 'preseason':
      case 'regular_season':
        return <Button label="Play Next Game" onPress={onPlayNextGame} />;
      case 'playoffs':
        return <Button label="Play Next Playoff Game" onPress={onPlayNextGame} variant="primary" />;
      case 'offseason_contracts':
        return <Button label="Negotiate Contract" onPress={onOpenContract} />;
      case 'offseason_wealth':
        return <Button label="Manage Finances" onPress={onOpenWealth} />;
      case 'offseason_retirement_choice':
        return (
          <View style={styles.buttonGroup}>
            <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
              <Button label="Retire" onPress={() => onRetireDecision(true)} style={{ backgroundColor: theme.colors.accentNegative }} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Continue" onPress={() => onRetireDecision(false)} />
            </View>
          </View>
        );
      case 'offseason_ready':
        return <Button label="Start Next Season" onPress={onStartNextSeason} />;
      case 'retired':
        return <Button label="View Career Summary" onPress={onViewSummary} />;
      default:
        return null;
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Player Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.playerName}>{currentPlayer.firstName} {currentPlayer.lastName}</Text>
            <Text style={styles.playerMeta}>
              {currentPlayer.position} · Year {careerState.yearsPlayed + 1} · Age {currentPlayer.age}
            </Text>
          </View>
          <View style={styles.ovrBadge}>
            <Text style={styles.ovrLabel}>OVR</Text>
            <Text style={styles.ovrValue}>{currentPlayer.overall}</Text>
          </View>
        </View>

        {/* Team Card */}
        {userTeam && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CURRENT TEAM</Text>
            <Text style={styles.cardValue}>{userTeam.city.toUpperCase()} {userTeam.name.toUpperCase()}</Text>
          </View>
        )}

        {/* Status Card */}
        {renderSeasonStatus()}

        {/* Contract Teaser */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CONTRACT</Text>
          <Text style={styles.cardValue}>{careerState.currentContract.yearsRemaining} YEARS REMAINING</Text>
          <Text style={styles.cardSubValue}>${(careerState.currentContract.salaryPerYear / 1000000).toFixed(1)}M / YEAR</Text>
        </View>

        {/* Wealth Teaser */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FINANCES</Text>
          <Text style={styles.cardValue}>${(careerState.wealthState.balance / 1000000).toFixed(2)}M</Text>
          <Text style={styles.cardSubValue}>Liquid Capital</Text>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          {renderActionButton()}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  playerName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  playerMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.xs,
  },
  ovrBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.textPrimary,
    minWidth: 70,
  },
  ovrLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  ovrValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  cardLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  cardValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },
  cardSubValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
});
