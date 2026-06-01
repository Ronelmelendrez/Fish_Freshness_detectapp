import { AppHeader } from "@/components/app-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fishSpecies } from "@/constants/fishData";
import { FreshnessResponse, uploadFreshness } from "@/utils/api";
import { DEFAULT_THRESHOLDS, isAreaInRange } from "@/utils/autoCapture";
import { AnimatedText, AnimatedView } from "@/utils/styled";
import {
  getDetectorModel,
  getLargestBoxArea,
  loadDetectorModel,
} from "@/utils/tflite";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ElementRef } from "react";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { FadeIn, FadeInDown, runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";

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
  const [scanStep, setScanStep] = useState<"eye" | "skin">("eye");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stableCount, setStableCount] = useState(0);
  const [lastArea, setLastArea] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [eyeFreshness, setEyeFreshness] = useState<FreshnessResponse | null>(
    null,
  );
  const cameraRef = useRef<ElementRef<typeof Camera> | null>(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const useMockCamera =
    process.env.EXPO_PUBLIC_USE_MOCK_CAMERA === "true" || __DEV__;
  const mockImage = require("../../../assets/images/tutorial-web.png");

  // Find the fish species from the ID
  const fish = fishSpecies.find((f) => f.id === id);

  useEffect(() => {
    if (!hasPermission && !useMockCamera) {
      requestPermission();
    }
  }, [hasPermission, requestPermission, useMockCamera]);

  useEffect(() => {
    let active = true;

    const modelAsset = require("../../../assets/models/eye_skin_detector.tflite");

    loadDetectorModel(modelAsset)
      .then(() => {
        if (active) setModelReady(true);
      })
      .catch(() => {
        if (active) setErrorMessage("Failed to load detector model");
      });

    return () => {
      active = false;
    };
  }, []);

  if (!fish) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-red-500">Fish not found</ThemedText>
      </ThemedView>
    );
  }

  if (!hasPermission && !useMockCamera) {
    return null;
  }

  if (!device && !useMockCamera) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-red-500">Camera unavailable</ThemedText>
      </ThemedView>
    );
  }

  const thresholds = DEFAULT_THRESHOLDS[scanStep];

  const handleAutoCapture = async () => {
    if (isProcessing || !cameraRef.current) return;

    setErrorMessage(null);
    setScanProgress(0);
    setIsProcessing(true);

    try {
      const photoUri = useMockCamera
        ? Image.resolveAssetSource(mockImage)?.uri
        : (
            await cameraRef.current?.takePhoto({
              qualityPrioritization: "quality",
              skipMetadata: true,
            })
          )?.path;

      if (!photoUri) {
        throw new Error("Unable to access camera image");
      }

      setScanProgress(35);

      const response = await uploadFreshness(
        useMockCamera ? photoUri : `file://${photoUri}`,
      );

      setScanProgress(100);
      setIsProcessing(false);
      setStableCount(0);

      if (scanStep === "eye") {
        setEyeFreshness(response);
        setScanStep("skin");
        setScanProgress(0);
        return;
      }

      router.push({
        pathname: "/result",
        params: {
          fishId: id,
          freshness: JSON.stringify({
            eye: eyeFreshness,
            skin: response,
          }),
        },
      });
    } catch (error) {
      setIsProcessing(false);
      setStableCount(0);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to upload image",
      );
    }
  };

  const handleDetectionArea = (area: number) => {
    setLastArea(area);
    if (isAreaInRange(area, thresholds)) {
      setStableCount((prev) => prev + 1);
    } else {
      setStableCount(0);
    }
  };

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (!modelReady || useMockCamera) return;

      const model = getDetectorModel();
      if (!model) return;

      const output = model.runSync(frame);
      const area = getLargestBoxArea(output);
      runOnJS(handleDetectionArea)(area);
    },
    [modelReady, useMockCamera],
  );

  useEffect(() => {
    if (stableCount >= thresholds.stableFrames && !isProcessing) {
      handleAutoCapture();
    }
  }, [stableCount, thresholds.stableFrames, isProcessing]);

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
                    scanStep === "skin"
                      ? "bg-teal-600"
                      : "bg-slate-200/80 dark:bg-gray-800"
                  }`}
                >
                  <ThemedText
                    className={`text-[11px] font-semibold ${
                      scanStep === "skin"
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Step 2: Skin
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
                  {useMockCamera ? (
                    <Image
                      source={mockImage}
                      resizeMode="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Camera
                      ref={cameraRef}
                      device={device}
                      isActive
                      photo
                      frameProcessor={frameProcessor}
                      frameProcessorFps={12}
                      style={{ width: "100%", height: "100%" }}
                    />
                  )}
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
                        : "Capture the skin texture"}
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
                    {scanStep === "eye" ? "Eye scan" : "Skin scan"}
                  </ThemedText>
                </View>
                <View className="rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 px-3 py-1">
                  <ThemedText className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {isProcessing ? "Uploading" : "Auto capture"}
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
                : "ℹ️ Capture the skin surface with even lighting."}
            </ThemedText>
          </View>

          <View className="p-3 bg-slate-100 dark:bg-gray-800 rounded-xl mb-4">
            <ThemedText className="text-xs text-gray-600 dark:text-gray-300 text-center">
              Live size score: {Math.round(lastArea)} px • Waiting for stable
              distance
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
