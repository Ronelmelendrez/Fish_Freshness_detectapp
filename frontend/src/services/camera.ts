import { CameraView } from "expo-camera";

/**
 * Capture a low-resolution image for auto-capture detection loop
 */
export const captureLowRes = async (
  cameraRef: React.RefObject<CameraView | null>
): Promise<string | null> => {
  if (!cameraRef.current) return null;

  try {
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.3,
      base64: false,
      skipProcessing: true,
    });
    return photo?.uri || null;
  } catch (error) {
    console.error("Failed to capture low-res image:", error);
    return null;
  }
};

/**
 * Capture a high-resolution image for final capture
 */
export const captureHighRes = async (
  cameraRef: React.RefObject<CameraView | null>
): Promise<string | null> => {
  if (!cameraRef.current) return null;

  try {
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
      base64: false,
      skipProcessing: false,
    });
    return photo?.uri || null;
  } catch (error) {
    console.error("Failed to capture high-res image:", error);
    return null;
  }
};