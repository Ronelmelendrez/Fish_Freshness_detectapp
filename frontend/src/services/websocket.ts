import { useRef, useEffect, useCallback, useState } from "react";
import { getApiBaseUrl } from "./api";
import { DetectionResponse } from "../types";

/** Minimum interval (ms) between frame sends to prevent overload. */
const THROTTLE_MS = 150;

/** Minimum interval (ms) between reconnection attempts. */
const RECONNECT_BASE_MS = 1000;

/** Maximum reconnection delay (ms). */
const RECONNECT_MAX_MS = 10000;

/** Send every Nth frame (set to 1 to send all frames). */
const FRAME_SKIP = 1;

export type ConnectionState = "connecting" | "connected" | "disconnected";

export interface UseDetectionWebSocketOptions {
  /** Target species filter sent as a query param. */
  targetSpecies?: string | null;
  /** Expected part filter sent as a query param. */
  expectedPart?: "eye" | "skin" | null;
  /** Callback invoked when a detection result arrives. */
  onResult: (data: DetectionResponse) => void;
  /** Callback invoked on connection state changes. */
  onStateChange?: (state: ConnectionState) => void;
  /** Whether to automatically connect on mount. Defaults to true. */
  autoConnect?: boolean;
}

export interface UseDetectionWebSocketReturn {
  /** Open the WebSocket connection. */
  connect: () => void;
  /** Close the WebSocket connection. */
  disconnect: () => void;
  /** Send a camera frame (image bytes as Blob or ArrayBuffer). Throttled. */
  sendFrame: (frame: Blob | ArrayBuffer) => void;
  /** Current connection state. */
  connectionState: ConnectionState;
  /** Whether the WebSocket is open and ready to send. */
  isConnected: boolean;
}

/**
 * Custom hook that manages a WebSocket connection to the /ws/detect endpoint.
 *
 * Usage:
 * ```ts
 * const { sendFrame, isConnected, connect, disconnect } = useDetectionWebSocket({
 *   targetSpecies: "Roughear_scad",
 *   expectedPart: "eye",
 *   onResult: (data) => setDetectionResponse(data),
 * });
 * ```
 */
export function useDetectionWebSocket({
  targetSpecies,
  expectedPart,
  onResult,
  onStateChange,
  autoConnect = true,
}: UseDetectionWebSocketOptions): UseDetectionWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const lastSentRef = useRef(0);
  const frameCountRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(true);

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  // Stable callback ref so users don't need to memoize onResult
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const updateState = useCallback(
    (state: ConnectionState) => {
      setConnectionState(state);
      onStateChangeRef.current?.(state);
    },
    [],
  );

  const buildWsUrl = useCallback(() => {
    const baseUrl = getApiBaseUrl();
    // Convert http(s):// to ws(s)://
    let wsUrl = baseUrl.replace(/^http/, "ws");
    const params = new URLSearchParams();
    if (targetSpecies) params.set("target_species", targetSpecies);
    if (expectedPart) params.set("expected_part", expectedPart);
    const qs = params.toString();
    return `${wsUrl}/ws/detect${qs ? `?${qs}` : ""}`;
  }, [targetSpecies, expectedPart]);

  const connect = useCallback(() => {
    // Avoid duplicate connections
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    shouldReconnectRef.current = true;
    updateState("connecting");

    const url = buildWsUrl();
    console.log(`🔌 [WS] Connecting to ${url}`);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ [WS] Connected");
      reconnectAttemptRef.current = 0;
      updateState("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DetectionResponse & {
          error?: string;
          detail?: string;
        };

        if (data.error) {
          console.warn(`⚠️ [WS] Server error: ${data.error} — ${data.detail}`);
          return;
        }

        onResultRef.current(data);
      } catch (err) {
        console.error("❌ [WS] Failed to parse message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ [WS] Error:", err);
    };

    ws.onclose = (event) => {
      console.log(`🔌 [WS] Disconnected (code=${event.code})`);
      wsRef.current = null;

      if (mountedRef.current && shouldReconnectRef.current) {
        updateState("disconnected");
        scheduleReconnect();
      } else {
        updateState("disconnected");
      }
    };
  }, [buildWsUrl, updateState]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(1.5, attempt),
      RECONNECT_MAX_MS,
    );
    reconnectAttemptRef.current = attempt + 1;

    console.log(
      `🔄 [WS] Reconnecting in ${Math.round(delay)}ms (attempt ${attempt + 1})`,
    );

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current && shouldReconnectRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateState("disconnected");
  }, [updateState]);

  const sendFrame = useCallback((frame: Blob | ArrayBuffer) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Frame skipping
    frameCountRef.current++;
    if (frameCountRef.current % FRAME_SKIP !== 0) return;

    // Throttling
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;

    ws.send(frame);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connect,
    disconnect,
    sendFrame,
    connectionState,
    isConnected: connectionState === "connected",
  };
}