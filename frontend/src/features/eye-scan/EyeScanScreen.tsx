import { View, Text, TouchableOpacity, Alert, Animated } from "react-native";
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
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for scanning
  useEffect(() => {
    if (scanState !== "scanning") return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [scanState]);

  // Scan line animation
  useEffect(() => {
    if (scanState !== "scanning") return;

    const scanLine = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
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
      setGuidance("Position the fish eye in the frame");
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
        "eye"
      );

      setGuidance(getGuidanceMessage(response.reason));
      setConfidence(response.confidence || 0);

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

      <View className="absolute inset-0 bg-black/20">
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

        {/* Eye-shaped Scan Frame */}
        <View className="flex-1 justify-center items-center">
          {/* Outer eye shape - almond/eye shaped */}
          <Animated.View 
            className="items-center justify-center"
            style={{
              transform: [{ scale: scanState === "scanning" ? pulseAnim : 1 }],
              opacity: scanState === "ready" ? 0.5 : 1,
            }}
          >
            {/* Eye shape using border radius */}
            <View className="relative w-64 h-40 items-center justify-center">
              {/* Left eye curve */}
              <View className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-32 border-4 border-teal-500 rounded-l-full border-r-0" />
              {/* Right eye curve */}
              <View className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-32 border-4 border-teal-500 rounded-r-full border-l-0" />
              {/* Top line */}
              <View className="absolute top-2 left-16 right-16 h-1 bg-teal-500" />
              {/* Bottom line */}
              <View className="absolute bottom-2 left-16 right-16 h-1 bg-teal-500" />
              
              {/* Inner circle (iris) */}
              <View className={`w-24 h-24 rounded-full border-4 ${scanState === "detected" ? "border-emerald-400 bg-emerald-400/20" : "border-teal-400/50"}`}>
                {/* Pupil */}
                <View className={`w-10 h-10 rounded-full mx-auto mt-7 ${scanState === "detected" ? "bg-emerald-400" : "bg-teal-400/30"}`} />
              </View>
              
              {/* Scan line */}
              {scanState === "scanning" && (
                <Animated.View 
                  className="absolute left-16 right-16 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent"
                  style={{
                    top: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["10%", "85%"],
                    }),
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
          
          {/* Label */}
          <Text className="text-white/60 text-sm mt-4 font-medium">EYE SCAN</Text>
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
            <View className="bg-emerald-500/80 px-6 py-3 rounded-lg">
              <Text className="text-white text-lg font-bold text-center">
                ✓ Eye Detected!
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