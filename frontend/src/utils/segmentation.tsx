import React from "react";
import Svg, { Polygon, Defs, LinearGradient, Stop } from "react-native-svg";

interface SegmentationOverlayProps {
  /** Normalized polygon points as [[x, y], ...] where x,y are 0-1 */
  polygon: number[][];
  /** Width of the overlay area in pixels */
  width: number;
  /** Height of the overlay area in pixels */
  height: number;
  /** Stroke color (default: teal) */
  strokeColor?: string;
  /** Fill opacity (default: 0.2) */
  fillOpacity?: number;
}

/**
 * Renders a semi-transparent polygon overlay on top of the camera feed.
 * Polygon coordinates are normalized (0-1) and scaled to the given width/height.
 */
export const SegmentationOverlay: React.FC<SegmentationOverlayProps> = ({
  polygon,
  width,
  height,
  strokeColor = "#14b8a6",
  fillOpacity = 0.2,
}) => {
  if (!polygon || polygon.length < 3 || width <= 0 || height <= 0) {
    return null;
  }

  // Convert normalized [x, y] points to pixel coordinates string for SVG polygon
  const points = polygon
    .map(([x, y]) => `${x * width},${y * height}`)
    .join(" ");

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <Defs>
        <LinearGradient id="segFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={strokeColor} stopOpacity={fillOpacity} />
          <Stop
            offset="1"
            stopColor={strokeColor}
            stopOpacity={fillOpacity * 0.5}
          />
        </LinearGradient>
      </Defs>
      <Polygon
        points={points}
        fill="url(#segFill)"
        stroke={strokeColor}
        strokeWidth={2}
        strokeOpacity={0.8}
      />
    </Svg>
  );
};

export default SegmentationOverlay;