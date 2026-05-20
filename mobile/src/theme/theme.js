/**
 * Design Token System — Dark mode first, light mode supported.
 * All screens should import `theme` and use these tokens for consistency.
 */

export const darkColors = {
  // Backgrounds
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceElevated: '#242440',
  surfaceActive: '#2d2d50',
  card: '#1e1e35',

  // Primary brand
  primary: '#7C6FFF',
  primaryLight: '#9f96ff',
  primaryDark: '#5a4fcc',
  primarySurface: 'rgba(124, 111, 255, 0.12)',

  // Accent
  accent: '#ec4899',
  accentLight: '#f472b6',

  // Text
  text: '#f1f1f6',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textInverse: '#111827',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Borders & dividers
  border: '#2d2d50',
  divider: '#1f1f38',

  // Tab bar
  tabBarBackground: '#0f0f1a',
  tabBarBorder: '#1a1a2e',
  tabBarActive: '#7C6FFF',
  tabBarInactive: '#6b7280',

  // Input
  inputBackground: '#1a1a2e',
  inputBorder: '#2d2d50',
  inputBorderFocused: '#7C6FFF',
  inputText: '#f1f1f6',
  inputPlaceholder: '#6b7280',

  // Chat
  bubbleMine: '#7C6FFF',
  bubbleOther: '#242440',
  bubbleTextMine: '#ffffff',
  bubbleTextOther: '#f1f1f6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.65)',
  shimmer: '#2d2d50',

  // Gradient
  gradientStart: '#7C6FFF',
  gradientEnd: '#ec4899',
};

export const lightColors = {
  // Backgrounds
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceActive: '#f1f5f9',
  card: '#ffffff',

  // Primary brand
  primary: '#6C63FF',
  primaryLight: '#8b85ff',
  primaryDark: '#4f46e5',
  primarySurface: 'rgba(108, 99, 255, 0.08)',

  // Accent
  accent: '#ec4899',
  accentLight: '#f472b6',

  // Text
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#f1f1f6',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Borders & dividers
  border: '#e5e7eb',
  divider: '#f3f4f6',

  // Tab bar
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabBarActive: '#6C63FF',
  tabBarInactive: '#9ca3af',

  // Input
  inputBackground: '#f8fafc',
  inputBorder: '#e5e7eb',
  inputBorderFocused: '#6C63FF',
  inputText: '#111827',
  inputPlaceholder: '#9ca3af',

  // Chat
  bubbleMine: '#6C63FF',
  bubbleOther: '#f1f5f9',
  bubbleTextMine: '#ffffff',
  bubbleTextOther: '#333333',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.45)',
  shimmer: '#e5e7eb',

  // Gradient
  gradientStart: '#6C63FF',
  gradientEnd: '#ec4899',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  hero: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '500' },
  captionSmall: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  label: { fontSize: 14, fontWeight: '600' },
  button: { fontSize: 16, fontWeight: '700' },
  buttonSmall: { fontSize: 14, fontWeight: '600' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#7C6FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: { damping: 15, stiffness: 180, mass: 1 },
};

// Default to dark mode
let _mode = 'dark';

export function setColorMode(mode) {
  _mode = mode;
}

export function getColorMode() {
  return _mode;
}

export function getColors() {
  return _mode === 'dark' ? darkColors : lightColors;
}

// Convenience: export current dark colors as default
export const colors = darkColors;

export default {
  colors,
  darkColors,
  lightColors,
  spacing,
  radius,
  typography,
  shadows,
  animation,
  getColors,
  setColorMode,
  getColorMode,
};
