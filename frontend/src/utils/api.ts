import Constants from "expo-constants";

export interface DetectionResponse {
  detected_species: string | null;
  detected_part: string | null;
  confidence: number | null;
  is_blurry: boolean;
  is_centered: boolean;
  blurriness_score: number;
  ready_for_capture: boolean;
  reason?: string | null;
}

export interface FreshnessResponse {
  freshness_label: string | null;
  freshness_confidence: number | null;
  segmentation_confidence: number;
  mask_area: number;
  reason?: string | null;
}

const resolveHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  return host || null;
};

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = resolveHost();
  if (host) {
    return `http://${host}:8000`;
  }

  return "http://127.0.0.1:8000";
};

export const uploadDetection = async (
  imageUri: string,
  targetSpecies?: string,
  expectedPart?: "eye" | "skin",
): Promise<DetectionResponse> => {
  const url = new URL("/detect", getApiBaseUrl());
  if (targetSpecies) {
    url.searchParams.set("target_species", targetSpecies);
  }
  if (expectedPart) {
    url.searchParams.set("expected_part", expectedPart);
  }

  const form = new FormData();
  // React Native FormData expects a file-like object.
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

export const uploadFreshness = async (
  imageUri: string,
): Promise<FreshnessResponse> => {
  const url = new URL("/freshness", getApiBaseUrl());

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
    throw new Error(detail || "Freshness failed");
  }

  return (await response.json()) as FreshnessResponse;
};
