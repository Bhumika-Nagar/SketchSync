"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";

import { drawShape } from "./rendering";
import { buildShape, isShapeHit, shouldCommitShape } from "./utils";
import type { CanvasPoint, CanvasShape, Tool } from "./types";

const TOOLS: Array<{ label: string; value: Tool }> = [
  { label: "Pencil", value: "pencil" },
  { label: "Rectangle", value: "rect" },
  { label: "Circle", value: "circle" },
  { label: "Diamond", value: "diamond" },
  { label: "Line", value: "line" },
  { label: "Arrow", value: "arrow" },
  { label: "Eraser", value: "eraser" },
  { label: "Text", value: "text" },
];

export default function Canvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasParentRef = useRef<HTMLDivElement | null>(null);
  const p5InstanceRef = useRef<import("p5").default | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [tool, setTool] = useState<Tool>("pencil");
  const [shapes, setShapes] = useState<CanvasShape[]>([]);

  const toolRef = useRef(tool);
  const shapesRef = useRef(shapes);
  const previewShapeRef = useRef<CanvasShape | null>(null);
  const draftPointsRef = useRef<CanvasPoint[]>([]);
  const startPointRef = useRef<CanvasPoint | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

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

        const eraseAtPoint = (point: CanvasPoint) => {
          setShapes((currentShapes) =>
            currentShapes.filter((shape) => !isShapeHit(shape, point)),
          );
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

          if (previewShapeRef.current) {
            p.push();
            p.stroke(96, 165, 250);
            p.fill(96, 165, 250, 20);
            drawShape(p, previewShapeRef.current);
            p.pop();
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

          const point = { x: p.mouseX, y: p.mouseY };

          if (toolRef.current === "eraser") {
            eraseAtPoint(point);
            isDraggingRef.current = true;
            return;
          }

          startPointRef.current = point;
          isDraggingRef.current = true;

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
          if (!isDraggingRef.current) {
            return;
          }

          const point = {
            x: Math.max(0, Math.min(p.mouseX, p.width)),
            y: Math.max(0, Math.min(p.mouseY, p.height)),
          };

          if (toolRef.current === "eraser") {
            eraseAtPoint(point);
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
              type: "text",
              x1: startPoint.x,
              y1: startPoint.y,
              text: "Text",
            };
            return;
          }

          const activeTool = toolRef.current;
          previewShapeRef.current = buildShape(activeTool, startPoint, point);
        };

        p.mouseReleased = () => {
          if (!isDraggingRef.current) {
            return;
          }

          isDraggingRef.current = false;

          if (toolRef.current === "eraser") {
            return;
          }

          const startPoint = startPointRef.current;
          const endPoint = {
            x: Math.max(0, Math.min(p.mouseX, p.width)),
            y: Math.max(0, Math.min(p.mouseY, p.height)),
          };

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
            const activeTool = toolRef.current;
            nextShape = buildShape(activeTool, startPoint, endPoint);
          }

          if (nextShape && shouldCommitShape(nextShape)) {
            setShapes((currentShapes) => [...currentShapes, nextShape!]);
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
      p5InstanceRef.current?.remove();
      p5InstanceRef.current = null;
    };
  }, []);

  return (
    <section className="flex min-h-680px flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.95)]">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((item) => (
            <Button
              key={item.value}
              fullWidth={false}
              variant={tool === item.value ? "primary" : "secondary"}
              className="px-4 py-2 text-xs uppercase tracking-[0.22em]"
              onClick={() => setTool(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div ref={hostRef} className="flex-1 p-4">
        <div
          ref={canvasParentRef}
          className="h-full min-h-420px overflow-hidden rounded-[20px] border border-white/10 bg-slate-900"
        />
      </div>
    </section>
  );
}
