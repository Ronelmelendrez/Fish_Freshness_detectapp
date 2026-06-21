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
 * Test connection to the backend server.
 * Returns true if backend is reachable, false otherwise.
 */
export const testConnection = async (): Promise<boolean> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/health`;

  console.log(`🔗 [CONNECTION AUDIT] Testing backend connection to: ${url}`);

  try {
    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [CONNECTION AUDIT] Backend connected successfully:`, data);
      return true;
    } else {
      console.warn(
        `⚠️ [CONNECTION AUDIT] Backend responded with status: ${response.status}`
      );
      return false;
    }
  } catch (error: any) {
    console.error(
      `❌ [CONNECTION AUDIT] Failed to connect to backend at ${url}:`,
      error?.message || error
    );
    return false;
  }
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

  console.log(
    `📡 [CONNECTION AUDIT] Detection request → ${url.toString()} (species=${targetSpecies}, part=${expectedPart})`
  );

  const form = new FormData();
  form.append("image", {
    uri: imageUri,
    name: "capture.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const startTime = Date.now();

  const response = await fetch(url.toString(), {
    method: "POST",
    body: form,
  });

  const elapsed = Date.now() - startTime;

  if (!response.ok) {
    const detail = await response.text();
    console.error(
      `❌ [CONNECTION AUDIT] Detection failed (${response.status}) in ${elapsed}ms: ${detail}`
    );
    throw new Error(detail || "Detection failed");
  }

  const result = (await response.json()) as DetectionResponse;

  console.log(
    `✅ [CONNECTION AUDIT] Detection success in ${elapsed}ms — species=${result.detected_species} part=${result.detected_part} freshness=${result.freshness} confidence=${result.confidence} ready=${result.ready_for_capture}`
  );

  return result;
};