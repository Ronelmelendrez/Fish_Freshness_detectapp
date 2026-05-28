/**
 * Minimal theme configuration for ThemedText and ThemedView components
 */

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    tint: "#0d9488",
    tabIconDefault: "#888888",
    tabIconSelected: "#0d9488",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    tint: "#0d9488",
    tabIconDefault: "#888888",
    tabIconSelected: "#0d9488",
  },
};

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  default: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    lineHeight: 40,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  link: {
    fontSize: 14,
    color: "#0d9488",
  },
  linkPrimary: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0d9488",
  },
  code: {
    fontSize: 12,
    fontFamily: "monospace" as const,
  },
};

// Layout constants (optional, for backward compatibility)
export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
};

export const BottomTabInset = 16;
export const MaxContentWidth = 1200;
