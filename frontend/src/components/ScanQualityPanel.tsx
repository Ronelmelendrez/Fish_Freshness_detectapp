import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DetectionResponse } from "../types";

interface ScanQualityPanelProps {
  response: DetectionResponse | null;
  expectedPart?: "eye" | "skin";
  targetSpecies?: string | null;
}

interface QualityCheck {
  label: string;
  passed: boolean;
  icon: FeatherIconName;
}

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

/**
 * Displays real-time quality validation indicators from the backend
 * during the scanning phase. Shows each individual check status.
 */
export const ScanQualityPanel: React.FC<ScanQualityPanelProps> = ({
  response,
  expectedPart,
  targetSpecies,
}) => {
  if (!response) return null;

  const speciesMatch = targetSpecies
    ? response.detected_species?.toLowerCase() === targetSpecies.toLowerCase()
    : true;
  const partMatch = expectedPart
    ? response.detected_part?.toLowerCase() === expectedPart.toLowerCase()
    : true;

  const checks: QualityCheck[] = [
    {
      label: "Focused",
      passed: !response.is_blurry,
      icon: response.is_blurry ? "eye-off" : "eye",
    },
    {
      label: "Centered",
      passed: response.is_centered,
      icon: response.is_centered ? "crosshair" : "move",
    },
    {
      label: "Distance",
      passed: response.is_good_size,
      icon: response.is_good_size ? "maximize-2" : "minimize-2",
    },
    {
      label: "Species",
      passed: speciesMatch,
      icon: speciesMatch ? "check-circle" : "x-circle",
    },
    {
      label: "Part",
      passed: partMatch,
      icon: partMatch ? "check-circle" : "x-circle",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;

  return (
    <View className="mx-4 mb-2 bg-black/70 rounded-xl px-4 py-3">
      {/* Header row */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white/80 text-xs font-semibold uppercase tracking-wide">
          Quality Checks
        </Text>
        <Text className={`text-xs font-bold ${passedCount === totalChecks ? "text-emerald-400" : "text-amber-400"}`}>
          {passedCount}/{totalChecks}
        </Text>
      </View>

      {/* Detected info */}
      {response.detected_species && (
        <View className="flex-row items-center mb-2 bg-white/5 rounded-lg px-3 py-1.5">
          <Feather name="tag" size={12} color="#94a3b8" />
          <Text className="text-white/70 text-xs ml-2">
            {response.detected_species.replace(/_/g, " ")}
          </Text>
          {response.detected_part && (
            <>
              <Text className="text-white/40 text-xs mx-2">•</Text>
              <Feather name="layers" size={12} color="#94a3b8" />
              <Text className="text-white/70 text-xs ml-1 uppercase">
                {response.detected_part}
              </Text>
            </>
          )}
          {response.freshness && (
            <>
              <Text className="text-white/40 text-xs mx-2">•</Text>
              <Feather
                name={response.freshness.toLowerCase() === "fresh" ? "sun" : "cloud-rain"}
                size={12}
                color={response.freshness.toLowerCase() === "fresh" ? "#34d399" : "#f87171"}
              />
              <Text
                className={`text-xs ml-1 font-medium ${
                  response.freshness.toLowerCase() === "fresh" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {response.freshness}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Quality check rows */}
      <View className="flex-row flex-wrap justify-between">
        {checks.map((check) => (
          <View key={check.label} className="flex-row items-center w-[48%] mb-1">
            <View
              className={`w-5 h-5 rounded-full justify-center items-center mr-1.5 ${
                check.passed ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              <Feather
                name={check.passed ? "check" : "x"}
                size={10}
                color={check.passed ? "#34d399" : "#f87171"}
              />
            </View>
            <Text className={`text-xs ${check.passed ? "text-emerald-400" : "text-red-400"}`}>
              {check.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Size ratio bar */}
      {response.size_ratio > 0 && (
        <View className="mt-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white/50 text-[10px]">Distance</Text>
            <Text className="text-white/50 text-[10px]">
              {Math.round(response.size_ratio * 100)}% of frame
            </Text>
          </View>
          <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${
                response.is_good_size ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{
                width: `${Math.min(Math.max(response.size_ratio * 100, 2), 100)}%`,
              }}
            />
          </View>
          {/* Optimal range indicator */}
          <View className="flex-row justify-between mt-0.5">
            <Text className="text-white/30 text-[9px]">0%</Text>
            <Text className="text-emerald-500/50 text-[9px]">optimal: 15-60%</Text>
            <Text className="text-white/30 text-[9px]">100%</Text>
          </View>
        </View>
      )}

      {/* Blurriness score bar */}
      {response.blurriness_score > 0 && !response.is_blurry && (
        <View className="mt-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white/50 text-[10px]">Sharpness</Text>
            <Text className="text-white/50 text-[10px]">
              {Math.round(response.blurriness_score)}
            </Text>
          </View>
          <View className="h-1 bg-white/10 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(response.blurriness_score, 100)}%`,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default ScanQualityPanel;