import { useColorScheme as useColorSchemeRN } from "react-native";

/**
 * Minimal color scheme hook
 * Returns the device's current color scheme (light, dark, or unspecified)
 */
export function useColorScheme() {
  return useColorSchemeRN();
}
