export type ShapeType =
  | "rect"
  | "circle"
  | "diamond"
  | "line"
  | "arrow"
  | "pencil"
  | "text";

export type Tool = "select" | ShapeType | "eraser";

export type ResizeHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasShape = {
  id: string;
  type: ShapeType;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  text?: string;
  points?: CanvasPoint[];
};
