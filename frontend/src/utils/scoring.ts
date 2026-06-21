export type FreshnessStatus = "Fresh" | "Acceptable" | "Not Fresh";

export interface ScoringResult {
  eyeScore: number;
  skinScore: number;
  finalScore: number;
  status: FreshnessStatus;
}

/**
 * Calculate the final freshness score based on eye and skin results.
 * Eye = 70%, Skin = 30%
 * Fresh = 100, Spoiled = 0
 */
export const calculateFreshnessScore = (
  eyeFreshness: string | null,
  skinFreshness: string | null,
): ScoringResult => {
  const eyeScore = eyeFreshness?.toLowerCase() === "fresh" ? 100 : 0;
  const skinScore = skinFreshness?.toLowerCase() === "fresh" ? 100 : 0;

  const finalScore = Math.round(eyeScore * 0.7 + skinScore * 0.3);

  let status: FreshnessStatus;
  if (finalScore >= 80) {
    status = "Fresh";
  } else if (finalScore >= 60) {
    status = "Acceptable";
  } else {
    status = "Not Fresh";
  }

  return {
    eyeScore,
    skinScore,
    finalScore,
    status,
  };
};

/**
 * Get guidance message based on detection response
 */
export const getGuidanceMessage = (reason: string | null): string => {
  if (!reason) return "Perfect! Hold steady...";

  const reasonLower = reason.toLowerCase();

  if (reasonLower.includes("too far away")) {
    return "Move closer to the fish";
  }
  if (reasonLower.includes("too close")) {
    return "Move back from the fish";
  }
  if (reasonLower.includes("not centered")) {
    return "Center the fish in the frame";
  }
  if (reasonLower.includes("blurry")) {
    return "Hold steady, image is blurry";
  }
  if (reasonLower.includes("species mismatch")) {
    return "Wrong species detected";
  }
  if (reasonLower.includes("part mismatch")) {
    return "Adjust to show the correct part";
  }
  if (reasonLower.includes("low confidence")) {
    return "Move closer to the fish";
  }
  if (reasonLower.includes("no fish detected")) {
    return "No fish detected, adjust position";
  }

  return "Position the fish in the center";
};

export const getSpeciesDisplayName = (species: string): string => {
  const map: Record<string, string> = {
    "Roughear_scad": "Roughear Scad",
    "Bigeye_scad": "Bigeye Scad",
    "striped_red_mullet": "Striped Red Mullet",
  };
  return map[species] || species;
};
