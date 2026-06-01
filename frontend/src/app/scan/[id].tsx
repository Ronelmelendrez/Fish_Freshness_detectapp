import { AppHeader } from "@/components/app-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fishSpecies } from "@/constants/fishData";
import { AnimatedText, AnimatedView } from "@/utils/styled";
import { uploadDetection } from "@/utils/api";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Scan Screen
 * Displays a mock QR scanner interface for a selected fish species
 * Features:
 * - Shows selected fish name
 * - Stylish circular scanner preview (mock - no actual camera)
 * - Animated "Processing..." indicator
 * - Continue button to proceed to result screen
 * - Back button to return home
 */
export default function ScanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState<"eye" | "body">("eye");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const requestedPermissionRef = useRef(false);

  // Find the fish species from the ID
  const fish = fishSpecies.find((f) => f.id === id);

  useEffect(() => {
    if (!permission) return;

    if (!permission.granted && permission.canAskAgain) {
      if (!requestedPermissionRef.current) {
        requestedPermissionRef.current = true;
        requestPermission();
      }
      return;
    }

    if (!permission.granted && !permission.canAskAgain) {
      router.replace("/");
    }
  }, [permission, requestPermission, router]);

  if (!fish) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-red-500">Fish not found</ThemedText>
      </ThemedView>
    );
  }

  if (!permission || !permission.granted) {
    return null;
  }

  const handleCapture = async () => {
    if (isProcessing || !cameraRef.current) return;

    setErrorMessage(null);
    setScanProgress(0);
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      setScanProgress(25);

      const expectedPart = scanStep === "eye" ? "eye" : "skin";
      const targetSpeciesMap: Record<string, string> = {
        Milkfish: "Bangus",
        Tilapia: "Tilapia",
      };
      const targetSpecies = fish?.name ? targetSpeciesMap[fish.name] : undefined;
      const response = await uploadDetection(photo.uri, targetSpecies, expectedPart);

      setScanProgress(100);
      setIsProcessing(false);

      if (scanStep === "eye") {
        setScanStep("body");
        setScanProgress(0);
        return;
      }

      router.push({
        pathname: "/result",
        params: {
          fishId: id,
          detection: JSON.stringify(response),
        },
      });
    } catch (error) {
      setIsProcessing(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload image",
      );
    }
  };

  return (
    <ThemedView className="flex-1 bg-slate-50 dark:bg-gray-950">
      <SafeAreaView className="flex-1">
        <View className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-teal-200/40 dark:bg-teal-900/25" />
        <View className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-cyan-200/30 dark:bg-cyan-900/20" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
        >
          {/* Header */}
          <AnimatedView entering={FadeIn} className="mb-6">
            <AppHeader
              title={fish.name}
              subtitle={fish.scientificName}
              tag="Scan Lab"
              meta="AI-enabled"
            >
              <View className="mt-3 flex-row items-center gap-2">
                <View
                  className={`rounded-full px-3 py-1 ${
                    scanStep === "eye"
                      ? "bg-teal-600"
                      : "bg-slate-200/80 dark:bg-gray-800"
                  }`}
                >
                  <ThemedText
                    className={`text-[11px] font-semibold ${
                      scanStep === "eye"
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Step 1: Eye
                  </ThemedText>
                </View>
                <View
                  className={`rounded-full px-3 py-1 ${
                    scanStep === "body"
                      ? "bg-teal-600"
                      : "bg-slate-200/80 dark:bg-gray-800"
                  }`}
                >
                  <ThemedText
                    className={`text-[11px] font-semibold ${
                      scanStep === "body"
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Step 2: Body
                  </ThemedText>
                </View>
              </View>
            </AppHeader>
          </AnimatedView>

          {/* Scanner Preview */}
          <AnimatedView
            entering={FadeInDown.delay(200)}
            className="mb-8 items-center"
          >
            <View className="w-full rounded-3xl bg-white/90 dark:bg-gray-900/80 border border-white/60 dark:border-gray-800 p-6 shadow-lg">
              <View className="w-full items-center">
                <View className="relative w-64 h-64 rounded-full border-4 border-teal-300/80 dark:border-teal-600 bg-gray-900 justify-center items-center overflow-hidden">
                  <CameraView
                    ref={cameraRef}
                    facing="back"
                    animateShutter={false}
                    style={{ width: "100%", height: "100%" }}
                  />
                  <AnimatedView
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-200/50 dark:via-teal-700/50 to-transparent opacity-40"
                    style={{
                      transform: [{ translateY: -256 }],
                    }}
                  >
                    <View className="h-full w-full" />
                  </AnimatedView>

                  <View className="absolute inset-0 items-center justify-center">
                    <ThemedText className="text-xs font-semibold text-white/80">
                      {scanStep === "eye"
                        ? "Center the fish eye"
                        : "Capture the body texture"}
                    </ThemedText>
                  </View>

                  <View className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-teal-500 dark:border-teal-400" />
                  <View className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-teal-500 dark:border-teal-400" />
                  <View className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-teal-500 dark:border-teal-400" />
                  <View className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-teal-500 dark:border-teal-400" />
                </View>
              </View>

              <View className="mt-6 flex-row items-center justify-between rounded-2xl bg-slate-100/80 dark:bg-gray-800 px-4 py-3">
                <View>
                  <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                    Scan mode
                  </ThemedText>
                  <ThemedText className="text-sm font-semibold text-gray-900 dark:text-white">
                    {scanStep === "eye" ? "Eye scan" : "Body scan"}
                  </ThemedText>
                </View>
                <View className="rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 px-3 py-1">
                  <ThemedText className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Ready
                  </ThemedText>
                </View>
              </View>
            </View>
          </AnimatedView>

          {/* Processing Indicator */}
          {isProcessing && (
            <AnimatedView
              entering={FadeInDown.delay(300)}
              className="mb-8 items-center"
            >
              <View className="mb-4">
                <AnimatedText
                  className="text-center text-teal-600 dark:text-teal-400 font-semibold"
                  style={{
                    fontSize: 16,
                  }}
                >
                  Processing...
                </AnimatedText>
              </View>

              {/* Progress Bar */}
              <View className="w-full max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <AnimatedView
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  style={{
                    width: `${Math.min(scanProgress, 100)}%`,
                  }}
                />
              </View>

              <ThemedText className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                {Math.min(Math.round(scanProgress), 100)}%
              </ThemedText>
            </AnimatedView>
          )}

          {/* Spacer */}
          <View className="flex-1" />

          {/* Action Buttons */}
          <AnimatedView entering={FadeInDown.delay(400)} className="gap-3 mb-4">
            {!isProcessing && (
              <Pressable
                onPress={handleCapture}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700 py-4 px-6 rounded-2xl items-center shadow-lg active:shadow-md active:opacity-90"
                android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
              >
                <ThemedText className="text-white font-bold text-lg">
                  {scanStep === "eye" ? "👁️ Capture Eye" : "📸 Capture Body"}
                </ThemedText>
              </Pressable>
            )}

            {isProcessing && (
              <Pressable
                onPress={() => setIsProcessing(false)}
                className="bg-gray-200 dark:bg-gray-700 py-4 px-6 rounded-2xl items-center"
                android_ripple={{ color: "rgba(0, 0, 0, 0.1)" }}
              >
                <ThemedText className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
                  ⏹️ Cancel
                </ThemedText>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.replace("/")}
              className="border border-teal-200 dark:border-teal-700 py-3 px-6 rounded-2xl items-center bg-white/80 dark:bg-gray-900/80"
              android_ripple={{ color: "rgba(13, 148, 136, 0.1)" }}
            >
              <ThemedText className="text-teal-700 dark:text-teal-300 font-semibold text-base">
                ← Back to Home
              </ThemedText>
            </Pressable>
          </AnimatedView>

          {errorMessage && (
            <View className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-900">
              <ThemedText className="text-xs text-rose-700 dark:text-rose-200 text-center">
                {errorMessage}
              </ThemedText>
            </View>
          )}

          {/* Info Box */}
          <View className="p-4 bg-blue-50 dark:bg-blue-900 rounded-xl mb-4">
            <ThemedText className="text-xs text-blue-700 dark:text-blue-300 text-center">
              {scanStep === "eye"
                ? "ℹ️ Focus on the eye for clarity and reflection."
                : "ℹ️ Capture the body surface with even lighting."}
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
