import { useRef, useCallback, useState } from "react";
import { runOnJS } from "react-native-reanimated";
import { useDetectionWebSocket, ConnectionState } from "../services/websocket";
import { DetectionResponse } from "../types";

/** Maximum buffer size before skipping a frame (1 MB). */
const MAX_BUFFER_SIZE = 1024 * 1024;

export interface UseFrameStreamerOptions {
  /** Target species filter sent as a WS query param. */
  targetSpecies?: string | null;
  /** Expected part filter sent as a WS query param. */
  expectedPart?: "eye" | "skin" | null;
  /** Callback invoked when a detection result arrives from the backend. */
  onResult: (data: DetectionResponse) => void;
}

export interface UseFrameStreamerReturn {
  /** Open the WebSocket connection. Call when scanning starts. */
  connect: () => void;
  /** Close the WebSocket connection. Call when scanning stops. */
  disconnect: () => void;
  /** Current WebSocket connection state. */
  connectionState: ConnectionState;
  /** Whether the WebSocket is open and ready to send frames. */
  isConnected: boolean;
  /**
   * Worklet-compatible function to send a raw camera frame to the backend.
   * Call this from within a frameProcessor worklet via runOnJS().
   *
   * @param buffer - Raw pixel data from frame.toArrayBuffer()
   * @param width  - Frame width in pixels
   * @param height - Frame height in pixels
   */
  sendRawFrame: (buffer: ArrayBuffer, width: number, height: number) => void;
  /**
   * Creates a frameProcessor worklet that automatically streams frames.
   * Use this directly on the <Camera> component.
   */
  createFrameProcessor: () => (frame: any) => void;
  /** Reference to store latest detection result for manual Done button. */
  lastDetectionRef: React.MutableRefObject<DetectionResponse | null>;
  /** Whether at least one detection result has been received. */
  hasDetection: boolean;
}

/**
 * Shared hook that manages WebSocket connection + raw frame streaming
 * for react-native-vision-camera's frameProcessor.
 *
 * Usage:
 * ```tsx
 * const { createFrameProcessor, connect, disconnect, isConnected } = useFrameStreamer({
 *   targetSpecies: "Bigeye_scad",
 *   expectedPart: "eye",
 *   onResult: (data) => setDetectionResponse(data),
 * });
 *
 * <Camera
 *   frameProcessor={createFrameProcessor()}
 *   frameProcessorFps={4}
 * />
 * ```
 */
export function useFrameStreamer({
  targetSpecies,
  expectedPart,
  onResult,
}: UseFrameStreamerOptions): UseFrameStreamerReturn {
  const lastDetectionRef = useRef<DetectionResponse | null>(null);
  const hasSentMetadataRef = useRef(false);
  const [hasDetection, setHasDetection] = useState(false);

  // Store onResult in a ref so it's always current
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const handleResult = useCallback((data: DetectionResponse) => {
    lastDetectionRef.current = data;
    setHasDetection(true);
    onResultRef.current(data);
  }, []);

  const {
    connect: wsConnect,
    disconnect: wsDisconnect,
    sendFrame,
    connectionState,
    isConnected,
  } = useDetectionWebSocket({
    targetSpecies,
    expectedPart,
    onResult: handleResult,
    autoConnect: false,
  });

  // Track connected state in a ref for the worklet callback
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;
  const sendFrameRef = useRef(sendFrame);
  sendFrameRef.current = sendFrame;
  const hasSentMetadataRef2 = hasSentMetadataRef;

  /**
   * Send a raw frame over WebSocket.
   * First call sends a JSON metadata header; subsequent calls send binary frame data.
   */
  const sendRawFrame = useCallback(
    (buffer: ArrayBuffer, width: number, height: number) => {
      if (!isConnectedRef.current) return;
      if (buffer.byteLength > MAX_BUFFER_SIZE) return; // backpressure: skip oversized frames

      // Send metadata header on first frame (or after reconnect)
      if (!hasSentMetadataRef2.current) {
        const metadata = JSON.stringify({
          type: "metadata",
          width,
          height,
          pixelFormat: "rgba", // frame.toArrayBuffer() returns RGBA on both platforms
        });
        const encoder = new TextEncoder();
        const metadataBytes = encoder.encode(metadata);
        // Prefix with 0x00 to indicate metadata
        const header = new Uint8Array(1 + metadataBytes.byteLength);
        header[0] = 0x00; // metadata flag
        header.set(new Uint8Array(metadataBytes), 1);
        sendFrameRef.current(header.buffer);
        hasSentMetadataRef2.current = true;
      }

      // Prefix with 0x01 to indicate frame data
      const framePayload = new Uint8Array(1 + buffer.byteLength);
      framePayload[0] = 0x01; // frame data flag
      framePayload.set(new Uint8Array(buffer), 1);
      sendFrameRef.current(framePayload.buffer);
    },
    [],
  );

  const connect = useCallback(() => {
    hasSentMetadataRef.current = false;
    wsConnect();
  }, [wsConnect]);

  const disconnect = useCallback(() => {
    hasSentMetadataRef.current = false;
    wsDisconnect();
  }, [wsDisconnect]);

  /**
   * Creates a frameProcessor worklet that streams frames to the backend.
   * Must be called once per render and memoized.
   */
  const createFrameProcessor = useCallback(() => {
    // The worklet must be created fresh each time to capture current closures
    const processor = (frame: any) => {
      "worklet";
      const buffer = frame.toArrayBuffer();
      runOnJS(sendRawFrame)(buffer, frame.width, frame.height);
    };
    return processor;
  }, [sendRawFrame]);

  return {
    connect,
    disconnect,
    connectionState,
    isConnected,
    sendRawFrame,
    createFrameProcessor,
    lastDetectionRef,
    hasDetection,
  };
}