"use client";

import { useEffect, useRef, useState } from "react";
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

import type { CanvasPoint, CanvasShape, Tool, ShapeType, ResizeHandle} from "./types";

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
  roomId: string;
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

const SOCKET_UPDATE_THROTTLE_MS = 50;

export default function Canvas({
  roomId,
  socket,
  subscribeToRoomEvents,
}: CanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasParentRef = useRef<HTMLDivElement | null>(null);
  const p5InstanceRef = useRef<import("p5").default | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [tool, setTool] = useState<Tool>("pencil");
  const [shapes, setShapes] = useState<CanvasShape[]>([]);

  const toolRef = useRef(tool);
  const socketRef = useRef(socket);
  const shapesRef = useRef(shapes);
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

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    return subscribeToRoomEvents((event: RoomSocketEvent) => {
      if (event.type === "draw") {
        setShapes((currentShapes) => {
          if (currentShapes.some((shape) => shape.id === event.shape.id)) {
            return currentShapes;
          }

          return [...currentShapes, event.shape];
        });
        return;
      }

      if (event.type === "update") {
        setShapes((currentShapes) => {
          let didUpdate = false;

          const nextShapes = currentShapes.map((shape) => {
            if (shape.id !== event.shapeId) {
              return shape;
            }

            didUpdate = true;
            return mergeShapeUpdates(shape, event.updates);
          });

          return didUpdate ? nextShapes : currentShapes;
        });
        return;
      }

      if (event.type === "delete") {
        if (selectedShapeIdRef.current === event.shapeId) {
          selectedShapeIdRef.current = null;
        }

        setShapes((currentShapes) =>
          currentShapes.filter((shape) => shape.id !== event.shapeId),
        );
      }
    });
  }, [subscribeToRoomEvents]);

  useEffect(() => {
    return () => {
      if (scheduledUpdateTimeoutRef.current !== null) {
        window.clearTimeout(scheduledUpdateTimeoutRef.current);
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

      if (!selectedShapeId) {
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
      selectedShapeIdRef.current = null;
      setShapes((currentShapes) =>
        currentShapes.filter((shape) => shape.id !== selectedShapeId),
      );
      socketRef.current?.send(
        JSON.stringify({
          type: "delete",
          roomId,
          shapeId: selectedShapeId,
        }),
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [roomId]);

  useEffect(() => {
    if (!canvasParentRef.current || !hostRef.current) {
      return;
    }

    let mounted = true;

    const setupSketch = async () => {
      const p5Module = await import("p5");
      const P5 = p5Module.default;

      if (!mounted || !canvasParentRef.current || !hostRef.current) {
        return;
      }

      const sketch = (p: import("p5").default) => {
        const getCanvasSize = () => ({
          width: Math.max(hostRef.current?.clientWidth ?? 0, 320),
          height: Math.max((hostRef.current?.clientHeight ?? 0) - 72, 420),
        });

        const clampPoint = (): CanvasPoint => ({
          x: Math.max(0, Math.min(p.mouseX, p.width)),
          y: Math.max(0, Math.min(p.mouseY, p.height)),
        });

        const findTopShapeAtPoint = (point: CanvasPoint) =>
          [...shapesRef.current].reverse().find((shape) => isShapeHit(shape, point)) ?? null;

        const eraseAtPoint = (point: CanvasPoint) => {
          setShapes((currentShapes) =>
            currentShapes.filter((shape) => !isShapeHit(shape, point)),
          );
        };

        const emitDraw = (shape: CanvasShape) => {
          socketRef.current?.send(
            JSON.stringify({
              type: "draw",
              roomId,
              shape,
            }),
          );
        };

        const emitUpdate = (shapeId: string, updates: Partial<CanvasShape>) => {
          socketRef.current?.send(
            JSON.stringify({
              type: "update",
              roomId,
              shapeId,
              updates,
            }),
          );
        };

        const flushPendingUpdate = () => {
          if (!pendingUpdateRef.current) {
            return;
          }

          const { shapeId, updates } = pendingUpdateRef.current;
          pendingUpdateRef.current = null;
          lastSocketUpdateAtRef.current = Date.now();
          emitUpdate(shapeId, updates);
        };

        const scheduleSocketUpdate = (
          shapeId: string,
          updates: Partial<CanvasShape>,
        ) => {
          pendingUpdateRef.current = { shapeId, updates };

          const now = Date.now();
          const remaining = SOCKET_UPDATE_THROTTLE_MS - (now - lastSocketUpdateAtRef.current);

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
        };

        const getCursorStyle = () => {
          if (toolRef.current === "text") {
            return "text";
          }

          if (toolRef.current !== "select") {
            return toolRef.current === "eraser" ? "crosshair" : "crosshair";
          }

          const point = clampPoint();
          const selectedShape = selectedShapeIdRef.current
            ? shapesRef.current.find((shape) => shape.id === selectedShapeIdRef.current) ?? null
            : null;
          const resizeHandle = selectedShape
            ? getResizeHandleAtPoint(selectedShape, point)
            : null;

          if (resizeHandle) {
            return getResizeCursor(resizeHandle);
          }

          return "pointer";
        };

        p.setup = () => {
          const { width, height } = getCanvasSize();
          const canvas = p.createCanvas(width, height);
          canvas.parent(canvasParentRef.current!);
        };

        p.draw = () => {
          p.background(15, 23, 42);
          p.stroke(30, 41, 59);
          p.strokeWeight(1);

          for (let x = 0; x < p.width; x += 32) {
            p.line(x, 0, x, p.height);
          }

          for (let y = 0; y < p.height; y += 32) {
            p.line(0, y, p.width, y);
          }

          shapesRef.current.forEach((shape) => drawShape(p, shape));
          p.cursor(getCursorStyle());

          if (previewShapeRef.current) {
            p.push();
            p.stroke(96, 165, 250);
            p.fill(96, 165, 250, 20);
            drawShape(p, previewShapeRef.current);
            p.pop();
          }

          if (selectedShapeIdRef.current) {
            const selectedShape = shapesRef.current.find(
              (shape) => shape.id === selectedShapeIdRef.current,
            );

            if (selectedShape) {
              drawSelection(p, selectedShape);
            }
          }
        };

        p.mousePressed = () => {
          if (
            p.mouseX < 0 ||
            p.mouseX > p.width ||
            p.mouseY < 0 ||
            p.mouseY > p.height
          ) {
            return;
          }

          const point = clampPoint();

          if (toolRef.current === "eraser") {
            eraseAtPoint(point);
            interactionModeRef.current = "drawing";
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
              return;
            }

            selectedShapeIdRef.current = null;
            return;
          }

          selectedShapeIdRef.current = null;
          startPointRef.current = point;
          interactionModeRef.current = "drawing";

          if (toolRef.current === "pencil") {
            draftPointsRef.current = [point];
            previewShapeRef.current = buildShape(
              "pencil",
              point,
              point,
              draftPointsRef.current,
            );
          }
        };

        p.mouseDragged = () => {
          const mode = interactionModeRef.current;

          if (!mode) {
            return;
          }

          const point = clampPoint();

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

            setShapes((currentShapes) =>
              currentShapes.map((shape) =>
                shape.id === dragSession.shapeId ? mergeShapeUpdates(shape, updates) : shape,
              ),
            );
            scheduleSocketUpdate(dragSession.shapeId, updates);
            return;
          }

          if (mode === "resizing" && selectedShapeIdRef.current) {
            const activeShape = shapesRef.current.find(
              (shape) => shape.id === selectedShapeIdRef.current,
            );
            const resizeSession = resizeSessionRef.current;

            if (
              !activeShape ||
              !resizeSession ||
              resizeSession.shapeId !== selectedShapeIdRef.current
            ) {
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

            setShapes((currentShapes) =>
              currentShapes.map((shape) =>
                shape.id === activeShape.id ? mergeShapeUpdates(shape, updates) : shape,
              ),
            );
            scheduleSocketUpdate(activeShape.id, updates);
            return;
          }

          const startPoint = startPointRef.current;
          if (!startPoint) {
            return;
          }

          if (toolRef.current === "pencil") {
            draftPointsRef.current = [...draftPointsRef.current, point];
            previewShapeRef.current = buildShape(
              "pencil",
              startPoint,
              point,
              draftPointsRef.current,
            );
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
            return;
          }
          const tool = toolRef.current;
          if (!isDrawableTool(tool)) {
          return;
        }

previewShapeRef.current = buildShape(tool, startPoint, point);
        };

        p.mouseReleased = () => {
          const mode = interactionModeRef.current;

          if (!mode) {
            return;
          }

          interactionModeRef.current = null;

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
            return;
          }

          const startPoint = startPointRef.current;
          const endPoint = clampPoint();

          if (!startPoint) {
            previewShapeRef.current = null;
            draftPointsRef.current = [];
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
            nextShape = buildShape(
              "pencil",
              startPoint,
              endPoint,
              draftPointsRef.current,
            );
          } else {
          const tool = toolRef.current;

            if (!isDrawableTool(tool)) {
            return;
          }

  nextShape = buildShape(tool, startPoint, endPoint);
}

          if (nextShape && shouldCommitShape(nextShape)) {
            selectedShapeIdRef.current = nextShape.id;
            setShapes((currentShapes) => [...currentShapes, nextShape!]);
            emitDraw(nextShape);
          }

          startPointRef.current = null;
          previewShapeRef.current = null;
          draftPointsRef.current = [];
        };
      };

      p5InstanceRef.current = new P5(sketch);

      resizeObserverRef.current = new ResizeObserver(() => {
        if (!p5InstanceRef.current || !hostRef.current) {
          return;
        }

        const width = Math.max(hostRef.current.clientWidth, 320);
        const height = Math.max(hostRef.current.clientHeight - 72, 420);
        p5InstanceRef.current.resizeCanvas(width, height);
      });

      resizeObserverRef.current.observe(hostRef.current);
    };

    setupSketch();

    return () => {
      mounted = false;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (scheduledUpdateTimeoutRef.current !== null) {
        window.clearTimeout(scheduledUpdateTimeoutRef.current);
        scheduledUpdateTimeoutRef.current = null;
      }
      p5InstanceRef.current?.remove();
      p5InstanceRef.current = null;
    };
  }, [roomId]);

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
              onClick={() => setTool(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div ref={hostRef} className="flex-1 p-4 pt-24">
        <div
          ref={canvasParentRef}
          className="h-full min-h-420px overflow-hidden rounded-[20px] border border-white/10 bg-slate-900"
        />
      </div>
    </section>
  );
}
