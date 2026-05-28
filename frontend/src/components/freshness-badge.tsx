import { AnimatedView } from "@/utils/styled";
import { View } from "react-native";
import { ZoomIn } from "react-native-reanimated";
import { ThemedText } from "./themed-text";

type FreshnessLevel = "Fresh" | "Moderate" | "Spoiled";

interface FreshnessBadgeProps {
  level: FreshnessLevel;
  emoji: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Freshness badge component with color-coded design
 * Supports three freshness levels with corresponding colors
 */
export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({
  level,
  emoji,
  size = "md",
}) => {
  const getBadgeStyles = () => {
    switch (level) {
      case "Fresh":
        return {
          container:
            "bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700",
          text: "text-emerald-700 dark:text-emerald-300",
          badge: "bg-emerald-200 dark:bg-emerald-700",
        };
      case "Moderate":
        return {
          container:
            "bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-700",
          text: "text-amber-700 dark:text-amber-300",
          badge: "bg-amber-200 dark:bg-amber-700",
        };
      case "Spoiled":
        return {
          container:
            "bg-rose-50 dark:bg-rose-900 border-rose-200 dark:border-rose-700",
          text: "text-rose-700 dark:text-rose-300",
          badge: "bg-rose-200 dark:bg-rose-700",
        };
    }
  };

  const sizeMap = {
    sm: { container: "px-3 py-1", text: "text-xs", emoji: "text-base" },
    md: { container: "px-4 py-2", text: "text-sm", emoji: "text-lg" },
    lg: { container: "px-6 py-3", text: "text-base", emoji: "text-2xl" },
  };

  const styles = getBadgeStyles();
  const sizingStyle = sizeMap[size];

  return (
    <AnimatedView entering={ZoomIn.springify()}>
      <View
        className={`flex-row items-center gap-2 rounded-full border ${styles.container} ${sizingStyle.container}`}
      >
        <ThemedText className={`${sizingStyle.emoji}`}>{emoji}</ThemedText>
        <ThemedText className={`font-bold ${styles.text} ${sizingStyle.text}`}>
          {level}
        </ThemedText>
      </View>
    </AnimatedView>
  );
};
