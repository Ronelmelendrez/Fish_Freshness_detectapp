import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useScanStore } from "../../store/scanStore";
import { calculateFreshnessScore, getSpeciesDisplayName } from "../../utils/scoring";
import { FISH_SPECIES } from "../../types";

export default function ResultScreen() {
  const router = useRouter();
  const { currentSpecies, eyeResult, skinResult, clearScan } = useScanStore();

  const scoring = calculateFreshnessScore(
    eyeResult?.freshness || null,
    skinResult?.freshness || null
  );

  const speciesInfo = FISH_SPECIES.find((s) => s.id === currentSpecies);

  const getStatusColor = () => {
    switch (scoring.status) {
      case "Fresh":
        return "text-emerald-500";
      case "Acceptable":
        return "text-amber-500";
      case "Not Fresh":
        return "text-red-500";
    }
  };

  const getStatusBg = () => {
    switch (scoring.status) {
      case "Fresh":
        return "bg-emerald-100";
      case "Acceptable":
        return "bg-amber-100";
      case "Not Fresh":
        return "bg-red-100";
    }
  };

  const getBarColor = () => {
    switch (scoring.status) {
      case "Fresh":
        return "bg-emerald-500";
      case "Acceptable":
        return "bg-amber-500";
      case "Not Fresh":
        return "bg-red-500";
    }
  };

  const getStatusIcon = () => {
    switch (scoring.status) {
      case "Fresh":
        return "check-circle";
      case "Acceptable":
        return "alert-circle";
      case "Not Fresh":
        return "x-circle";
    }
  };

  const handleNewScan = () => {
    clearScan();
    router.push("/");
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="flex-row justify-between items-center pt-16 pb-6">
          <TouchableOpacity onPress={handleNewScan} className="w-10 h-10 rounded-full bg-slate-200 justify-center items-center">
            <Feather name="x" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Result</Text>
          <View style={{ width: 40 }} />
        </View>

        <View className={`${getStatusBg()} items-center p-8 rounded-2xl mb-6`}>
          <Feather name={getStatusIcon()} size={48} color={scoring.status === "Fresh" ? "#22c55e" : scoring.status === "Acceptable" ? "#f59e0b" : "#ef4444"} />
          <Text className={`${getStatusColor()} text-2xl font-bold mt-3`}>
            {scoring.status}
          </Text>
          <Text className="text-5xl font-bold text-slate-900 mt-2">
            {scoring.finalScore}%
          </Text>
        </View>

        <View className="flex-row items-center bg-white p-4 rounded-xl mb-4 border border-slate-200">
          <Feather name="layers" size={24} color="#0d9488" />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-slate-900">
              {getSpeciesDisplayName(currentSpecies)}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {speciesInfo?.description}
            </Text>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl mb-4 border border-slate-200">
          <View className="flex-row items-center mb-4">
            <Feather name="eye" size={20} color="#0d9488" />
            <Text className="text-base font-semibold text-slate-900 ml-2">
              Eye Scan
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Freshness</Text>
            <Text className={`text-sm font-semibold ${getStatusColor()}`}>
              {eyeResult?.freshness || "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Confidence</Text>
            <Text className="text-sm font-semibold text-slate-900">
              {eyeResult?.confidence ? `${Math.round(eyeResult.confidence * 100)}%` : "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-slate-500">Score Weight</Text>
            <Text className="text-sm font-semibold text-slate-900">70%</Text>
          </View>
          <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <View className={`h-full ${getBarColor()} rounded-full`} style={{ width: `${scoring.eyeScore}%` }} />
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl mb-4 border border-slate-200">
          <View className="flex-row items-center mb-4">
            <Feather name="layers" size={20} color="#0d9488" />
            <Text className="text-base font-semibold text-slate-900 ml-2">
              Skin Scan
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Freshness</Text>
            <Text className={`text-sm font-semibold ${getStatusColor()}`}>
              {skinResult?.freshness || "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Confidence</Text>
            <Text className="text-sm font-semibold text-slate-900">
              {skinResult?.confidence ? `${Math.round(skinResult.confidence * 100)}%` : "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-slate-500">Score Weight</Text>
            <Text className="text-sm font-semibold text-slate-900">30%</Text>
          </View>
          <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <View className={`h-full ${getBarColor()} rounded-full`} style={{ width: `${scoring.skinScore}%` }} />
          </View>
        </View>

        <TouchableOpacity className="flex-row bg-teal-600 p-4 rounded-xl items-center justify-center gap-2 mt-2" onPress={handleNewScan}>
          <Feather name="refresh-cw" size={20} color="#fff" />
          <Text className="text-white text-base font-semibold">New Scan</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}