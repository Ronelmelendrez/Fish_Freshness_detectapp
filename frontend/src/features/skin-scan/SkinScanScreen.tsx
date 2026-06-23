import { View, Text, TouchableOpacity, Animated, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useScanStore } from "../../store/scanStore";
import { useGalleryScan } from "../../hooks/useGalleryScan";
import { useDetectionWebSocket } from "../../services/websocket";
import { ScanQualityPanel } from "../../components/ScanQualityPanel";
import { DetectionResponse } from "../../types";
import { captureFrameBytes } from "../../services/camera";

export default function SkinScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const currentSpecies = useScanStore((state) => state.currentSpecies);
  const setSkinResult = useScanStore((state) => state.setSkinResult);

  type ScanMode = "ready" | "scanning" | "processing" | "gallery";
  const [scanState, setScanState] = useState<ScanMode>("ready");
  const [cameraReady, setCameraReady] = useState(false);
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | null>(null);
  const [hasDetection, setHasDetection] = useState(false);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const [maskPolygon, setMaskPolygon] = useState<number[][] | null>(null);

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

  // ── WebSocket real-time detection ────────────────────────────────────
  // Use refs for connect/disconnect so handleWsResult doesn't depend on them
  const wsConnectRef = useRef<() => void>(() => {});
  const wsDisconnectRef = useRef<() => void>(() => {});
  // Store last detection result for manual Done button (no HTTP fallback needed)
  const lastDetectionRef = useRef<DetectionResponse | null>(null);
  // Debounce: require consecutive ready frames before auto-capture
  const readyCountRef = useRef(0);
  const REQUIRED_READY_FRAMES = 3;

  const handleWsResult = useCallback(
    (data: DetectionResponse) => {
    setDetectionResponse(data);
      lastDetectionRef.current = data;
      if (!hasDetection) setHasDetection(true);

      // Debounce ready_for_capture: require N consecutive ready frames
      if (data.ready_for_capture && scanState === "scanning") {
        readyCountRef.current++;
        if (readyCountRef.current < REQUIRED_READY_FRAMES) return;

      // Enough consecutive ready frames — navigate with WS result (no capture needed)
        wsDisconnectRef.current();
        setScanState("processing");

        setSkinResult({
          freshness: data.freshness || "unknown",
          confidence: data.confidence || 0,
        });
        router.push("/result");
      } else {
        readyCountRef.current = 0; // reset if not ready
      }
    },
    [scanState, currentSpecies],
  );

  const {
    connect: wsConnect,
    disconnect: wsDisconnect,
    sendFrame,
    connectionState,
    isConnected,
  } = useDetectionWebSocket({
    targetSpecies: currentSpecies,
    expectedPart: "skin",
    onResult: handleWsResult,
    autoConnect: false, // we'll connect manually when scanning starts
  });

  // Keep refs up to date so handleWsResult always has latest functions
  wsConnectRef.current = wsConnect;
  wsDisconnectRef.current = wsDisconnect;

  // ── WebSocket lifecycle: connect on scanning start, disconnect on leave ──
  const wsStartedRef = useRef(false);

  useEffect(() => {
    if (scanState === "scanning" && !wsStartedRef.current) {
      wsStartedRef.current = true;
      wsConnect();
    }

    if (scanState !== "scanning" && wsStartedRef.current) {
      wsStartedRef.current = false;
      wsDisconnect();
    }
  }, [scanState]);

  // ── Frame capture loop (sends frames over WebSocket) ─────────────────
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  // Track isConnected in a ref so the interval callback always reads the latest value
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    if (scanState !== "scanning") {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      return;
    }

    frameIntervalRef.current = setInterval(async () => {
      if (inFlightRef.current || !cameraRef.current || scanState !== "scanning") return;
      if (!isConnectedRef.current) return; // wait until WS is open

      inFlightRef.current = true;
      try {
        const bytes = await captureFrameBytes(cameraRef);
        if (bytes && scanState === "scanning") {
          sendFrame(bytes);
        }
      } catch {
        // Ignore intermittent capture errors
      } finally {
        inFlightRef.current = false;
      }
    }, 250); // ~4 fps – balanced between responsiveness and load

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [scanState]);

  // ── Animations ──────────────────────────────────────────────────────
  useEffect(() => {
    if (scanState !== "scanning") return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [scanState]);

  useEffect(() => {
    if (scanState !== "scanning") return;

    const scanLine = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 80,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: -80,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    scanLine.start();

    return () => scanLine.stop();
  }, [scanState]);

  useEffect(() => {
    if (!cameraReady || !permission?.granted) return;

    const readyTimer = setTimeout(() => {
      setScanState("scanning");
    }, 1500);

    return () => clearTimeout(readyTimer);
  }, [cameraReady, permission?.granted]);

  // ── Manual Done button — uses last WS result, no capture needed ─────
  const handleDone = () => {
    if (scanState !== "scanning" || !lastDetectionRef.current) return;

    const lastResult = lastDetectionRef.current;
    wsDisconnect();
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

  // "Choose from Gallery" pressed
  const handleGalleryPress = async () => {
    setScanState("gallery");
    await pickImage();
  };

  // "Retake" from gallery → back to camera
  const handleRetake = () => {
    clearGallery();
    setScanState("scanning");
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
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
        {/* Header */}
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

        {/* Image Preview */}
        <View className="flex-1 justify-center items-center px-4">
          {galleryImageUri && (
            <View className="w-full rounded-2xl overflow-hidden border-2 border-teal-500/50">
              <Image
                source={{ uri: galleryImageUri }}
                style={{ width: "100%", height: 350 }}
                contentFit="contain"
              />
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

        {/* Quality Panel + Buttons */}
        <View className="pb-6 px-2">
          <ScanQualityPanel
            response={galleryResponse}
            expectedPart="skin"
            targetSpecies={currentSpecies}
          />

          {/* Freshness result banner */}
          {galleryResponse?.freshness && !isAnalyzing && (
            <View className={`mx-4 mb-2 px-4 py-3 rounded-xl ${
              galleryResponse.freshness.toLowerCase() === "fresh"
                ? "bg-emerald-500/20 border border-emerald-500/30"
                : "bg-red-500/20 border border-red-500/30"
            }`}>
              <View className="flex-row items-center justify-center">
                <Feather
                  name={galleryResponse.freshness.toLowerCase() === "fresh" ? "sun" : "cloud-rain"}
                  size={20}
                  color={galleryResponse.freshness.toLowerCase() === "fresh" ? "#34d399" : "#f87171"}
                />
                <Text className={`text-lg font-bold ml-2 ${
                  galleryResponse.freshness.toLowerCase() === "fresh"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {galleryResponse.freshness}
                </Text>
                {galleryResponse.confidence != null && (
                  <Text className="text-white/50 text-sm ml-2">
                    ({Math.round(galleryResponse.confidence * 100)}% confidence)
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Buttons */}
          <View className="flex-row justify-center gap-3 px-4 mt-2">
            <TouchableOpacity
              onPress={handleRetake}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-white/30 bg-white/10"
            >
              <Feather name="camera" size={18} color="#fff" />
              <Text className="text-white text-base font-semibold ml-2">Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGalleryDone}
              disabled={!galleryResponse || isAnalyzing}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                galleryResponse && !isAnalyzing
                  ? "bg-emerald-600"
                  : "bg-white/20"
              }`}
            >
              <Feather name="check" size={18} color={galleryResponse && !isAnalyzing ? "#fff" : "#ffffff40"} />
              <Text className={`text-base font-bold ml-2 ${
                galleryResponse && !isAnalyzing ? "text-white" : "text-white/40"
              }`}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Camera Mode ────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <View
        style={{ flex: 1 }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLayoutSize({ width, height });
        }}
      >
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />

        {/* Segmentation mask overlay */}
        {maskPolygon && maskPolygon.length >= 3 && layoutSize.width > 0 && (
          <View style={{ position: "absolute", top: 0, left: 0, width: layoutSize.width, height: layoutSize.height }}>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderWidth: 2,
                borderColor: "#22c55e",
                borderRadius: 8,
              }}
            />
          </View>
        )}
      </View>

      <View className="absolute inset-0 bg-black/20 pointer-events-none">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 pt-16">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/50 justify-center items-center pointer-events-auto">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-white/30 justify-center items-center">
              <Text className="text-white font-semibold">1</Text>
            </View>
            <View className="w-10 h-0.5 bg-white/30 mx-2" />
            <View className={`w-8 h-8 rounded-full justify-center items-center ${scanState === "scanning" ? "bg-teal-600" : "bg-white/30"}`}>
              <Text className="text-white font-semibold">2</Text>
            </View>
          </View>
        </View>

        {/* Skin Patch Scan Frame */}
        <View className="flex-1 justify-center items-center">
          <Animated.View 
            className="items-center justify-center"
            style={{
              transform: [{ scale: scanState === "scanning" ? pulseAnim : 1 }],
              opacity: scanState === "ready" ? 0.5 : 1,
            }}
          >
            <View className="relative w-56 h-56 items-center justify-center">
              {/* Outer skin texture border */}
              <View className="absolute inset-0 border-4 border-teal-500 rounded-[40px] bg-teal-500/5" />
              
              {/* Inner texture lines */}
              <View className="absolute top-8 left-8 right-8 h-px bg-teal-500/30" />
              <View className="absolute top-16 left-6 right-6 h-px bg-teal-500/20" />
              <View className="absolute top-24 left-10 right-10 h-px bg-teal-500/30" />
              <View className="absolute top-32 left-8 right-8 h-px bg-teal-500/20" />
              <View className="absolute top-40 left-6 right-6 h-px bg-teal-500/30" />
              
              {/* Scale-like pattern */}
              <View className="absolute top-12 left-12 w-8 h-8 border border-teal-500/40 rounded-lg rotate-12" />
              <View className="absolute top-20 right-12 w-8 h-8 border border-teal-500/40 rounded-lg -rotate-12" />
              <View className="absolute bottom-16 left-16 w-8 h-8 border border-teal-500/40 rounded-lg rotate-6" />
              <View className="absolute bottom-24 right-16 w-8 h-8 border border-teal-500/40 rounded-lg -rotate-6" />
              
              {/* Center detection zone */}
              <View className="w-20 h-20 rounded-2xl border-4 border-teal-400/50 items-center justify-center">
                <Feather name="layers" size={32} color="#14b8a6" />
              </View>
              
              {/* Scan line */}
              {scanState === "scanning" && (
                <Animated.View 
                  className="absolute left-4 right-4 h-0.5 bg-teal-400"
                  style={{
                    transform: [{ translateY: scanLineAnim }],
                  }}
                />
              )}
            </View>
          </Animated.View>
          
          <Text className="text-white/60 text-sm mt-4 font-medium">SKIN SCAN</Text>

          {/* WebSocket connection indicator */}
          {scanState === "scanning" && (
            <View className="flex-row items-center mt-2">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${
                isConnected ? "bg-emerald-400" : connectionState === "connecting" ? "bg-amber-400" : "bg-red-400"
              }`} />
              <Text className="text-white/40 text-xs">
                {isConnected ? "Live detection" : connectionState === "connecting" ? "Connecting..." : "Offline"}
              </Text>
            </View>
          )}
        </View>

        {/* Status + Buttons */}
        <View className="items-center py-4 pointer-events-auto">
          {scanState === "ready" && (
            <View className="bg-black/50 px-6 py-3 rounded-lg">
              <Text className="text-white text-lg font-bold text-center">
                Get Ready...
              </Text>
            </View>
          )}
          
          {scanState === "scanning" && (
            <>
              <ScanQualityPanel
                response={detectionResponse}
                expectedPart="skin"
                targetSpecies={currentSpecies}
              />

              {/* Action buttons */}
              <View className="flex-row justify-center gap-3 px-4 mt-2">
                <TouchableOpacity
                  onPress={handleDone}
                  disabled={!hasDetection}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${hasDetection ? "bg-teal-600" : "bg-white/20"}`}
                >
                  <Feather name="check" size={18} color={hasDetection ? "#fff" : "#ffffff40"} />
                  <Text className={`text-base font-semibold ml-2 ${hasDetection ? "text-white" : "text-white/40"}`}>
                    {hasDetection ? "Done" : "Waiting..."}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGalleryPress}
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl border border-white/30 bg-white/10"
                >
                  <Feather name="image" size={18} color="#fff" />
                  <Text className="text-white text-base font-semibold ml-2">Gallery</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {scanState === "processing" && (
            <View className="bg-black/70 px-6 py-3 rounded-lg">
              <Text className="text-white text-lg font-bold text-center">
                Processing...
              </Text>
            </View>
          )}
        </View>

        {/* Step indicator */}
        <View className="flex-row justify-center pb-8">
          <View className={`px-4 py-2 rounded-full ${scanState === "scanning" ? "bg-teal-600" : "bg-white/20"}`}>
            <Text className={`text-sm font-semibold ${scanState === "scanning" ? "text-white" : "text-white/70"}`}>
              Scanning
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}