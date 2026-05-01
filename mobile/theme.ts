export const theme = {
  colors: {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    border: '#2A2A2A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    accentPositive: '#4ADE80',  // verde
    accentNegative: '#F87171',  // rojo
    accentWarning: '#FBBF24',   // amarillo
    accentNeutral: '#60A5FA',   // azul
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 40,
    hero: 56,  // para datos masivos tipo OVR
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
    black: '900' as const,
  },
};

export type Theme = typeof theme;
