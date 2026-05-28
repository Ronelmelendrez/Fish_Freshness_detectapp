import { AnimatedView } from "@/utils/styled";
import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";
import { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "./themed-text";

interface FishCardProps {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  image: string;
  index: number;
}

/**
 * Fish species card component
 * Features: fade-in animation, press scale effect, ocean-inspired design
 */
export const FishCard: React.FC<FishCardProps> = ({
  id,
  name,
  scientificName,
  description,
  image,
  index,
}) => {
  const router = useRouter();

  return (
    <AnimatedView
      entering={FadeInDown.delay(index * 100).springify()}
      className="mb-4"
    >
      <Pressable
        onPress={() => router.push(`/scan/${id}`)}
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md dark:shadow-lg border border-teal-100 dark:border-teal-900"
        android_ripple={{ color: "rgba(13, 148, 136, 0.1)" }}
      >
        <View className="flex-row">
          {/* Fish Image */}
          <View className="w-32 h-32 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900 dark:to-cyan-900 justify-center items-center">
            <Image
              source={{ uri: image }}
              className="w-28 h-28"
              resizeMode="contain"
            />
          </View>

          {/* Fish Info */}
          <View className="flex-1 p-4 justify-center">
            <ThemedText className="text-lg font-bold text-teal-700 dark:text-teal-300">
              {name}
            </ThemedText>
            <ThemedText className="text-xs text-gray-600 dark:text-gray-400 italic mb-2">
              {scientificName}
            </ThemedText>
            <ThemedText className="text-sm text-gray-700 dark:text-gray-300 leading-5">
              {description}
            </ThemedText>

            {/* Scan Badge */}
            <View className="mt-3 self-start bg-teal-100 dark:bg-teal-900 px-3 py-1 rounded-full flex-row items-center gap-1">
              <ThemedText className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                📸 Scan
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </AnimatedView>
  );
};
