import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import { useScanStore } from "../../store/scanStore";
import { detectSpecies } from "../../services/api";
import { captureLowRes } from "../../services/camera";
import { getGuidanceMessage } from "../../utils/scoring";

export default function EyeScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const currentSpecies = useScanStore((state) => state.currentSpecies);
  const setEyeResult = useScanStore((state) => state.setEyeResult);

  const [scanState, setScanState] = useState<"ready" | "scanning" | "detected" | "processing">("ready");
  const [guidance, setGuidance] = useState("Get ready to scan...");
  const [confidence, setConfidence] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  // Animate scan line
  useEffect(() => {
    if (scanState !== "scanning") return;

    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100);
    }, 30);

    return () => clearInterval(interval);
  }, [scanState]);

  // Camera ready handler - show ready state
  useEffect(() => {
    if (!cameraReady || !permission?.granted) return;

    // Show "ready" state for 1.5 seconds before starting scan
    const readyTimer = setTimeout(() => {
      setScanState("scanning");
      setGuidance("Position the fish eye in the frame");
      startDetection();
    }, 1500);

    return () => clearTimeout(readyTimer);
  }, [cameraReady, permission?.granted]);

  const startDetection = async () => {
    // Don't capture if not in scanning state
    if (scanState !== "scanning") return;

    const uri = await captureLowRes(cameraRef);
    if (!uri) {
      // Retry if capture failed
      setTimeout(startDetection, 500);
      return;
    }

    try {
      const response = await detectSpecies(
        uri,
        currentSpecies || undefined,
        "eye"
      );

      setGuidance(getGuidanceMessage(response.reason));
      setConfidence(response.confidence || 0);

      if (response.ready_for_capture) {
        // Detected! Show detected state
        setScanState("detected");
        
        // Brief pause then process
        setTimeout(() => {
          setScanState("processing");
          processImage();
        }, 500);
      } else {
        // Continue scanning
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

      const response = await detectSpecies(uri, currentSpecies || undefined, "eye");
      
      setEyeResult({
        uri,
        freshness: response.freshness || "unknown",
        confidence: response.confidence || 0,
      });
      
      router.push("/skin-scan");
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
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      <View className="absolute inset-0 bg-black/30">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 pt-16">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-black/50 justify-center items-center">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className={`w-8 h-8 rounded-full justify-center items-center ${scanState === "scanning" ? "bg-teal-600" : "bg-white/30"}`}>
              <Text className="text-white font-semibold">1</Text>
            </View>
            <View className="w-10 h-0.5 bg-white/30 mx-2" />
            <View className="w-8 h-8 rounded-full bg-white/30 justify-center items-center">
              <Text className="text-white font-semibold">2</Text>
            </View>
          </View>
        </View>

        {/* Scan Frame */}
        <View className="flex-1 justify-center items-center">
          {/* Corner brackets - always visible */}
          <View className="absolute top-1/4 left-5 w-12 h-12 border-t-3 border-l-3 border-teal-500" />
          <View className="absolute top-1/4 right-5 w-12 h-12 border-t-3 border-r-3 border-teal-500" />
          <View className="absolute bottom-1/4 left-5 w-12 h-12 border-b-3 border-l-3 border-teal-500" />
          <View className="absolute bottom-1/4 right-5 w-12 h-12 border-b-3 border-r-3 border-teal-500" />
          
          {/* Scan line animation - only when scanning */}
          {scanState === "scanning" && (
            <View 
              className="absolute w-56 h-0.5 bg-teal-500"
              style={{ top: `${25 + (scanLine * 0.5)}%` }}
            />
          )}
          
          {/* Detected indicator */}
          {scanState === "detected" && (
            <View className="absolute items-center">
              <View className="w-20 h-20 rounded-full bg-teal-500/30 justify-center items-center">
                <Feather name="check" size={40} color="#14b8a6" />
              </View>
            </View>
          )}
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
            </>
          )}
          
          {scanState === "detected" && (
            <View className="bg-teal-500/80 px-6 py-3 rounded-lg">
              <Text className="text-white text-lg font-bold text-center">
                ✓ Detected!
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