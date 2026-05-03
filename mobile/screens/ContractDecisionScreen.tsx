import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Divider } from '../components/Divider';
import { theme } from '../theme';
import { CareerState, processOffseasonContracts } from '../../src/engine/careerStep';
import { ContractOffer } from '../../src/engine/contracts';
import { Team } from '../../src/engine/team';

interface ContractDecisionScreenProps {
  careerState: CareerState;
  allTeams: Team[];
  userTeam?: Team;
  onUpdateState: (newState: CareerState) => void;
}

export function ContractDecisionScreen({
  careerState,
  allTeams,
  userTeam,
  onUpdateState
}: ContractDecisionScreenProps) {
  const { pendingContractOffers, pendingContractContext, currentContract } = careerState;

  const handleSign = (offer: ContractOffer) => {
    const newState = processOffseasonContracts(careerState, offer);
    onUpdateState(newState);
  };

  const handleRetire = () => {
    Alert.alert(
      "Confirm Retirement",
      "Are you sure you want to reject all offers and retire? This career will end.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retire",
          style: "destructive",
          onPress: () => {
            const newState = processOffseasonContracts(careerState, null);
            onUpdateState(newState);
          }
        }
      ]
    );
  };

  const handleRetireNoMarket = () => {
    // No alert needed if there are no offers, user has no choice
    const newState = processOffseasonContracts(careerState, null);
    onUpdateState(newState);
  };

  const getTeamName = (teamId: string) => {
    const team = allTeams.find(t => t.id === teamId);
    if (!team) return "Unknown Team";
    return `${team.city.toUpperCase()} ${team.name.toUpperCase()}`;
  };

  const sortOffers = (offers: ContractOffer[]) => {
    return [...offers].sort((a, b) => {
      // 1. Extension first
      if (a.isExtension && !b.isExtension) return -1;
      if (!a.isExtension && b.isExtension) return 1;
      // 2. Total value descending
      const valA = a.years * a.salaryPerYear;
      const valB = b.years * b.salaryPerYear;
      return valB - valA;
    });
  };

  const sortedOffers = pendingContractOffers ? sortOffers(pendingContractOffers) : [];
  const hasOffers = sortedOffers.length > 0;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.titleSubtle}>OFFSEASON</Text>
          <Text style={styles.title}>CONTRACT DECISION</Text>
        </View>

        {/* 2. Context Card */}
        {pendingContractContext && (
          <Card style={styles.contextCard}>
            <Text style={[
              styles.contextText,
              pendingContractContext.wasJustCut && { color: theme.colors.accentWarning }
            ]}>
              {pendingContractContext.isExtensionWindow &&
                "Your contract has 1 year remaining. Your current team is offering an extension. You can also test free agency next offseason."}
              {pendingContractContext.wasJustCut &&
                `${getTeamName(pendingContractContext.currentContract.teamId)} has released you. Available offers:`}
              {!pendingContractContext.isExtensionWindow && !pendingContractContext.wasJustCut &&
                "Your contract has expired. You are a free agent."}
            </Text>
          </Card>
        )}

        {/* 3. Current Contract Card */}
        <Text style={styles.sectionTitle}>YOUR CURRENT STATUS</Text>
        <Card style={styles.statusCard}>
          <View style={styles.teamRow}>
            <View style={styles.teamIconStub} />
            <View>
              <Text style={styles.teamName}>
                {userTeam ? `${userTeam.city} ${userTeam.name}` : "Free Agent"}
              </Text>
              <Text style={styles.contractDetail}>
                {currentContract.yearsRemaining > 0
                  ? `${currentContract.yearsRemaining} years left`
                  : "Contract Expired"}
              </Text>
            </View>
          </View>
          <Divider style={styles.cardDivider} />
          <View style={styles.salaryRow}>
            <View>
              <Text style={styles.salaryLabel}>SALARY / YEAR</Text>
              <Text style={styles.salaryValue}>${currentContract.salaryPerYear.toFixed(1)}M</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.salaryLabel}>REMAINING</Text>
              <Text style={styles.salaryValue}>${(currentContract.yearsRemaining * currentContract.salaryPerYear).toFixed(1)}M</Text>
            </View>
          </View>
        </Card>

        {/* 4. Offers List */}
        <Text style={styles.sectionTitle}>AVAILABLE OFFERS</Text>

        {!hasOffers ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No offers received. The market is silent.</Text>
            <Button
              label="Retire"
              onPress={handleRetireNoMarket}
              style={{ backgroundColor: theme.colors.accentNegative }}
            />
          </Card>
        ) : (
          <View style={styles.offersContainer}>
            {sortedOffers.map((offer, idx) => (
              <Card key={`${offer.teamId}-${idx}`} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTeamName}>{getTeamName(offer.teamId)}</Text>
                  <View style={styles.badgeContainer}>
                    {offer.isCurrentTeam && (
                      <View style={[styles.badge, { backgroundColor: theme.colors.accentNeutral }]}>
                        <Text style={styles.badgeText}>CURRENT TEAM</Text>
                      </View>
                    )}
                    {offer.isContender && (
                      <View style={[styles.badge, { backgroundColor: theme.colors.accentPositive }]}>
                        <Text style={styles.badgeText}>CONTENDER</Text>
                      </View>
                    )}
                    {offer.isExtension && (
                      <View style={[styles.badge, { backgroundColor: theme.colors.accentNeutral }]}>
                        <Text style={styles.badgeText}>EXTENSION</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.offerStatsRow}>
                  <View style={styles.offerStat}>
                    <Text style={styles.offerStatLabel}>LENGTH</Text>
                    <Text style={styles.offerStatValue}>{offer.years} years</Text>
                  </View>
                  <View style={styles.offerStat}>
                    <Text style={styles.offerStatLabel}>PER YEAR</Text>
                    <Text style={styles.offerStatValue}>${offer.salaryPerYear.toFixed(1)}M</Text>
                  </View>
                </View>

                <Divider style={styles.cardDivider} />

                <View style={styles.offerStatsRow}>
                  <View style={styles.offerStat}>
                    <Text style={styles.offerStatLabel}>TOTAL VALUE</Text>
                    <Text style={styles.offerStatValue}>${(offer.years * offer.salaryPerYear).toFixed(1)}M</Text>
                  </View>
                  <View style={styles.offerStat}>
                    <Text style={styles.offerStatLabel}>GUARANTEED</Text>
                    <Text style={styles.offerStatValue}>${offer.guaranteedTotal.toFixed(1)}M</Text>
                  </View>
                </View>

                <Button
                  label="Sign"
                  onPress={() => handleSign(offer)}
                  style={styles.signButton}
                />
              </Card>
            ))}
          </View>
        )}

        {/* 5. Footer */}
        {hasOffers && (
          <View style={styles.footer}>
            <Text style={styles.footerInfo}>You can reject all offers if you want to retire now.</Text>
            <Button
              variant="secondary"
              label="Reject all and retire"
              onPress={handleRetire}
              style={styles.retireButton}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  titleSubtle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
  },
  contextCard: {
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accentNeutral,
  },
  contextText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIconStub: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.md,
  },
  teamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  contractDetail: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  cardDivider: {
    marginVertical: theme.spacing.md,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 2,
  },
  salaryValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  offersContainer: {
    gap: theme.spacing.md,
  },
  offerCard: {
    marginBottom: theme.spacing.sm,
  },
  offerHeader: {
    marginBottom: theme.spacing.md,
  },
  offerTeamName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },
  offerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offerStat: {
    flex: 1,
  },
  offerStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 2,
  },
  offerStatValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  signButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerInfo: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  retireButton: {
    borderColor: theme.colors.accentNegative,
  },
});
