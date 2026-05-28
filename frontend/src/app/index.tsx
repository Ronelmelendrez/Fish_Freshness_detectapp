import { AppHeader } from "@/components/app-header";
import { FishCard } from "@/components/fish-card";
import { GradientHeader } from "@/components/gradient-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fishSpecies } from "@/constants/fishData";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredFish = fishSpecies.filter((fish) =>
    fish.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ThemedView className="flex-1 bg-slate-50 dark:bg-gray-950">
      <SafeAreaView className="flex-1">
        <View className="absolute -top-24 -left-12 h-64 w-64 rounded-full bg-teal-200/40 dark:bg-teal-900/25" />
        <View className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-cyan-200/30 dark:bg-cyan-900/20" />

        <View className="px-4 pt-2 pb-3">
          <AppHeader
            title="FreshCheck"
            subtitle="AI freshness insights"
            showBack={false}
            layout="row"
            rightSlot={
              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="relative">
                  <Feather
                    name="bell"
                    size={22}
                    color="#0f172a"
                    className="dark:text-white"
                  />
                  <View className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-2 rounded-full bg-teal-600 px-4 py-2">
                  <Feather name="camera" size={16} color="#ffffff" />
                  <ThemedText className="text-xs font-semibold text-white">
                    Scan
                  </ThemedText>
                </TouchableOpacity>
              </View>
            }
          ></AppHeader>
        </View>

        <FlatList
          data={filteredFish}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <FishCard {...item} index={index} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="pb-4">
              <View>
                <View className="flex-row items-center rounded-2xl bg-white/90 dark:bg-gray-900/80 border border-white/60 dark:border-gray-800 px-4 py-3 shadow-sm">
                  <Feather name="search" size={18} color="#64748b" />
                  <TextInput
                    placeholder="Search fish species"
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 ml-2 text-gray-900 dark:text-white"
                  />
                  {searchQuery !== "" && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Feather name="x-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity className="ml-2 rounded-full bg-teal-50 dark:bg-teal-900/40 p-2">
                    <Feather name="sliders" size={16} color="#0f766e" />
                  </TouchableOpacity>
                </View>

                <View className="mt-3 flex-row gap-2">
                  <View className="rounded-full bg-teal-100/70 dark:bg-teal-900/40 px-3 py-1">
                    <ThemedText className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                      Tuna
                    </ThemedText>
                  </View>
                  <View className="rounded-full bg-slate-200/70 dark:bg-gray-800 px-3 py-1">
                    <ThemedText className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Salmon
                    </ThemedText>
                  </View>
                  <View className="rounded-full bg-slate-200/70 dark:bg-gray-800 px-3 py-1">
                    <ThemedText className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Mackerel
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View className="mt-5">
                <GradientHeader
                  title="Scan with confidence"
                  subtitle="AI checks texture, color, and clarity in seconds"
                />
              </View>

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-white/90 dark:bg-gray-900/80 border border-white/60 dark:border-gray-800 p-4 shadow-sm">
                  <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                    Last scan
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold text-gray-900 dark:text-white">
                    Atlantic Cod
                  </ThemedText>
                  <ThemedText className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Fresh • 92%
                  </ThemedText>
                </View>
                <View className="flex-1 rounded-2xl bg-white/90 dark:bg-gray-900/80 border border-white/60 dark:border-gray-800 p-4 shadow-sm">
                  <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                    Weekly scans
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold text-gray-900 dark:text-white">
                    24 checked
                  </ThemedText>
                  <ThemedText className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                    4 alerts
                  </ThemedText>
                </View>
              </View>

              <View className="mt-6 flex-row items-center justify-between">
                <ThemedText className="text-lg font-bold text-gray-900 dark:text-white">
                  Popular today
                </ThemedText>
                <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredFish.length} results
                </ThemedText>
              </View>
            </View>
          }
        />
      </SafeAreaView>

      {/* Bottom Tab Bar (Shopee style) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-row justify-around py-2">
        <TouchableOpacity className="items-center py-1">
          <Feather name="home" size={24} color="#0d9488" />
          <ThemedText className="text-xs text-teal-600 mt-1">Home</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity className="items-center py-1">
          <Feather name="clock" size={24} color="#6b7280" />
          <ThemedText className="text-xs text-gray-500 mt-1">
            History
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity className="items-center py-1">
          <Feather name="user" size={24} color="#6b7280" />
          <ThemedText className="text-xs text-gray-500 mt-1">
            Profile
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
