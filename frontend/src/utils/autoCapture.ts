export type CaptureStep = "eye" | "skin";

export interface CaptureThresholds {
  minArea: number;
  maxArea: number;
  stableFrames: number;
}

export const DEFAULT_THRESHOLDS: Record<CaptureStep, CaptureThresholds> = {
  eye: { minArea: 12000, maxArea: 20000, stableFrames: 5 },
  skin: { minArea: 18000, maxArea: 28000, stableFrames: 5 },
};

export const isAreaInRange = (
  area: number,
  thresholds: CaptureThresholds,
) => area >= thresholds.minArea && area <= thresholds.maxArea;
