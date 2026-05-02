import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { Game } from '../../src/engine/game';
import { Player } from '../../src/engine/player';
import { QBDriveStats, RBDriveStats, WRDriveStats } from '../../src/engine/playerDriveStats';

interface GameResultScreenProps {
  game: Game;
  userPlayer: Player;
  userTeamId: string;
  wasPlayoff: boolean;
  onContinue: () => void;
}

export function GameResultScreen({ game, userPlayer, userTeamId, wasPlayoff, onContinue }: GameResultScreenProps) {
  const isHome = game.homeTeamId === userTeamId;
  const userScore = isHome ? game.homeScore : game.awayScore;
  const oppScore = isHome ? game.awayScore : game.homeScore;
  const isWin = game.winnerTeamId === userTeamId;
  const isTie = game.winnerTeamId === null;

  const renderStats = () => {
    const stats = game.userPlayerStats;
    if (!stats) return <Text style={styles.noStats}>No stats available for this game.</Text>;

    if (userPlayer.position === 'QB') {
      const qb = stats as QBDriveStats;
      return (
        <View style={styles.statsGrid}>
          {renderStatItem('PASS YDS', qb.passYards)}
          {renderStatItem('CMP/ATT', `${qb.completions}/${qb.passAttempts}`)}
          {renderStatItem('PASS TD', qb.passTDs)}
          {renderStatItem('INT', qb.interceptions)}
          {renderStatItem('RUSH YDS', qb.rushYards)}
          {renderStatItem('RUSH TD', qb.rushTDs)}
        </View>
      );
    }

    if (userPlayer.position === 'RB') {
      const rb = stats as RBDriveStats;
      return (
        <View style={styles.statsGrid}>
          {renderStatItem('CARRIES', rb.carries)}
          {renderStatItem('RUSH YDS', rb.rushYards)}
          {renderStatItem('RUSH TD', rb.rushTDs)}
          {renderStatItem('RECEPTIONS', rb.receptions)}
          {renderStatItem('REC YDS', rb.receivingYards)}
          {renderStatItem('FUMBLES', rb.fumbles)}
        </View>
      );
    }

    if (userPlayer.position === 'WR') {
      const wr = stats as WRDriveStats;
      return (
        <View style={styles.statsGrid}>
          {renderStatItem('TARGETS', wr.targets)}
          {renderStatItem('RECEPTIONS', wr.receptions)}
          {renderStatItem('REC YDS', wr.receivingYards)}
          {renderStatItem('REC TD', wr.receivingTDs)}
          {renderStatItem('DROPS', wr.drops)}
        </View>
      );
    }

    return null;
  };

  const renderStatItem = (label: string, value: string | number) => (
    <View key={label} style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titleSubtle}>{wasPlayoff ? 'POSTSEASON' : 'REGULAR SEASON'}</Text>
          <Text style={styles.title}>GAME RESULT</Text>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamId}>{game.awayTeamId.substring(0, 3).toUpperCase()}</Text>
              <Text style={styles.scoreValue}>{game.awayScore}</Text>
            </View>
            <Text style={styles.atSign}>@</Text>
            <View style={styles.teamInfo}>
              <Text style={styles.scoreValue}>{game.homeScore}</Text>
              <Text style={styles.teamId}>{game.homeTeamId.substring(0, 3).toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.resultBadgeContainer}>
            <View style={[
              styles.resultBadge,
              isWin ? styles.winBadge : isTie ? styles.tieBadge : styles.lossBadge
            ]}>
              <Text style={styles.resultText}>
                {isWin ? 'WIN' : isTie ? 'TIE' : 'LOSS'}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR PERFORMANCE</Text>
          <View style={styles.statsContainer}>
            {renderStats()}
          </View>
        </View>

        {/* Narrative Card */}
        {(game.summary || game.highlightPlay) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HIGHLIGHTS</Text>
            <View style={styles.narrativeContainer}>
              {game.summary ? <Text style={styles.summaryText}>{game.summary}</Text> : null}
              {game.highlightPlay ? (
                <View style={styles.highlightPlayBox}>
                  <Text style={styles.highlightPlayText}>{game.highlightPlay}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button label="Continue" onPress={onContinue} />
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
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
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
  scoreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-around',
  },
  teamId: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  scoreValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.hero / 1.5,
    fontWeight: theme.fontWeight.black,
  },
  atSign: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginHorizontal: theme.spacing.md,
    opacity: 0.5,
  },
  resultBadgeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  resultBadge: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
    borderRadius: 4,
  },
  winBadge: {
    backgroundColor: theme.colors.accentPositive,
  },
  lossBadge: {
    backgroundColor: theme.colors.accentNegative,
  },
  tieBadge: {
    backgroundColor: theme.colors.textSecondary,
  },
  resultText: {
    color: theme.colors.background,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },
  noStats: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  narrativeContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },
  highlightPlayBox: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  highlightPlayText: {
    color: theme.colors.accentNeutral,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 'auto',
  },
});
