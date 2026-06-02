import { useColorScheme } from "@/src/hooks/useColorScheme";
import {
  makeShadows,
  palettes,
  radii,
  spacing,
  typography,
  type Theme,
} from "@/src/theme/theme";

export function useTheme(): Theme {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return {
    scheme,
    colors: palettes[scheme],
    spacing,
    radii,
    typography,
    shadows: makeShadows(scheme),
  };
}
