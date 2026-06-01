import { AppHeader } from "@/components/app-header";
import { FreshnessBadge } from "@/components/freshness-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fishSpecies, getMockScanResult } from "@/constants/fishData";
import { DetectionResponse } from "@/utils/api";
import { AnimatedView } from "@/utils/styled";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Result Screen
 * Displays the mock freshness detection results
 * Features:
 * - Fish name and image
 * - Color-coded freshness badge
 * - Mock QR/Batch ID
 * - Confidence percentage
 * - Storage advice
 * - Navigation buttons with animations
 * - Dark mode support
 */
export default function ResultScreen() {
  const router = useRouter();
  const { fishId, detection } = useLocalSearchParams<{
    fishId: string;
    detection?: string;
  }>();

  const detectionResult = useMemo<DetectionResponse | null>(() => {
    if (!detection) return null;
    try {
      return JSON.parse(detection) as DetectionResponse;
    } catch {
      return null;
    }
  }, [detection]);

  // Get fish data and scan result
  const fish = fishSpecies.find((f) => f.id === fishId);
  const scanResult = detectionResult ? null : getMockScanResult(fishId || "1");

  if (!fish) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-red-500">Fish not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 bg-white dark:bg-gray-950">
      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
        >
          {/* Header */}
          <AnimatedView entering={FadeIn} className="mb-8">
            <AppHeader
              title="Freshness Result"
              subtitle={`${fish.name} • ${fish.scientificName}`}
              tag="Scan complete"
              meta="AI freshness"
            />
          </AnimatedView>

          {/* Fish Info Card */}
          <AnimatedView
            entering={FadeInDown.delay(100)}
            className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900 dark:to-cyan-900 p-6 rounded-3xl mb-6 border border-teal-200 dark:border-teal-700"
          >
            <ThemedText className="text-xl font-bold text-teal-700 dark:text-teal-300 mb-1">
              {fish.name}
            </ThemedText>
            <ThemedText className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
              {fish.scientificName}
            </ThemedText>
            <ThemedText className="text-xs text-gray-700 dark:text-gray-300 leading-5">
              {fish.description}
            </ThemedText>
          </AnimatedView>

          {detectionResult ? (
            <>
              <AnimatedView
                entering={ZoomIn.delay(200).springify()}
                className="mb-6 items-center"
              >
                <View
                  className={`rounded-full px-5 py-2 border ${
                    detectionResult.ready_for_capture
                      ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-900 dark:border-emerald-700"
                      : "bg-amber-100 border-amber-300 dark:bg-amber-900 dark:border-amber-700"
                  }`}
                >
                  <ThemedText
                    className={`text-sm font-semibold ${
                      detectionResult.ready_for_capture
                        ? "text-emerald-700 dark:text-emerald-200"
                        : "text-amber-700 dark:text-amber-200"
                    }`}
                  >
                    {detectionResult.ready_for_capture
                      ? "Capture ready"
                      : "Needs retake"}
                  </ThemedText>
                </View>
              </AnimatedView>

              <AnimatedView
                entering={FadeInDown.delay(300)}
                className="gap-3 mb-6"
              >
                <View className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <ThemedText className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    DETECTED
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold text-teal-700 dark:text-teal-300">
                    {detectionResult.detected_species || "Unknown"}
                  </ThemedText>
                  <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                    {detectionResult.detected_part || "Part not found"}
                  </ThemedText>
                </View>

                <View className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <ThemedText className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2">
                    CONFIDENCE
                  </ThemedText>
                  <View className="flex-row items-end gap-2">
                    <ThemedText className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {detectionResult.confidence
                        ? Math.round(detectionResult.confidence * 100)
                        : 0}
                      %
                    </ThemedText>
                    <ThemedText className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Model score
                    </ThemedText>
                  </View>

                  <View className="mt-3 h-2 bg-blue-200 dark:bg-blue-700 rounded-full overflow-hidden">
                    <AnimatedView
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{
                        width: `${Math.min(
                          Math.round((detectionResult.confidence || 0) * 100),
                          100,
                        )}%`,
                      }}
                    />
                  </View>
                </View>

                <View className="bg-slate-50 dark:bg-gray-900 p-4 rounded-2xl border border-slate-200 dark:border-gray-800">
                  <ThemedText className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    QUALITY CHECKS
                  </ThemedText>
                  <View className="flex-row justify-between">
                    <ThemedText className="text-xs text-slate-600 dark:text-slate-400">
                      Blurry
                    </ThemedText>
                    <ThemedText className="text-xs font-semibold text-slate-800 dark:text-white">
                      {detectionResult.is_blurry ? "Yes" : "No"}
                    </ThemedText>
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <ThemedText className="text-xs text-slate-600 dark:text-slate-400">
                      Centered
                    </ThemedText>
                    <ThemedText className="text-xs font-semibold text-slate-800 dark:text-white">
                      {detectionResult.is_centered ? "Yes" : "No"}
                    </ThemedText>
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <ThemedText className="text-xs text-slate-600 dark:text-slate-400">
                      Blur score
                    </ThemedText>
                    <ThemedText className="text-xs font-semibold text-slate-800 dark:text-white">
                      {detectionResult.blurriness_score.toFixed(1)}
                    </ThemedText>
                  </View>
                </View>

                {detectionResult.reason && (
                  <View className="bg-rose-50 dark:bg-rose-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-700">
                    <ThemedText className="text-xs font-semibold text-rose-700 dark:text-rose-200">
                      {detectionResult.reason}
                    </ThemedText>
                  </View>
                )}
              </AnimatedView>
            </>
          ) : (
            <>
              {/* Freshness Badge - Large */}
              <AnimatedView
                entering={ZoomIn.delay(200).springify()}
                className="mb-8 items-center"
              >
                <FreshnessBadge
                  level={scanResult!.freshness}
                  emoji={scanResult!.emoji}
                  size="lg"
                />
              </AnimatedView>

              {/* Results Grid */}
              <AnimatedView entering={FadeInDown.delay(300)} className="gap-3 mb-6">
                {/* QR / Batch ID */}
                <View className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <ThemedText className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    BATCH ID
                  </ThemedText>
                  <ThemedText className="text-lg font-mono font-bold text-teal-700 dark:text-teal-300">
                    {scanResult!.batchId}
                  </ThemedText>
                </View>

                {/* Confidence Score */}
                <View className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <ThemedText className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2">
                    CONFIDENCE SCORE
                  </ThemedText>
                  <View className="flex-row items-end gap-2">
                    <ThemedText className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {scanResult!.confidence}%
                    </ThemedText>
                    <ThemedText className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      AI-Analyzed
                    </ThemedText>
                  </View>

                  {/* Confidence Bar */}
                  <View className="mt-3 h-2 bg-blue-200 dark:bg-blue-700 rounded-full overflow-hidden">
                    <AnimatedView
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{
                        width: `${scanResult!.confidence}%`,
                      }}
                    />
                  </View>
                </View>
              </AnimatedView>

              {/* Storage & Handling Advice */}
              <AnimatedView
                entering={FadeInDown.delay(400)}
                className="bg-emerald-50 dark:bg-emerald-900 p-5 rounded-2xl mb-6 border border-emerald-200 dark:border-emerald-700"
              >
                <ThemedText className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                  ❄️ STORAGE & HANDLING
                </ThemedText>
                <ThemedText className="text-sm text-emerald-900 dark:text-emerald-100 leading-6">
                  {scanResult!.advice}
                </ThemedText>
              </AnimatedView>

              {/* Additional Tips */}
              <AnimatedView
                entering={FadeInDown.delay(500)}
                className="bg-purple-50 dark:bg-purple-900 p-4 rounded-2xl mb-8 border border-purple-200 dark:border-purple-700"
              >
                <ThemedText className="text-xs text-purple-700 dark:text-purple-300 font-semibold mb-2">
                  💡 Pro Tips
                </ThemedText>
                <ThemedText className="text-xs text-purple-900 dark:text-purple-100 leading-5">
                  • Look for clear eyes and firm flesh{"\n"}• Fresh fish should
                  smell like ocean, not "fishy"{"\n"}• Gills should be bright red,
                  not brown
                </ThemedText>
              </AnimatedView>
            </>
          )}

          {/* Action Buttons */}
          <AnimatedView entering={FadeInDown.delay(600)} className="gap-3 mb-4">
            <Pressable
              onPress={() => {
                // Simulate another scan
                const randomFish =
                  fishSpecies[Math.floor(Math.random() * fishSpecies.length)];
                router.push(`/scan/${randomFish.id}`);
              }}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700 py-4 px-6 rounded-2xl items-center shadow-lg active:shadow-md active:opacity-90"
              android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
            >
              <ThemedText className="text-white font-bold text-lg">
                📸 Scan Again
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => router.replace("/")}
              className="border-2 border-teal-600 dark:border-teal-500 py-3 px-6 rounded-2xl items-center bg-teal-50 dark:bg-gray-900 active:bg-teal-100 dark:active:bg-gray-800"
              android_ripple={{ color: "rgba(13, 148, 136, 0.1)" }}
            >
              <ThemedText className="text-teal-600 dark:text-teal-400 font-semibold text-base">
                🏠 Back to Home
              </ThemedText>
            </Pressable>
          </AnimatedView>

          {/* Footer Note */}
          <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl items-center">
            <ThemedText className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Results are based on QR code data and AI analysis. Always use your
              best judgment before consuming.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
