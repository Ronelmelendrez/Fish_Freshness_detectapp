import { View, Text, TouchableOpacity, Alert, Animated } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import { useScanStore } from "../../store/scanStore";
import { detectSpecies } from "../../services/api";
import { captureLowRes } from "../../services/camera";
import { getGuidanceMessage } from "../../utils/scoring";
import { SegmentationOverlay } from "../../utils/segmentation";
import { ScanQualityPanel } from "../../components/ScanQualityPanel";
import { DetectionResponse } from "../../types";

export default function SkinScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const currentSpecies = useScanStore((state) => state.currentSpecies);
  const setSkinResult = useScanStore((state) => state.setSkinResult);

  const [scanState, setScanState] = useState<"ready" | "scanning" | "detected" | "processing">("ready");
  const [guidance, setGuidance] = useState("Get ready to scan...");
  const [confidence, setConfidence] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [maskPolygon, setMaskPolygon] = useState<number[][] | null>(null);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(-80)).current;

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
      setGuidance("Position the fish skin in the frame");
      startDetection();
    }, 1500);

    return () => clearTimeout(readyTimer);
  }, [cameraReady, permission?.granted]);

  const startDetection = async () => {
    if (scanState !== "scanning") return;

    const uri = await captureLowRes(cameraRef);
    if (!uri) {
      setTimeout(startDetection, 500);
      return;
    }

    try {
      const response = await detectSpecies(
        uri,
        currentSpecies || undefined,
        "skin"
      );

      setGuidance(getGuidanceMessage(response.reason ?? null));
      setConfidence(response.confidence || 0);
      setMaskPolygon(response.mask_polygon ?? null);
      setDetectionResponse(response);

      if (response.ready_for_capture) {
        setScanState("detected");
        
        setTimeout(() => {
          setScanState("processing");
          processImage();
        }, 500);
      } else {
        setTimeout(startDetection, 800);
      }
    } catch (error) {
      console.error("Detection error:", error);
      setTimeout(startDetection, 1000);
    }
  };

  const processImage = async () => {
    try {
      const uri = await captureLowRes(cameraRef);
      if (!uri) {
        Alert.alert("Error", "Failed to capture image");
        setScanState("scanning");
        startDetection();
        return;
      }

      const response = await detectSpecies(uri, currentSpecies || undefined, "skin");
      
      setSkinResult({
        uri,
        freshness: response.freshness || "unknown",
        confidence: response.confidence || 0,
      });
      
      router.push("/result");
    } catch (error) {
      Alert.alert("Error", "Detection failed. Please try again.");
      setScanState("scanning");
      startDetection();
    }
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
          <SegmentationOverlay
            polygon={maskPolygon}
            width={layoutSize.width}
            height={layoutSize.height}
            strokeColor="#22c55e"
            fillOpacity={0.15}
          />
        )}
      </View>

      <View className="absolute inset-0 bg-black/20 pointer-events-none">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 pt-16">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/50 justify-center items-center">
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
              <View className={`w-20 h-20 rounded-2xl border-4 ${scanState === "detected" ? "border-emerald-400 bg-emerald-400/20" : "border-teal-400/50"} items-center justify-center`}>
                <Feather name="layers" size={32} color={scanState === "detected" ? "#34d399" : "#14b8a6"} />
              </View>
              
              {/* Scan line using transform */}
              {scanState === "scanning" && (
                <Animated.View 
                  className="absolute left-4 right-4 h-0.5 bg-teal-400"
                  style={{
                    transform: [{ translateY: scanLineAnim }],
                  }}
                />
              )}
              
              {/* Detected checkmark */}
              {scanState === "detected" && (
                <View className="absolute inset-0 items-center justify-center">
                  <Feather name="check-circle" size={48} color="#34d399" />
                </View>
              )}
            </View>
          </Animated.View>
          
          <Text className="text-white/60 text-sm mt-4 font-medium">SKIN SCAN</Text>
        </View>

        {/* Status */}
        <View className="items-center py-4">
          {scanState === "ready" && (
            <View className="bg-black/50 px-6 py-3 rounded-lg">
              <Text className="text-white text-lg font-bold text-center">
                Get Ready...
              </Text>
            </View>
          )}
          
          {scanState === "scanning" && (
            <>
              <Text className="text-white text-base font-semibold bg-black/50 px-4 py-2 rounded-lg text-center">
                {guidance}
              </Text>
              {confidence > 0 && (
                <Text className="text-teal-500 text-sm mt-2 bg-black/50 px-3 py-1 rounded">
                  Confidence: {Math.round(confidence * 100)}%
                </Text>
              )}
              {/* Backend quality indicators */}
              <ScanQualityPanel
                response={detectionResponse}
                expectedPart="skin"
                targetSpecies={currentSpecies}
              />
            </>
          )}
          
          {scanState === "detected" && (
            <View className="bg-emerald-500/80 px-6 py-3 rounded-lg">
              <Text className="text-white text-lg font-bold text-center">
                ✓ Skin Detected!
              </Text>
            </View>
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
          <View className="w-8 items-center justify-center">
            <Feather name="chevron-right" size={16} color="#fff" />
          </View>
          <View className={`px-4 py-2 rounded-full ${scanState === "processing" ? "bg-teal-600" : "bg-white/20"}`}>
            <Text className={`text-sm font-semibold ${scanState === "processing" ? "text-white" : "text-white/70"}`}>
              Processing
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
