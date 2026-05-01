import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { theme } from '../theme';

interface HomeScreenProps {
  onNewCareer: () => void;
}

export function HomeScreen({ onNewCareer }: HomeScreenProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.titleSection}>
          <Text style={styles.titleSubtle}>PROFESSIONAL FOOTBALL LEAGUE</Text>
          <Text style={styles.title}>GRIDIRON</Text>
          <Text style={styles.title}>LEGEND</Text>
          <Text style={styles.subtitle}>A career simulator</Text>
        </View>

        <View style={styles.buttonSection}>
          <Button label="New Career" onPress={onNewCareer} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>v0.1 — MVP</Text>
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
  titleSection: {
    marginTop: theme.spacing.xxl,
  },
  titleSubtle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.hero,
    fontWeight: theme.fontWeight.black,
    lineHeight: 60,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.md,
  },
  buttonSection: {
    marginBottom: theme.spacing.xxl,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
});
