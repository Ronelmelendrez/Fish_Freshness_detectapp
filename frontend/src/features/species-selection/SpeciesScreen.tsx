import { View, Text, TouchableOpacity, FlatList } from "react-native";
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
    <View className="flex-1 bg-slate-50">
      <View className="p-6 pt-16 bg-white border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-slate-900 mb-1">
          Select Species
        </Text>
        <Text className="text-sm text-slate-500">
          Choose the fish species to scan
        </Text>
      </View>

      <FlatList
        data={FISH_SPECIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-xl border border-slate-200"
            onPress={() => handleSelectSpecies(item.id)}
          >
            <View className="w-14 h-14 rounded-full bg-teal-100 justify-center items-center mr-4">
              <Feather name="layers" size={32} color="#0d9488" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-slate-900 mb-1">
                {item.name}
              </Text>
              <Text className="text-xs text-slate-500">
                {item.description}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}