/**
 * WidgetCanvas — Layout container for profile widgets.
 *
 * Renders a vertical stack of widget cards (Hot Take, Anthem, etc.)
 * with consistent padding and spacing. Each widget animates in.
 *
 * @module WidgetCanvas
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { spacing, profileTokens } from '../../constants/theme';

/**
 * Widget canvas layout container.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Widget components to render
 * @returns {React.ReactElement}
 */
export default function WidgetCanvas({ children }) {
  return <View style={styles.canvas}>{children}</View>;
}

WidgetCanvas.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = StyleSheet.create({
  canvas: {
    paddingHorizontal: profileTokens.widgetPadding,
    gap: profileTokens.widgetGap,
    paddingBottom: spacing.xxl,
  },
});
