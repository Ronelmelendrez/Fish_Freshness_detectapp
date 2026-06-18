export interface DetectionResponse {
  detected_species: string | null;
  detected_part: string | null;
  freshness: string | null;
  confidence: number | null;
  is_blurry: boolean;
  is_centered: boolean;
  is_good_size: boolean;
  blurriness_score: number;
  size_ratio: number;
  ready_for_capture: boolean;
  reason?: string | null;
}

export interface EyeResult {
  uri: string;
  freshness: string;
  confidence: number;
}

export interface SkinResult {
  uri: string;
  freshness: string;
  confidence: number;
}

export type FishSpecies = "Roughear_scad" | "Bigeye_scad" | "Red_mullet";

export const FISH_SPECIES: { id: FishSpecies; name: string; description: string }[] = [
  {
    id: "Roughear_scad",
    name: "Roughear Scad",
    description: "Common tropical fish with a distinctive rough ear scale",
  },
  {
    id: "Bigeye_scad",
    name: "Bigeye Scad",
    description: "Known for its large eyes and silver body",
  },
  {
    id: "Red_mullet",
    name: "Red Mullet",
    description: "Mediterranean fish with red skin and distinct flavor",
  },
];