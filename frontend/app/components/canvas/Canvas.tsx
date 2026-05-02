"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { RoomEventSubscriber, RoomSocketEvent } from "../../hooks/useSocket";
import Button from "../ui/Button";
import { drawSelection, drawShape } from "./rendering";
import {
  buildShape,
  createShapeId,
  getResizeCursor,
  getResizeHandleAtPoint,
  getShapePosition,
  isShapeHit,
  mergeShapeUpdates,
  resizeShapeFromHandle,
  shouldCommitShape,
  translateShape,
} from "./utils";
import type { CanvasPoint, CanvasShape, ResizeHandle, ShapeType, Tool } from "./types";

function isDrawableTool(tool: Tool): tool is ShapeType {
  return tool !== "select" && tool !== "eraser";
}

const TOOLS: Array<{ label: string; value: Tool }> = [
  { label: "Select", value: "select" },
  { label: "Pencil", value: "pencil" },
  { label: "Rectangle", value: "rect" },
  { label: "Circle", value: "circle" },
  { label: "Diamond", value: "diamond" },
  { label: "Line", value: "line" },
  { label: "Arrow", value: "arrow" },
  { label: "Eraser", value: "eraser" },
  { label: "Text", value: "text" },
];

type CanvasProps = {
  roomId: string | null;
  socket?: WebSocket;
  subscribeToRoomEvents: RoomEventSubscriber;
};

type InteractionMode = "drawing" | "dragging" | "resizing" | null;
type PendingUpdate = {
  shapeId: string;
  updates: Partial<CanvasShape>;
};
type DragSession = {
  shapeId: string;
  origin: CanvasShape;
  offset: CanvasPoint;
};
type ResizeSession = {
  shapeId: string;
  origin: CanvasShape;
  handle: ResizeHandle;
};
type SocketEnvelope =
  | {
      type: "draw";
      roomId: string;
      shape: CanvasShape;
    }
  | {
      type: "update";
      roomId: string;
      shapeId: string;
      updates: Partial<CanvasShape>;
    }
  | {
      type: "delete";
      roomId: string;
      shapeId: string;
    };

const SOCKET_UPDATE_THROTTLE_MS = 50;
const SOCKET_BATCH_FLUSH_MS = 32;

function CanvasComponent({ roomId, socket, subscribeToRoomEvents }: CanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pointerFrameRef = useRef<number | null>(null);

  const [tool, setTool] = useState<Tool>("pencil");

  const toolRef = useRef(tool);
  const socketRef = useRef(socket);
  const roomIdRef = useRef(roomId);
  const shapesRef = useRef<CanvasShape[]>([]);
  const previewShapeRef = useRef<CanvasShape | null>(null);
  const draftPointsRef = useRef<CanvasPoint[]>([]);
  const startPointRef = useRef<CanvasPoint | null>(null);
  const interactionModeRef = useRef<InteractionMode>(null);
  const selectedShapeIdRef = useRef<string | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const pendingUpdateRef = useRef<PendingUpdate | null>(null);
  const scheduledUpdateTimeoutRef = useRef<number | null>(null);
  const lastSocketUpdateAtRef = useRef(0);
  const latestPointerRef = useRef<CanvasPoint | null>(null);
  const dirtyRef = useRef(true);
  const socketQueueRef = useRef<SocketEnvelope[]>([]);
  const socketFlushTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    shapesRef.current = [];
    previewShapeRef.current = null;
    draftPointsRef.current = [];
    startPointRef.current = null;
    selectedShapeIdRef.current = null;
    interactionModeRef.current = null;
    dragSessionRef.current = null;
    resizeSessionRef.current = null;
    pendingUpdateRef.current = null;
    markDirty();
  }, [markDirty, roomId]);

  const queueSocketEvent = useCallback((payload: SocketEnvelope) => {
    socketQueueRef.current.push(payload);

    if (socketFlushTimeoutRef.current !== null) {
      return;
    }

    socketFlushTimeoutRef.current = window.setTimeout(() => {
      socketFlushTimeoutRef.current = null;

      const pending = socketQueueRef.current.splice(0, socketQueueRef.current.length);
      if (pending.length === 0 || !socketRef.current) {
        return;
      }

      if (pending.length === 1) {
        socketRef.current.send(JSON.stringify(pending[0]));
        return;
      }

      socketRef.current.send(
        JSON.stringify({
          type: "batch",
          events: pending,
        }),
      );
    }, SOCKET_BATCH_FLUSH_MS);
  }, []);

  const replaceShape = useCallback((shapeId: string, updates: Partial<CanvasShape>) => {
    const shapeIndex = shapesRef.current.findIndex((shape) => shape.id === shapeId);
    if (shapeIndex === -1) {
      return;
    }

    shapesRef.current[shapeIndex] = mergeShapeUpdates(
      shapesRef.current[shapeIndex],
      updates,
    );
    markDirty();
  }, [markDirty]);

  const removeShape = useCallback((shapeId: string) => {
    const nextShapes = shapesRef.current.filter((shape) => shape.id !== shapeId);
    if (nextShapes.length === shapesRef.current.length) {
      return false;
    }

    shapesRef.current = nextShapes;
    if (selectedShapeIdRef.current === shapeId) {
      selectedShapeIdRef.current = null;
    }
    markDirty();
    return true;
  }, [markDirty]);

  useEffect(() => {
    return subscribeToRoomEvents((event: RoomSocketEvent) => {
      if (event.type === "draw") {
        if (shapesRef.current.some((shape) => shape.id === event.shape.id)) {
          return;
        }

        shapesRef.current = [...shapesRef.current, event.shape];
        markDirty();
        return;
      }

      if (event.type === "update") {
        replaceShape(event.shapeId, event.updates);
        return;
      }

      if (event.type === "delete") {
        removeShape(event.shapeId);
      }
    });
  }, [markDirty, removeShape, replaceShape, subscribeToRoomEvents]);

  useEffect(() => {
    return () => {
      if (scheduledUpdateTimeoutRef.current !== null) {
        window.clearTimeout(scheduledUpdateTimeoutRef.current);
      }

      if (socketFlushTimeoutRef.current !== null) {
        window.clearTimeout(socketFlushTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const selectedShapeId = selectedShapeIdRef.current;
      const activeRoomId = roomIdRef.current;

      if (!selectedShapeId || !activeRoomId) {
        return;
      }

      if (scheduledUpdateTimeoutRef.current !== null) {
        window.clearTimeout(scheduledUpdateTimeoutRef.current);
        scheduledUpdateTimeoutRef.current = null;
      }

      pendingUpdateRef.current = null;
      dragSessionRef.current = null;
      resizeSessionRef.current = null;
      interactionModeRef.current = null;

      if (removeShape(selectedShapeId)) {
        queueSocketEvent({
          type: "delete",
          roomId: activeRoomId,
          shapeId: selectedShapeId,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [queueSocketEvent, removeShape]);

  const flushPendingUpdate = useCallback(() => {
    const activeRoomId = roomIdRef.current;
    if (!pendingUpdateRef.current || !activeRoomId) {
      return;
    }

    const { shapeId, updates } = pendingUpdateRef.current;
    pendingUpdateRef.current = null;
    lastSocketUpdateAtRef.current = Date.now();
    queueSocketEvent({
      type: "update",
      roomId: activeRoomId,
      shapeId,
      updates,
    });
  }, [queueSocketEvent]);

  const scheduleSocketUpdate = useCallback(
    (shapeId: string, updates: Partial<CanvasShape>) => {
      pendingUpdateRef.current = { shapeId, updates };

      const now = Date.now();
      const remaining =
        SOCKET_UPDATE_THROTTLE_MS - (now - lastSocketUpdateAtRef.current);

      if (remaining <= 0) {
        if (scheduledUpdateTimeoutRef.current !== null) {
          window.clearTimeout(scheduledUpdateTimeoutRef.current);
          scheduledUpdateTimeoutRef.current = null;
        }

        flushPendingUpdate();
        return;
      }

      if (scheduledUpdateTimeoutRef.current !== null) {
        return;
      }

      scheduledUpdateTimeoutRef.current = window.setTimeout(() => {
        scheduledUpdateTimeoutRef.current = null;
        flushPendingUpdate();
      }, remaining);
    },
    [flushPendingUpdate],
  );

  const drawGrid = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => {
    context.strokeStyle = "rgb(30, 41, 59)";
    context.lineWidth = 1;
    context.beginPath();

    for (let x = 0; x < width; x += 32) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    for (let y = 0; y < height; y += 32) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }

    context.stroke();
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    context.save();
    context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgb(15, 23, 42)";
    context.fillRect(0, 0, width, height);
    drawGrid(context, width, height);

    for (const shape of shapesRef.current) {
      drawShape(context, shape);
    }

    if (previewShapeRef.current) {
      context.save();
      context.globalAlpha = 0.85;
      drawShape(context, previewShapeRef.current);
      context.restore();
    }

    if (selectedShapeIdRef.current) {
      const selectedShape = shapesRef.current.find(
        (shape) => shape.id === selectedShapeIdRef.current,
      );

      if (selectedShape) {
        drawSelection(context, selectedShape);
      }
    }

    context.restore();
  }, [drawGrid]);

  useEffect(() => {
    const animate = () => {
      if (dirtyRef.current) {
        drawCanvas();
        dirtyRef.current = false;
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawCanvas]);

  const getCanvasPoint = useCallback((event: PointerEvent): CanvasPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      return null;
    }

    return { x, y };
  }, []);

  const findTopShapeAtPoint = useCallback((point: CanvasPoint) => {
    return [...shapesRef.current].reverse().find((shape) => isShapeHit(shape, point)) ?? null;
  }, []);

  const updateCursor = useCallback((point: CanvasPoint | null) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!point) {
      canvas.style.cursor = "default";
      return;
    }

    if (toolRef.current === "text") {
      canvas.style.cursor = "text";
      return;
    }

    if (toolRef.current !== "select") {
      canvas.style.cursor = "crosshair";
      return;
    }

    const selectedShape = selectedShapeIdRef.current
      ? shapesRef.current.find((shape) => shape.id === selectedShapeIdRef.current) ?? null
      : null;
    const resizeHandle = selectedShape
      ? getResizeHandleAtPoint(selectedShape, point)
      : null;

    if (resizeHandle) {
      canvas.style.cursor = getResizeCursor(resizeHandle);
      return;
    }

    canvas.style.cursor = findTopShapeAtPoint(point) ? "move" : "default";
  }, [findTopShapeAtPoint]);

  const eraseAtPoint = useCallback((point: CanvasPoint) => {
    const activeRoomId = roomIdRef.current;
    const hitShape = findTopShapeAtPoint(point);

    if (!hitShape || !activeRoomId) {
      return;
    }

    if (removeShape(hitShape.id)) {
      queueSocketEvent({
        type: "delete",
        roomId: activeRoomId,
        shapeId: hitShape.id,
      });
    }
  }, [findTopShapeAtPoint, queueSocketEvent, removeShape]);

  const processPointerMove = useCallback(() => {
    pointerFrameRef.current = null;
    const point = latestPointerRef.current;
    if (!point) {
      return;
    }

    updateCursor(point);

    const mode = interactionModeRef.current;
    if (!mode) {
      return;
    }

    if (toolRef.current === "eraser" && mode === "drawing") {
      eraseAtPoint(point);
      return;
    }

    if (mode === "dragging" && selectedShapeIdRef.current) {
      const dragSession = dragSessionRef.current;
      if (!dragSession || dragSession.shapeId !== selectedShapeIdRef.current) {
        return;
      }

      const originPosition = getShapePosition(dragSession.origin);
      const nextX = point.x - dragSession.offset.x;
      const nextY = point.y - dragSession.offset.y;
      const deltaX = nextX - originPosition.x;
      const deltaY = nextY - originPosition.y;
      const movedShape = translateShape(dragSession.origin, deltaX, deltaY);
      const updates: Partial<CanvasShape> = {
        x1: movedShape.x1,
        y1: movedShape.y1,
        x2: movedShape.x2,
        y2: movedShape.y2,
        points: movedShape.points,
      };

      replaceShape(dragSession.shapeId, updates);
      scheduleSocketUpdate(dragSession.shapeId, updates);
      return;
    }

    if (mode === "resizing" && selectedShapeIdRef.current) {
      const resizeSession = resizeSessionRef.current;
      if (!resizeSession || resizeSession.shapeId !== selectedShapeIdRef.current) {
        return;
      }

      const resizedShape = resizeShapeFromHandle(
        resizeSession.origin,
        point,
        resizeSession.handle,
      );
      const updates: Partial<CanvasShape> = {
        x1: resizedShape.x1,
        y1: resizedShape.y1,
        x2: resizedShape.x2,
        y2: resizedShape.y2,
      };

      replaceShape(resizeSession.shapeId, updates);
      scheduleSocketUpdate(resizeSession.shapeId, updates);
      return;
    }

    const startPoint = startPointRef.current;
    if (!startPoint) {
      return;
    }

    if (toolRef.current === "pencil") {
      draftPointsRef.current.push(point);
      previewShapeRef.current = buildShape(
        "pencil",
        startPoint,
        point,
        draftPointsRef.current,
      );
      markDirty();
      return;
    }

    if (toolRef.current === "text") {
      previewShapeRef.current = {
        id: "preview-text",
        type: "text",
        x1: startPoint.x,
        y1: startPoint.y,
        text: "Text",
      };
      markDirty();
      return;
    }

    const activeTool = toolRef.current;
    if (!isDrawableTool(activeTool)) {
      return;
    }

    previewShapeRef.current = buildShape(activeTool, startPoint, point);
    markDirty();
  }, [eraseAtPoint, markDirty, replaceShape, scheduleSocketUpdate, updateCursor]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) {
      return;
    }

    const resizeCanvas = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(host.clientWidth, 320);
      const height = Math.max(host.clientHeight, 420);

      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      markDirty();
    };

    resizeCanvas();
    resizeObserverRef.current = new ResizeObserver(resizeCanvas);
    resizeObserverRef.current.observe(host);

    const handlePointerDown = (event: PointerEvent) => {
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }

      latestPointerRef.current = point;

      if (toolRef.current === "eraser") {
        interactionModeRef.current = "drawing";
        eraseAtPoint(point);
        canvas.setPointerCapture(event.pointerId);
        return;
      }

      if (toolRef.current === "select") {
        const selectedShape = selectedShapeIdRef.current
          ? shapesRef.current.find((shape) => shape.id === selectedShapeIdRef.current) ?? null
          : null;
        const resizeHandle = selectedShape
          ? getResizeHandleAtPoint(selectedShape, point)
          : null;

        if (selectedShape && resizeHandle) {
          resizeSessionRef.current = {
            shapeId: selectedShape.id,
            origin: selectedShape,
            handle: resizeHandle,
          };
          interactionModeRef.current = "resizing";
          canvas.setPointerCapture(event.pointerId);
          return;
        }

        const hitShape = findTopShapeAtPoint(point);
        if (hitShape) {
          selectedShapeIdRef.current = hitShape.id;
          interactionModeRef.current = "dragging";
          const shapePosition = getShapePosition(hitShape);
          dragSessionRef.current = {
            shapeId: hitShape.id,
            origin: hitShape,
            offset: {
              x: point.x - shapePosition.x,
              y: point.y - shapePosition.y,
            },
          };
          canvas.setPointerCapture(event.pointerId);
          markDirty();
          return;
        }

        selectedShapeIdRef.current = null;
        markDirty();
        return;
      }

      selectedShapeIdRef.current = null;
      startPointRef.current = point;
      interactionModeRef.current = "drawing";
      if (toolRef.current === "pencil") {
        draftPointsRef.current = [point];
        previewShapeRef.current = buildShape("pencil", point, point, draftPointsRef.current);
      }
      markDirty();
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const point = getCanvasPoint(event);
      latestPointerRef.current = point;
      updateCursor(point);

      if (!point || !interactionModeRef.current) {
        return;
      }

      if (pointerFrameRef.current !== null) {
        return;
      }

      pointerFrameRef.current = window.requestAnimationFrame(processPointerMove);
    };

    const finishInteraction = (event: PointerEvent) => {
      const point = getCanvasPoint(event) ?? latestPointerRef.current;
      const mode = interactionModeRef.current;
      interactionModeRef.current = null;

      if (!mode) {
        return;
      }

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      if (toolRef.current === "eraser") {
        return;
      }

      if (mode === "dragging" || mode === "resizing") {
        flushPendingUpdate();
        dragSessionRef.current = null;
        resizeSessionRef.current = null;
        previewShapeRef.current = null;
        draftPointsRef.current = [];
        startPointRef.current = null;
        markDirty();
        return;
      }

      const startPoint = startPointRef.current;
      if (!startPoint || !point) {
        previewShapeRef.current = null;
        draftPointsRef.current = [];
        startPointRef.current = null;
        markDirty();
        return;
      }

      let nextShape: CanvasShape | null = null;

      if (toolRef.current === "text") {
        const text = window.prompt("Enter text")?.trim();
        nextShape = text
          ? {
              id: createShapeId(),
              type: "text",
              x1: startPoint.x,
              y1: startPoint.y,
              text,
            }
          : null;
      } else if (toolRef.current === "pencil") {
        nextShape = buildShape("pencil", startPoint, point, draftPointsRef.current);
      } else {
        const activeTool = toolRef.current;
        if (!isDrawableTool(activeTool)) {
          return;
        }

        nextShape = buildShape(activeTool, startPoint, point);
      }

      if (nextShape && shouldCommitShape(nextShape)) {
        selectedShapeIdRef.current = nextShape.id;
        shapesRef.current = [...shapesRef.current, nextShape];

        const activeRoomId = roomIdRef.current;
        if (activeRoomId) {
          queueSocketEvent({
            type: "draw",
            roomId: activeRoomId,
            shape: nextShape,
          });
        }
      }

      startPointRef.current = null;
      previewShapeRef.current = null;
      draftPointsRef.current = [];
      markDirty();
    };

    const handlePointerLeave = () => {
      if (!interactionModeRef.current) {
        updateCursor(null);
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", finishInteraction);
    canvas.addEventListener("pointercancel", finishInteraction);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", finishInteraction);
      canvas.removeEventListener("pointercancel", finishInteraction);
      canvas.removeEventListener("pointerleave", handlePointerLeave);

      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    };
  }, [
    eraseAtPoint,
    findTopShapeAtPoint,
    flushPendingUpdate,
    getCanvasPoint,
    markDirty,
    processPointerMove,
    queueSocketEvent,
    updateCursor,
  ]);

  const handleToolChange = useCallback((nextTool: Tool) => {
    setTool(nextTool);
  }, []);

  return (
    <section className="relative flex min-h-680px flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.95)]">
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/12 bg-slate-950/85 px-3 py-3 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.95)] backdrop-blur">
          {TOOLS.map((item) => (
            <Button
              key={item.value}
              fullWidth={false}
              variant={tool === item.value ? "primary" : "secondary"}
              className="min-w-22 px-4 py-2 text-xs uppercase tracking-[0.18em]"
              onClick={() => handleToolChange(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div ref={hostRef} className="flex-1 p-4 pt-24">
        <canvas
          ref={canvasRef}
          className="block h-full min-h-420px w-full rounded-[20px] border border-white/10 bg-slate-900 touch-none"
        />
      </div>
    </section>
  );
}

export default memo(CanvasComponent);
