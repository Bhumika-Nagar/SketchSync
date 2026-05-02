import { useEffect, useState } from "react";
import type { CanvasShape } from "../components/canvas/types";

export type ChatSocketEvent = {
  type: "chat";
  message: string;
};

export type DrawSocketEvent = {
  type: "draw";
  shape: CanvasShape;
};

export type UpdateSocketEvent = {
  type: "update";
  shapeId: string;
  updates: Partial<CanvasShape>;
};

export type DeleteSocketEvent = {
  type: "delete";
  shapeId: string;
};

export type BatchSocketEvent = {
  type: "batch";
  events: RoomSocketEvent[];
};

export type RoomSocketEvent =
  | ChatSocketEvent
  | DrawSocketEvent
  | UpdateSocketEvent
  | DeleteSocketEvent;

export type RoomSocketPayload = RoomSocketEvent | BatchSocketEvent;

export type RoomEventListener = (event: RoomSocketEvent) => void;
export type RoomEventSubscriber = (listener: RoomEventListener) => () => void;

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.WS_URL ??
  "ws://localhost:8080";

export function useSocket() {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket>();

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setLoading(false);
      setSocket(ws);
    };

    ws.onclose = () => {
      setLoading(true);
      setSocket(undefined);
    };

    return () => {
      ws.close();
    };
  }, []);

  return {
    socket,
    loading,
  };
}
