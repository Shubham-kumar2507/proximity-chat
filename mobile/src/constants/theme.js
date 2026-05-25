/**
 * Extended Design Tokens for Profile Section
 * Imports base theme and adds profile-specific tokens.
 * All profile components should import from this file.
 */

import baseTheme, {
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
} from '../theme/theme';

// ─── Mood Gradient Presets ─────────────────────────────────────────────
export const MOOD_PRESETS = [
  { key: 'energetic', emoji: '🔥', label: 'Energetic', colors: ['#FF6B35', '#FF2D7E'] },
  { key: 'excited', emoji: '✨', label: 'Excited', colors: ['#FFD93D', '#FF6B35'] },
  { key: 'chill', emoji: '😎', label: 'Chill', colors: ['#4FACFE', '#00F2FE'] },
  { key: 'calm', emoji: '💜', label: 'Calm', colors: ['#A18CD1', '#FBC2EB'] },
  { key: 'focused', emoji: '🌿', label: 'Focused', colors: ['#43E97B', '#38F9D7'] },
  { key: 'lowkey', emoji: '🖤', label: 'Low-key', colors: ['#434343', '#000000'] },
];

// ─── Neon Palette (for interest pills, cycles in order) ───────────────
export const NEON_PALETTE = [
  '#FF2D7E',
  '#00F2FE',
  '#FFD93D',
  '#43E97B',
  '#A18CD1',
  '#FF6B35',
];

// ─── Hot Take Gradient Options ─────────────────────────────────────────
export const HOT_TAKE_GRADIENTS = [
  { key: 'A', label: 'Fire', colors: ['#FF416C', '#FF4B2B'] },
  { key: 'B', label: 'Dreamy', colors: ['#654EA3', '#EAAFC8'] },
  { key: 'C', label: 'Fresh', colors: ['#11998E', '#38EF7D'] },
  { key: 'D', label: 'Golden', colors: ['#F7971E', '#FFD200'] },
];

// ─── Neighborhood Title Presets (Phase 2) ──────────────────────────────
export const NEIGHBORHOOD_TITLES = [
  { key: 'downtown_regular', emoji: '🏙️', label: 'Downtown Regular', color: '#4FACFE' },
  { key: 'coffee_connoisseur', emoji: '☕', label: 'Coffee Shop Connoisseur', color: '#FFD93D' },
  { key: 'midnight_roamer', emoji: '🌙', label: 'Midnight Roamer', color: '#A18CD1' },
  { key: 'connector', emoji: '🤝', label: 'Connector', color: '#43E97B' },
  { key: 'quick_responder', emoji: '⚡', label: 'Quick Responder', color: '#FF6B35' },
  { key: 'local_legend', emoji: '🌟', label: 'Local Legend', color: '#FF2D7E' },
];

// ─── Profile-specific spacing & sizing ─────────────────────────────────
export const profileTokens = {
  photoSize: 120,
  ringSize: 136,        // photoSize + 16 for gradient ring padding
  ringStroke: 4,
  widgetPadding: 16,
  widgetGap: 12,
  widgetRadius: 16,
  pillHeight: 32,
  pillPaddingH: 14,
  pillBorderWidth: 1.5,
  statusBarMaxChars: 60,
  hotTakeMaxChars: 120,
  maxInterests: 10,
  maxWidgets: 4,
  animStagger: 80,
  pillStagger: 40,
  anthemArtSize: 60,
  // Phase 2 tokens
  twoTruthsMaxChars: 80,
  glanceMaxDuration: 3,       // seconds
  glanceMaxFileSize: 10,      // MB
  shimmerDuration: 2000,      // ms for badge shimmer
  badgeHeight: 30,
  confettiDuration: 1500,     // ms
  // Phase 3 tokens
  spotMapHeight: 100,         // static map thumbnail height
  spotMapZoom: 14,            // minimum zoom for privacy
  sparklineWidth: 80,
  sparklineHeight: 28,
  dragScaleActive: 0.97,      // scale when dragging
  dragInactivityMs: 3000,     // auto-exit reorder mode
  analyticsStagger: 80,       // stagger per stat row
};

// ─── Widget Shadow ─────────────────────────────────────────────────────
export const widgetShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
};

// Re-export everything from base theme for convenience
export {
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

export default {
  ...baseTheme,
  MOOD_PRESETS,
  NEON_PALETTE,
  HOT_TAKE_GRADIENTS,
  NEIGHBORHOOD_TITLES,
  profileTokens,
  widgetShadow,
};
