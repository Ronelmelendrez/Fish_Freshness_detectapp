type TFLiteModel = {
  runSync: (input: unknown) => unknown;
};

let model: TFLiteModel | null = null;

export const loadDetectorModel = async (modelSource: string | number) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TFLiteModel: NativeModel } = require("react-native-fast-tflite");
  model = await NativeModel.create({
    model: modelSource,
    numThreads: 2,
  });
  return model;
};

export const getDetectorModel = () => model;

export const getLargestBoxArea = (rawOutput: unknown): number => {
  if (!rawOutput) return 0;

  // Supports common output shapes:
  // { boxes: number[][], scores: number[] }
  if (typeof rawOutput === "object" && rawOutput !== null) {
    const output = rawOutput as {
      boxes?: number[][];
      scores?: number[];
    };

    if (output.boxes && output.boxes.length > 0) {
      let bestArea = 0;
      output.boxes.forEach((box, index) => {
        const [x1, y1, x2, y2] = box;
        const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        const score = output.scores?.[index] ?? 1;
        if (score > 0.3 && area > bestArea) {
          bestArea = area;
        }
      });
      return bestArea;
    }
  }

  return 0;
};
