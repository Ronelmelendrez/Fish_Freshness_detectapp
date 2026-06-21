import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { testConnection } from "../../services/api";

export default function HomeScreen() {
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  useEffect(() => {
    const checkBackend = async () => {
      console.log("🔗 [APP STARTUP] Testing backend connection...");
      const connected = await testConnection();
      setBackendStatus(connected ? "connected" : "disconnected");
      console.log(
        connected
          ? "✅ [APP STARTUP] Backend is online"
          : "❌ [APP STARTUP] Backend is offline — detection will fail"
      );
    };
    checkBackend();
  }, []);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-32 h-32 rounded-full bg-teal-100 justify-center items-center mb-6">
          <Feather name="eye" size={64} color="#0d9488" />
        </View>
        <Text className="text-4xl font-bold text-slate-900 mb-2">
          Fishdectapp
        </Text>
        <Text className="text-base font-semibold text-teal-600 mb-4">
          AI-Powered Fish Freshness Detection
        </Text>
        <Text className="text-sm text-slate-500 text-center leading-5 mb-8">
          Scan your fish's eye and skin to get instant freshness results powered
          by AI.
        </Text>
        {backendStatus === "checking" && (
          <Text className="text-xs text-slate-400 mb-2">Connecting to server...</Text>
        )}
        {backendStatus === "connected" && (
          <Text className="text-xs text-emerald-500 mb-2">✅ Backend connected</Text>
        )}
        {backendStatus === "disconnected" && (
          <Text className="text-xs text-red-500 mb-2">❌ Backend offline — start the server</Text>
        )}
        <TouchableOpacity
          className="flex-row bg-teal-600 px-8 py-4 rounded-xl items-center gap-2"
          onPress={() => router.push("/species-selection")}
        >
          <Text className="text-white text-lg font-semibold">Start Scan</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View className="p-6 items-center">
        <Text className="text-xs text-slate-400">
          Place your fish in good lighting
        </Text>
      </View>
    </View>
  );
}