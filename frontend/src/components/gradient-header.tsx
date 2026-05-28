import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./themed-text";

/**
 * Ocean-inspired gradient header for the app
 *
 * NOTE: To use linear gradient effects, install expo-linear-gradient:
 * npm install expo-linear-gradient
 *
 * Then you can replace this with LinearGradient from 'expo-linear-gradient'
 * For now, we use a teal gradient background with NativeWind
 */

interface HeaderProps {
  title: string;
  subtitle?: string;
  showWaves?: boolean;
}

export const GradientHeader: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showWaves = true,
}) => {
  return (
    <SafeAreaView className="w-full">
      <View className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-500 dark:from-teal-800 dark:to-cyan-700 px-6 py-7 rounded-3xl shadow-lg border border-white/30 dark:border-white/10">
        <View className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/20" />
        <View className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-cyan-200/30 dark:bg-cyan-900/30" />

        <ThemedText className="text-white text-2xl font-extrabold tracking-tight">
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText className="text-teal-50 text-sm mt-2">
            {subtitle}
          </ThemedText>
        )}
      </View>
    </SafeAreaView>
  );
};
