import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import { useScanStore } from "../../store/scanStore";
import { detectSpecies } from "../../services/api";
import { captureLowRes, captureHighRes } from "../../services/camera";
import { getGuidanceMessage } from "../../utils/scoring";

export default function EyeScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const currentSpecies = useScanStore((state) => state.currentSpecies);
  const setEyeResult = useScanStore((state) => state.setEyeResult);

  const [isProcessing, setIsProcessing] = useState(false);
  const [guidance, setGuidance] = useState("Position the fish eye in the center");
  const [readyForCapture, setReadyForCapture] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [timer, setTimer] = useState(0);
  const [showManualButton, setShowManualButton] = useState(false);

  const MAX_AUTO_CAPTURE_TIME = 12;

  useEffect(() => {
    if (!permission?.granted || isProcessing || readyForCapture) return;

    const interval = setInterval(async () => {
      setTimer((prev) => {
        const newTime = prev + 1;
        if (newTime >= MAX_AUTO_CAPTURE_TIME) {
          setShowManualButton(true);
        }
        return newTime;
      });

      const uri = await captureLowRes(cameraRef);
      if (!uri) return;

      try {
        const response = await detectSpecies(
          uri,
          currentSpecies || undefined,
          "eye"
        );

        setGuidance(getGuidanceMessage(response.reason));
        setConfidence(response.confidence || 0);
        setReadyForCapture(response.ready_for_capture);
      } catch (error) {
        console.error("Detection error:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [permission?.granted, isProcessing, readyForCapture, currentSpecies]);

  useEffect(() => {
    if (readyForCapture && !isProcessing) {
      handleCapture();
    }
  }, [readyForCapture]);

  const handleCapture = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const uri = await captureHighRes(cameraRef);
      if (!uri) {
        Alert.alert("Error", "Failed to capture image");
        setIsProcessing(false);
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
      setIsProcessing(false);
    }
  }, [isProcessing, currentSpecies]);

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
        <TouchableOpacity
          className="bg-teal-600 px-6 py-3 rounded-xl"
          onPress={requestPermission}
        >
          <Text className="text-white text-base font-semibold">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <View className="flex-1 bg-black/30">
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 pt-16">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
            >
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-teal-600 justify-center items-center">
                <Text className="text-white font-semibold">1</Text>
              </View>
              <View className="w-10 h-0.5 bg-white/30 mx-2" />
              <View className="w-8 h-8 rounded-full bg-white/30 justify-center items-center">
                <Text className="text-white font-semibold">2</Text>
              </View>
            </View>
          </View>

          {/* Center Frame */}
          <View className="flex-1 justify-center items-center">
            <View className="absolute top-1/4 left-5 w-10 h-10 border-t-3 border-l-3 border-teal-500" />
            <View className="absolute top-1/4 right-5 w-10 h-10 border-t-3 border-r-3 border-teal-500" />
            <View className="absolute bottom-1/4 left-5 w-10 h-10 border-b-3 border-l-3 border-teal-500" />
            <View className="absolute bottom-1/4 right-5 w-10 h-10 border-b-3 border-r-3 border-teal-500" />
          </View>

          {/* Guidance */}
          <View className="items-center py-4">
            <Text className="text-white text-base font-semibold bg-black/50 px-4 py-2 rounded-lg text-center">
              {guidance}
            </Text>
            {confidence > 0 && (
              <Text className="text-teal-500 text-sm mt-2 bg-black/50 px-3 py-1 rounded">
                Confidence: {Math.round(confidence * 100)}%
              </Text>
            )}
          </View>

          {/* Bottom Controls */}
          <View className="flex-row justify-center items-center p-6 gap-4">
            {showManualButton && (
              <TouchableOpacity
                className="flex-row bg-teal-600 px-6 py-3 rounded-xl items-center gap-2"
                onPress={handleCapture}
                disabled={isProcessing}
              >
                <Feather name="camera" size={24} color="#fff" />
                <Text className="text-white text-base font-semibold">
                  Capture
                </Text>
              </TouchableOpacity>
            )}

            <View className="flex-row items-center gap-1 bg-black/50 px-3 py-1.5 rounded-lg">
              <Feather name="clock" size={16} color="#fff" />
              <Text className="text-white text-sm">{timer}s</Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Processing Overlay */}
      {isProcessing && (
        <View className="absolute inset-0 bg-black/70 justify-center items-center">
          <View className="bg-white p-8 rounded-2xl items-center">
            <Text className="text-lg font-semibold text-slate-900">
              Processing...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}