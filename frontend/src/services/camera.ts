import { CameraView } from "expo-camera";

/**
 * Capture a single frame and return it as a Blob.
 * Only called on-demand (e.g., when user taps "Done").
 */
export const captureFrameBlob = async (
  cameraRef: React.RefObject<CameraView | null>
): Promise<Blob | null> => {
  if (!cameraRef.current) return null;

  try {
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.3,
      exif: false,
      skipProcessing: true,
    });

    if (!photo?.uri) return null;

    const response = await fetch(photo.uri);
    const blob = await response.blob();
    return blob;
  } catch {
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
      exif: false,
    });
    return photo?.uri || null;
  } catch (error) {
    console.error("Failed to capture high-res image:", error);
    return null;
  }
};