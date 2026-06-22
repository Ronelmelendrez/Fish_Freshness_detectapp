import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { detectSpecies } from "../services/api";
import { DetectionResponse } from "../types";

export interface UseGalleryScanOptions {
  /** Target species filter for detection. */
  targetSpecies?: string | null;
  /** Expected part: "eye" or "skin". */
  expectedPart: "eye" | "skin";
}

export interface UseGalleryScanReturn {
  /** Open the device image gallery. */
  pickImage: () => Promise<void>;
  /** URI of the selected gallery image. */
  galleryImageUri: string | null;
  /** Detection result from the gallery image. */
  galleryResponse: DetectionResponse | null;
  /** Whether detection is currently running. */
  isAnalyzing: boolean;
  /** Error message if detection failed. */
  error: string | null;
  /** Reset gallery state back to camera view. */
  clearGallery: () => void;
}

/**
 * Shared hook that handles gallery image picking and detection.
 * Used by both EyeScanScreen and SkinScanScreen to avoid duplicate logic.
 */
export function useGalleryScan({
  targetSpecies,
  expectedPart,
}: UseGalleryScanOptions): UseGalleryScanReturn {
  const [galleryImageUri, setGalleryImageUri] = useState<string | null>(null);
  const [galleryResponse, setGalleryResponse] =
    useState<DetectionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async () => {
    // Request media library permission
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setError("Gallery permission is required to select images.");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    // Handle cancellation
    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setGalleryImageUri(asset.uri);
    setError(null);

    // Run detection
    setIsAnalyzing(true);
    try {
      const detectionResult = await detectSpecies(
        asset.uri,
        targetSpecies || undefined,
        expectedPart
      );
      setGalleryResponse(detectionResult);
    } catch (err: any) {
      console.error("Gallery detection error:", err);
      setError(err?.message || "Detection failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [targetSpecies, expectedPart]);

  const clearGallery = useCallback(() => {
    setGalleryImageUri(null);
    setGalleryResponse(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    pickImage,
    galleryImageUri,
    galleryResponse,
    isAnalyzing,
    error,
    clearGallery,
  };
}