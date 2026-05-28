/**
 * NativeWind animated components
 * Use cssInterop to enable className on Reanimated components.
 */
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

export const AnimatedView = cssInterop(Animated.View, { className: "style" });
export const AnimatedText = cssInterop(Animated.Text, { className: "style" });
