import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useScanStore } from "../../store/scanStore";
import { calculateFreshnessScore } from "../../utils/scoring";
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
        return "#22c55e";
      case "Acceptable":
        return "#f59e0b";
      case "Not Fresh":
        return "#ef4444";
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleNewScan} style={styles.backButton}>
            <Feather name="x" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Result</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
          <Feather name={getStatusIcon()} size={48} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {scoring.status}
          </Text>
          <Text style={styles.scoreText}>{scoring.finalScore}%</Text>
        </View>

        {/* Species Info */}
        <View style={styles.speciesCard}>
          <Feather name="layers" size={24} color="#0d9488" />
          <View style={styles.speciesInfo}>
            <Text style={styles.speciesName}>{speciesInfo?.name || currentSpecies}</Text>
            <Text style={styles.speciesDescription}>{speciesInfo?.description}</Text>
          </View>
        </View>

        {/* Eye Result */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Feather name="eye" size={20} color="#0d9488" />
            <Text style={styles.resultTitle}>Eye Scan</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Freshness</Text>
            <Text style={[styles.resultValue, { color: getStatusColor() }]}>
              {eyeResult?.freshness || "N/A"}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Confidence</Text>
            <Text style={styles.resultValue}>
              {eyeResult?.confidence ? `${Math.round(eyeResult.confidence * 100)}%` : "N/A"}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Score Weight</Text>
            <Text style={styles.resultValue}>70%</Text>
          </View>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  width: `${scoring.eyeScore}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
        </View>

        {/* Skin Result */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Feather name="layers" size={20} color="#0d9488" />
            <Text style={styles.resultTitle}>Skin Scan</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Freshness</Text>
            <Text style={[styles.resultValue, { color: getStatusColor() }]}>
              {skinResult?.freshness || "N/A"}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Confidence</Text>
            <Text style={styles.resultValue}>
              {skinResult?.confidence ? `${Math.round(skinResult.confidence * 100)}%` : "N/A"}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Score Weight</Text>
            <Text style={styles.resultValue}>30%</Text>
          </View>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  width: `${scoring.skinScore}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.newScanButton} onPress={handleNewScan}>
          <Feather name="refresh-cw" size={20} color="#fff" />
          <Text style={styles.newScanButtonText}>New Scan</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  statusBadge: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 8,
  },
  speciesCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  speciesInfo: {
    marginLeft: 12,
    flex: 1,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  speciesDescription: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginLeft: 8,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  scoreBar: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  newScanButton: {
    flexDirection: "row",
    backgroundColor: "#0d9488",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  newScanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});