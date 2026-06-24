import { View, Text, TouchableOpacity, Animated, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useRef, useState, useEffect, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useScanStore } from "../../store/scanStore";
import { useGalleryScan } from "../../hooks/useGalleryScan";
import { useFrameStreamer } from "../../hooks/useFrameStreamer";
import { ScanQualityPanel } from "../../components/ScanQualityPanel";
import { DetectionResponse } from "../../types";

export default function SkinScanScreen() {
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const currentSpecies = useScanStore((state) => state.currentSpecies);
  const setSkinResult = useScanStore((state) => state.setSkinResult);

  type ScanMode = "ready" | "scanning" | "processing" | "gallery";
  const [scanState, setScanState] = useState<ScanMode>("ready");
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | null>(null);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(-80)).current;

  // Gallery scan hook
  const {
    pickImage,
    galleryImageUri,
    galleryResponse,
    isAnalyzing,
    error: galleryError,
    clearGallery,
  } = useGalleryScan({
    targetSpecies: currentSpecies,
    expectedPart: "skin",
  });

  // ── WebSocket + Frame Streaming ─────────────────────────────────────
  const handleWsResult = useCallback(
    (data: DetectionResponse) => {
      setDetectionResponse(data);

      // Debounce ready_for_capture: require 3 consecutive ready frames
      if (data.ready_for_capture && scanState === "scanning") {
        readyCountRef.current++;
        if (readyCountRef.current < 3) return;

        // Enough consecutive ready frames — navigate with WS result (no capture needed)
        streamerDisconnect();
        setScanState("processing");
        setSkinResult({
          freshness: data.freshness || "unknown",
          confidence: data.confidence || 0,
        });
        router.push("/result");
      } else {
        readyCountRef.current = 0;
      }
    },
    [scanState, currentSpecies],
  );

  const {
    connect: streamerConnect,
    disconnect: streamerDisconnect,
    createFrameProcessor,
    connectionState,
    isConnected,
    lastDetectionRef,
    hasDetection,
  } = useFrameStreamer({
    targetSpecies: currentSpecies,
    expectedPart: "skin",
    onResult: handleWsResult,
  });

  const readyCountRef = useRef(0);
  const frameProcessor = createFrameProcessor();

  // ── WebSocket lifecycle: connect on scanning start, disconnect on leave ──
  const wsStartedRef = useRef(false);

  useEffect(() => {
    if (scanState === "scanning" && !wsStartedRef.current) {
      wsStartedRef.current = true;
      readyCountRef.current = 0;
      streamerConnect();
    }

    if (scanState !== "scanning" && wsStartedRef.current) {
      wsStartedRef.current = false;
      streamerDisconnect();
    }
  }, [scanState]);

  // ── Start scanning after camera is ready ────────────────────────────
  useEffect(() => {
    if (!hasPermission || !device) return;

    const readyTimer = setTimeout(() => {
      setScanState("scanning");
    }, 1500);

    return () => clearTimeout(readyTimer);
  }, [hasPermission, device]);

  // ── Animations ──────────────────────────────────────────────────────
  useEffect(() => {
    if (scanState !== "scanning") return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scanState]);

  useEffect(() => {
    if (scanState !== "scanning") return;

    const scanLine = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 80, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: -80, duration: 2000, useNativeDriver: true }),
      ])
    );
    scanLine.start();
    return () => scanLine.stop();
  }, [scanState]);

  // ── Manual Done button — uses last WS result, no capture needed ─────
  const handleDone = () => {
    if (scanState !== "scanning" || !lastDetectionRef.current) return;

    const lastResult = lastDetectionRef.current;
    streamerDisconnect();
    setScanState("processing");
    setSkinResult({
      freshness: lastResult.freshness || "unknown",
      confidence: lastResult.confidence || 0,
    });
    router.push("/result");
  };

  // Gallery "Done" → store result → navigate
  const handleGalleryDone = () => {
    if (!galleryResponse) return;
    setSkinResult({
      uri: galleryImageUri || "",
      freshness: galleryResponse.freshness || "unknown",
      confidence: galleryResponse.confidence || 0,
    });
    router.push("/result");
  };

  const handleGalleryPress = async () => {
    setScanState("gallery");
    await pickImage();
  };

  const handleRetake = () => {
    clearGallery();
    setScanState("scanning");
  };

  // ── Permission not granted ──────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-slate-50">
        <Feather name="camera" size={64} color="#94a3b8" />
        <Text className="text-xl font-bold text-slate-900 mt-4 mb-2">
          Camera Permission Required
        </Text>
        <Text className="text-sm text-slate-500 text-center mb-6">
          We need access to your camera to scan fish freshness
        </Text>
        <TouchableOpacity className="bg-teal-600 px-6 py-3 rounded-xl" onPress={requestPermission}>
          <Text className="text-white text-base font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Gallery Mode ───────────────────────────────────────────────
  if (scanState === "gallery") {
    return (
      <View className="flex-1 bg-black">
        <View className="flex-row justify-between items-center p-6 pt-16">
          <TouchableOpacity
            onPress={() => { clearGallery(); setScanState("scanning"); }}
            className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Skin Scan</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center items-center px-4">
          {galleryImageUri && (
            <View className="w-full rounded-2xl overflow-hidden border-2 border-teal-500/50">
              <Image source={{ uri: galleryImageUri }} style={{ width: "100%", height: 350 }} contentFit="contain" />
            </View>
          )}
          {isAnalyzing && (
            <View className="flex-row items-center mt-4 bg-black/50 px-4 py-2 rounded-lg">
              <ActivityIndicator size="small" color="#14b8a6" />
              <Text className="text-white text-sm ml-2">Analyzing image...</Text>
            </View>
          )}
          {galleryError && (
            <View className="mt-4 bg-red-500/20 px-4 py-2 rounded-lg">
              <Text className="text-red-400 text-sm text-center">{galleryError}</Text>
            </View>
          )}
        </View>

        <View className="pb-6 px-2">
          <ScanQualityPanel response={galleryResponse} expectedPart="skin" targetSpecies={currentSpecies} />
          {galleryResponse?.freshness && !isAnalyzing && (
            <View className={`mx-4 mb-2 px-4 py-3 rounded-xl ${galleryResponse.freshness.toLowerCase() === "fresh" ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-red-500/20 border border-red-500/30"}`}>
              <View className="flex-row items-center justify-center">
                <Feather name={galleryResponse.freshness.toLowerCase() === "fresh" ? "sun" : "cloud-rain"} size={20} color={galleryResponse.freshness.toLowerCase() === "fresh" ? "#34d399" : "#f87171"} />
                <Text className={`text-lg font-bold ml-2 ${galleryResponse.freshness.toLowerCase() === "fresh" ? "text-emerald-400" : "text-red-400"}`}>{galleryResponse.freshness}</Text>
                {galleryResponse.confidence != null && <Text className="text-white/50 text-sm ml-2">({Math.round(galleryResponse.confidence * 100)}% confidence)</Text>}
              </View>
            </View>
          )}
          <View className="flex-row justify-center gap-3 px-4 mt-2">
            <TouchableOpacity onPress={handleRetake} className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-white/30 bg-white/10">
              <Feather name="camera" size={18} color="#fff" />
              <Text className="text-white text-base font-semibold ml-2">Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGalleryDone} disabled={!galleryResponse || isAnalyzing} className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${galleryResponse && !isAnalyzing ? "bg-emerald-600" : "bg-white/20"}`}>
              <Feather name="check" size={18} color={galleryResponse && !isAnalyzing ? "#fff" : "#ffffff40"} />
              <Text className={`text-base font-bold ml-2 ${galleryResponse && !isAnalyzing ? "text-white" : "text-white/40"}`}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Camera Mode ────────────────────────────────────────────────
  if (!device) {
    return <View className="flex-1 bg-black justify-center items-center"><Text className="text-white">No camera device found</Text></View>;
  }

  return (
    <View className="flex-1 bg-black">
      <View style={{ flex: 1 }} onLayout={(e) => setLayoutSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        <Camera
          device={device}
          isActive={scanState === "scanning"}
          frameProcessor={frameProcessor}
          frameProcessorFps={4}
          style={{ flex: 1 }}
        />
      </View>

      <View className="absolute inset-0 bg-black/20 pointer-events-none">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 pt-16">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/50 justify-center items-center pointer-events-auto">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-white/30 justify-center items-center"><Text className="text-white font-semibold">1</Text></View>
            <View className="w-10 h-0.5 bg-white/30 mx-2" />
            <View className={`w-8 h-8 rounded-full justify-center items-center ${scanState === "scanning" ? "bg-teal-600" : "bg-white/30"}`}><Text className="text-white font-semibold">2</Text></View>
          </View>
        </View>

        {/* Skin Patch Scan Frame */}
        <View className="flex-1 justify-center items-center">
          <Animated.View className="items-center justify-center" style={{ transform: [{ scale: scanState === "scanning" ? pulseAnim : 1 }], opacity: scanState === "ready" ? 0.5 : 1 }}>
            <View className="relative w-56 h-56 items-center justify-center">
              <View className="absolute inset-0 border-4 border-teal-500 rounded-[40px] bg-teal-500/5" />
              <View className="absolute top-8 left-8 right-8 h-px bg-teal-500/30" />
              <View className="absolute top-16 left-6 right-6 h-px bg-teal-500/20" />
              <View className="absolute top-24 left-10 right-10 h-px bg-teal-500/30" />
              <View className="absolute top-32 left-8 right-8 h-px bg-teal-500/20" />
              <View className="absolute top-40 left-6 right-6 h-px bg-teal-500/30" />
              <View className="absolute top-12 left-12 w-8 h-8 border border-teal-500/40 rounded-lg rotate-12" />
              <View className="absolute top-20 right-12 w-8 h-8 border border-teal-500/40 rounded-lg -rotate-12" />
              <View className="absolute bottom-16 left-16 w-8 h-8 border border-teal-500/40 rounded-lg rotate-6" />
              <View className="absolute bottom-24 right-16 w-8 h-8 border border-teal-500/40 rounded-lg -rotate-6" />
              <View className="w-20 h-20 rounded-2xl border-4 border-teal-400/50 items-center justify-center"><Feather name="layers" size={32} color="#14b8a6" /></View>
              {scanState === "scanning" && <Animated.View className="absolute left-4 right-4 h-0.5 bg-teal-400" style={{ transform: [{ translateY: scanLineAnim }] }} />}
            </View>
          </Animated.View>
          <Text className="text-white/60 text-sm mt-4 font-medium">SKIN SCAN</Text>
          {scanState === "scanning" && (
            <View className="flex-row items-center mt-2">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${isConnected ? "bg-emerald-400" : connectionState === "connecting" ? "bg-amber-400" : "bg-red-400"}`} />
              <Text className="text-white/40 text-xs">{isConnected ? "Live detection" : connectionState === "connecting" ? "Connecting..." : "Offline"}</Text>
            </View>
          )}
        </View>

        {/* Status + Buttons */}
        <View className="items-center py-4 pointer-events-auto">
          {scanState === "ready" && <View className="bg-black/50 px-6 py-3 rounded-lg"><Text className="text-white text-lg font-bold text-center">Get Ready...</Text></View>}
          {scanState === "scanning" && (
            <>
              <ScanQualityPanel response={detectionResponse} expectedPart="skin" targetSpecies={currentSpecies} />
              <View className="flex-row justify-center gap-3 px-4 mt-2">
                <TouchableOpacity onPress={handleDone} disabled={!hasDetection} className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${hasDetection ? "bg-teal-600" : "bg-white/20"}`}>
                  <Feather name="check" size={18} color={hasDetection ? "#fff" : "#ffffff40"} />
                  <Text className={`text-base font-semibold ml-2 ${hasDetection ? "text-white" : "text-white/40"}`}>{hasDetection ? "Done" : "Waiting..."}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGalleryPress} className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-white/30 bg-white/10">
                  <Feather name="image" size={18} color="#fff" />
                  <Text className="text-white text-base font-semibold ml-2">Gallery</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {scanState === "processing" && <View className="bg-black/70 px-6 py-3 rounded-lg"><Text className="text-white text-lg font-bold text-center">Processing...</Text></View>}
        </View>

        <View className="flex-row justify-center pb-8">
          <View className={`px-4 py-2 rounded-full ${scanState === "scanning" ? "bg-teal-600" : "bg-white/20"}`}>
            <Text className={`text-sm font-semibold ${scanState === "scanning" ? "text-white" : "text-white/70"}`}>Scanning</Text>
          </View>
        </View>
      </View>
    </View>
  );
}