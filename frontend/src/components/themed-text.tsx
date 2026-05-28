import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  themeColor?: ThemeColor;
  className?: string;
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  className,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      className={className}
      style={[
        { color: theme[themeColor ?? "text"] },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        type === "linkPrimary" && styles.linkPrimary,
        type === "code" && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  link: {
    fontSize: 14,
    color: "#0d9488",
  },
  linkPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d9488",
  },
  code: {
    fontSize: 12,
    fontFamily: Platform.OS === "web" ? "monospace" : "Courier New",
  },
});
