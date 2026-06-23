import { CameraView } from "expo-camera";

/**
 * Capture a frame and return it as raw bytes (ArrayBuffer) for WebSocket streaming.
 * Uses takePictureAsync under the hood — the only way to get frames from expo-camera's CameraView.
 * Optimised for speed: low quality, no EXIF, skip processing.
 */
export const captureFrameBytes = async (
  cameraRef: React.RefObject<CameraView | null>
): Promise<ArrayBuffer | null> => {
  if (!cameraRef.current) return null;

  try {
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.3,
      exif: false,
      skipProcessing: true,
    });

    if (!photo?.uri) return null;

    const response = await fetch(photo.uri);
    const buffer = await response.arrayBuffer();
    return buffer;
  } catch {
    return null;
  }
};