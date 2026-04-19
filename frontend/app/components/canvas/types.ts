export type ShapeType =
  | "rect"
  | "circle"
  | "diamond"
  | "line"
  | "arrow"
  | "pencil"
  | "text";

export type Tool = ShapeType | "eraser";

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasShape = {
  type: ShapeType;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  text?: string;
  points?: CanvasPoint[];
};
