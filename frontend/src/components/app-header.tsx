import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  tag?: string;
  meta?: string;
  showBack?: boolean;
  layout?: "stack" | "row";
  rightSlot?: ReactNode;
  children?: ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  tag,
  meta,
  showBack = true,
  layout = "stack",
  rightSlot,
  children,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <View className="gap-4">
      {showBack && (
        <Pressable
          onPress={() => router.back()}
          className="self-start flex-row items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-gray-900/70 border border-white/60 dark:border-gray-800"
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)" }}
        >
          <ThemedText className="text-base">←</ThemedText>
          <ThemedText className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Back
          </ThemedText>
        </Pressable>
      )}

      <View>
        {(tag || meta) && (
          <View className="flex-row items-center gap-2">
            {tag && (
              <View className="rounded-full bg-teal-100/70 dark:bg-teal-900/40 px-3 py-1">
                <ThemedText className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                  {tag}
                </ThemedText>
              </View>
            )}
            {meta && (
              <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                {meta}
              </ThemedText>
            )}
          </View>
        )}

        {layout === "row" ? (
          <View className="mt-3 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <ThemedText className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {title}
              </ThemedText>
              {subtitle && (
                <ThemedText className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {subtitle}
                </ThemedText>
              )}
            </View>
            {rightSlot && <View className="pt-1">{rightSlot}</View>}
          </View>
        ) : (
          <>
            <ThemedText className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText className="text-sm text-gray-600 dark:text-gray-400 italic">
                {subtitle}
              </ThemedText>
            )}
          </>
        )}
      </View>

      {children}
    </View>
  );
}
