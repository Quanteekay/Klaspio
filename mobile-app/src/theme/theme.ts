import { TextStyle, ViewStyle } from "react-native";

export type ColorScheme = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
}

const light: ThemeColors = {
  bg: "#F6F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF0F6",
  border: "#E6E8F0",
  textPrimary: "#15171E",
  textSecondary: "#5A6172",
  textMuted: "#9CA3B4",
  primary: "#5B5BD6",
  primarySoft: "#ECECFB",
  onPrimary: "#FFFFFF",
  success: "#16A34A",
  successSoft: "#E6F6EC",
  warning: "#D97706",
  warningSoft: "#FBEFDD",
  danger: "#DC2626",
  dangerSoft: "#FBEAEA",
  info: "#2563EB",
  infoSoft: "#E7EFFD",
  overlay: "rgba(15,17,24,0.45)",
};

const dark: ThemeColors = {
  bg: "#0E0F14",
  surface: "#181A21",
  surfaceAlt: "#222530",
  border: "#2B2F3A",
  textPrimary: "#F2F3F7",
  textSecondary: "#A6AEBE",
  textMuted: "#6C7484",
  primary: "#7C7FF2",
  primarySoft: "#23253A",
  onPrimary: "#FFFFFF",
  success: "#22C55E",
  successSoft: "#13251A",
  warning: "#F59E0B",
  warningSoft: "#2A2012",
  danger: "#F05252",
  dangerSoft: "#2A1616",
  info: "#3B82F6",
  infoSoft: "#15203A",
  overlay: "rgba(0,0,0,0.6)",
};

export const palettes: Record<ColorScheme, ThemeColors> = { light, dark };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 } as TextStyle,
  h2: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 } as TextStyle,
  title: { fontSize: 17, fontWeight: "700" } as TextStyle,
  body: { fontSize: 15, fontWeight: "400" } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as TextStyle,
  caption: { fontSize: 12, fontWeight: "500" } as TextStyle,
};

export interface ThemeShadows {
  card: ViewStyle;
  floating: ViewStyle;
}

export function makeShadows(scheme: ColorScheme): ThemeShadows {
  if (scheme === "dark") {
    // W trybie ciemnym głębię budują obramowania, nie cienie.
    return { card: {}, floating: {} };
  }
  return {
    card: {
      shadowColor: "#1A1D26",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 2,
    },
    floating: {
      shadowColor: "#1A1D26",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  };
}

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: ThemeShadows;
}
