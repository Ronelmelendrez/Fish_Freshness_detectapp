import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useScanStore } from "../../store/scanStore";
import { FISH_SPECIES, FishSpecies } from "../../types";

export default function SpeciesScreen() {
  const router = useRouter();
  const setCurrentSpecies = useScanStore((state) => state.setCurrentSpecies);

  const handleSelectSpecies = (species: FishSpecies) => {
    setCurrentSpecies(species);
    router.push("/eye-scan");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Species</Text>
        <Text style={styles.subtitle}>Choose the fish species to scan</Text>
      </View>

      <FlatList
        data={FISH_SPECIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.speciesCard}
            onPress={() => handleSelectSpecies(item.id)}
          >
            <View style={styles.iconWrapper}>
              <Feather name="layers" size={32} color="#0d9488" />
            </View>
            <View style={styles.speciesInfo}>
              <Text style={styles.speciesName}>{item.name}</Text>
              <Text style={styles.speciesDescription}>{item.description}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  speciesCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ccfbf1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  speciesDescription: {
    fontSize: 12,
    color: "#64748b",
  },
});