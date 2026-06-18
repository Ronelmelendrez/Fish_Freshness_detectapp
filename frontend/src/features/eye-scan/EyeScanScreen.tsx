import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
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

  const MAX_AUTO_CAPTURE_TIME = 12; // seconds

  // Auto-capture loop
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

      // Capture low-res frame
      const uri = await captureLowRes(cameraRef);
      if (!uri) return;

      // Send to backend
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

  // Handle auto-capture when ready
  useEffect(() => {
    if (readyForCapture && !isProcessing) {
      handleCapture();
    }
  }, [readyForCapture]);

  const handleCapture = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Capture high-res image
      const uri = await captureHighRes(cameraRef);
      if (!uri) {
        Alert.alert("Error", "Failed to capture image");
        setIsProcessing(false);
        return;
      }

      // Send to backend for final detection
      const response = await detectSpecies(uri, currentSpecies || undefined, "eye");

      // Save result
      setEyeResult({
        uri,
        freshness: response.freshness || "unknown",
        confidence: response.confidence || 0,
      });

      // Navigate to skin scan
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
      <View style={styles.permissionContainer}>
        <Feather name="camera" size={64} color="#94a3b8" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to scan fish freshness
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <View style={[styles.step, styles.activeStep]}>
                <Text style={styles.stepText}>1</Text>
              </View>
              <View style={styles.stepDivider} />
              <View style={styles.step}>
                <Text style={styles.stepText}>2</Text>
              </View>
            </View>
          </View>

          {/* Center Frame */}
          <View style={styles.centerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Guidance */}
          <View style={styles.guidanceContainer}>
            <Text style={styles.guidanceText}>{guidance}</Text>
            {confidence > 0 && (
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(confidence * 100)}%
              </Text>
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {showManualButton && (
              <TouchableOpacity
                style={styles.manualButton}
                onPress={handleCapture}
                disabled={isProcessing}
              >
                <Feather name="camera" size={24} color="#fff" />
                <Text style={styles.manualButtonText}>Capture</Text>
              </TouchableOpacity>
            )}

            <View style={styles.timerContainer}>
              <Feather name="clock" size={16} color="#fff" />
              <Text style={styles.timerText}>{timer}s</Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "#0d9488",
  },
  stepText: {
    color: "#fff",
    fontWeight: "600",
  },
  stepDivider: {
    width: 40,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },
  centerFrame: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#0d9488",
  },
  topLeft: {
    top: "30%",
    left: "20%",
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: "30%",
    right: "20%",
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: "30%",
    left: "20%",
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: "30%",
    right: "20%",
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  guidanceContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  guidanceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confidenceText: {
    color: "#0d9488",
    fontSize: 14,
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  manualButton: {
    flexDirection: "row",
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  manualButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    color: "#fff",
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8fafc",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingContainer: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  processingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
});