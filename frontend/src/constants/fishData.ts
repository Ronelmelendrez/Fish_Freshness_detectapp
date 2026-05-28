/**
 * Mock data for fish species
 * This contains sample fish data for the UI demonstration
 */

export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  image: string;
}

export interface ScanResult {
  id: string;
  batchId: string;
  freshness: "Fresh" | "Moderate" | "Spoiled";
  confidence: number;
  advice: string;
  emoji: string;
}

export const fishSpecies: FishSpecies[] = [
  {
    id: "1",
    name: "Milkfish",
    scientificName: "Chanos chanos",
    description: "Versatile white fish with a mild flavor, commonly farmed",
    image: "https://placehold.co/120x120/0d9488/ffffff?text=Milkfish",
  },
  {
    id: "2",
    name: "Barramundi",
    scientificName: "Lates calcarifer",
    description: "Premium Australian fish with a buttery, delicate texture",
    image: "https://placehold.co/120x120/0d9488/ffffff?text=Barramundi",
  },
  {
    id: "3",
    name: "Tilapia",
    scientificName: "Oreochromis niloticus",
    description: "Firm-textured fish with a slight sweetness, highly adaptable",
    image: "https://placehold.co/120x120/0d9488/ffffff?text=Tilapia",
  },
  {
    id: "4",
    name: "Mackerel",
    scientificName: "Scomber scombrus",
    description: "Oily fish rich in omega-3, with a distinctive strong flavor",
    image: "https://placehold.co/120x120/0d9488/ffffff?text=Mackerel",
  },
  {
    id: "5",
    name: "Grouper",
    scientificName: "Epinephelus coioides",
    description: "Premium white fish prized in Asian cuisine, flaky texture",
    image: "https://placehold.co/120x120/0d9488/ffffff?text=Grouper",
  },
];

/**
 * Mock scan results - in a real app, this would come from the backend
 * Different results based on fish ID for demonstration
 */
export const getMockScanResult = (fishId: string): ScanResult => {
  const resultMap: Record<string, ScanResult> = {
    "1": {
      id: fishId,
      batchId: "BATCH#12345",
      freshness: "Fresh",
      confidence: 92,
      advice:
        "Store at -18°C for up to 3 months. Consume within 2 days if thawed.",
      emoji: "✨",
    },
    "2": {
      id: fishId,
      batchId: "BATCH#67890",
      freshness: "Fresh",
      confidence: 88,
      advice:
        "Keep on ice at 0-4°C. Best consumed within 24 hours of purchase.",
      emoji: "✨",
    },
    "3": {
      id: fishId,
      batchId: "BATCH#11223",
      freshness: "Moderate",
      confidence: 75,
      advice: "Use within 24 hours. Cook thoroughly. Good for grilling.",
      emoji: "⚠️",
    },
    "4": {
      id: fishId,
      batchId: "BATCH#44556",
      freshness: "Moderate",
      confidence: 78,
      advice: "Prepare soon. Store at 0-4°C. Excellent smoked or grilled.",
      emoji: "⚠️",
    },
    "5": {
      id: fishId,
      batchId: "BATCH#99887",
      freshness: "Fresh",
      confidence: 95,
      advice: "Premium quality. Store at -18°C. Ideal for steaming or frying.",
      emoji: "✨",
    },
  };

  return (
    resultMap[fishId] || {
      id: fishId,
      batchId: "BATCH#00000",
      freshness: "Moderate",
      confidence: 80,
      advice: "Store properly and use within 2 days.",
      emoji: "⚠️",
    }
  );
};
