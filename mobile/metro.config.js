const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Redirect @gorhom/bottom-sheet to our custom Modal-based shim
// to avoid Reanimated v4 incompatibility
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@gorhom/bottom-sheet': path.resolve(__dirname, 'src/components/ui/BottomSheet.js'),
};

module.exports = config;
