import Constants from "expo-constants";
import { DetectionResponse } from "../types";

const resolveHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  return host || null;
};

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = resolveHost();
  if (host) {
    return `http://${host}:8000`;
  }

  return "http://127.0.0.1:8000";
};

/**
 * Send image to backend for detection
 */
export const detectSpecies = async (
  imageUri: string,
  targetSpecies?: string,
  expectedPart?: "eye" | "skin",
): Promise<DetectionResponse> => {
  const baseUrl = getApiBaseUrl();
  const url = new URL("/api/v1/detect", baseUrl);

  if (targetSpecies) {
    url.searchParams.set("target_species", targetSpecies);
  }
  if (expectedPart) {
    url.searchParams.set("expected_part", expectedPart);
  }

  const form = new FormData();
  form.append("image", {
    uri: imageUri,
    name: "capture.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const response = await fetch(url.toString(), {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Detection failed");
  }

  return (await response.json()) as DetectionResponse;
};