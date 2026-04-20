import type { CanvasPoint, CanvasShape, ResizeHandle, Tool } from "./types";

const MIN_DISTANCE = 8;
const RESIZE_HANDLE_RADIUS = 8;

export type ShapeBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function distanceBetweenPoints(a: CanvasPoint, b: CanvasPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(
  point: CanvasPoint,
  start: CanvasPoint,
  end: CanvasPoint,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const segmentLengthSquared = dx * dx + dy * dy;

  if (segmentLengthSquared === 0) {
    return distanceBetweenPoints(point, start);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        segmentLengthSquared,
    ),
  );

  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return distanceBetweenPoints(point, projection);
}



export function buildShape(
  tool: Exclude<Tool, "eraser" | "select">,
  start: CanvasPoint,
  current: CanvasPoint,
  draftPoints: CanvasPoint[] = [],
) {
  const id = createShapeId();

  if (tool === "pencil") {
    const points = draftPoints.length > 0 ? draftPoints : [start, current];

    return {
      id,
      type: "pencil" as const,
      x1: start.x,
      y1: start.y,
      x2: current.x,
      y2: current.y,
      points,
    };
  }

  return {
    id,
    type: tool,
    x1: start.x,
    y1: start.y,
    x2: current.x,
    y2: current.y,
  };
}

export function shouldCommitShape(shape: CanvasShape) {
  if (shape.type === "text") {
    return Boolean(shape.text?.trim());
  }

  if (shape.type === "pencil") {
    return (shape.points?.length ?? 0) > 1;
  }

  if (shape.x2 === undefined || shape.y2 === undefined) {
    return false;
  }

  return (
    Math.abs(shape.x2 - shape.x1) > 2 || Math.abs(shape.y2 - shape.y1) > 2
  );
}

export function createShapeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `shape-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getShapeBounds(shape: CanvasShape): ShapeBounds {
  if (shape.type === "pencil" && shape.points && shape.points.length > 0) {
    const xs = shape.points.map((point) => point.x);
    const ys = shape.points.map((point) => point.y);

    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    };
  }

  if (shape.type === "text") {
    const width = Math.max((shape.text?.length ?? 0) * 9, 30);
    const height = 24;

    return {
      left: shape.x1,
      right: shape.x1 + width,
      top: shape.y1 - height,
      bottom: shape.y1,
    };
  }

  if (shape.x2 === undefined || shape.y2 === undefined) {
    return {
      left: shape.x1,
      right: shape.x1,
      top: shape.y1,
      bottom: shape.y1,
    };
  }

  if (shape.type === "circle") {
    const size = Math.max(
      Math.abs(shape.x2 - shape.x1),
      Math.abs(shape.y2 - shape.y1),
    );
    const diameterX = shape.x2 >= shape.x1 ? size : -size;
    const diameterY = shape.y2 >= shape.y1 ? size : -size;
    const left = Math.min(shape.x1, shape.x1 + diameterX);
    const right = Math.max(shape.x1, shape.x1 + diameterX);
    const top = Math.min(shape.y1, shape.y1 + diameterY);
    const bottom = Math.max(shape.y1, shape.y1 + diameterY);

    return { left, right, top, bottom };
  }

  return {
    left: Math.min(shape.x1, shape.x2),
    right: Math.max(shape.x1, shape.x2),
    top: Math.min(shape.y1, shape.y2),
    bottom: Math.max(shape.y1, shape.y2),
  };
}

export function getResizeHandlePoints(shape: CanvasShape) {
  if (
    shape.type === "text" ||
    shape.type === "pencil" ||
    shape.x2 === undefined ||
    shape.y2 === undefined
  ) {
    return null;
  }

  const bounds = getShapeBounds(shape);

  return {
    "top-left": {
      x: bounds.left,
      y: bounds.top,
    },
    "top-right": {
      x: bounds.right,
      y: bounds.top,
    },
    "bottom-left": {
      x: bounds.left,
      y: bounds.bottom,
    },
    "bottom-right": {
      x: bounds.right,
      y: bounds.bottom,
    },
  } satisfies Record<ResizeHandle, CanvasPoint>;
}

export function getResizeHandleAtPoint(
  shape: CanvasShape,
  point: CanvasPoint,
): ResizeHandle | null {
  const handles = getResizeHandlePoints(shape);

  if (!handles) {
    return null;
  }

  return (
    (Object.entries(handles).find(([, handlePoint]) => {
      return (
        distanceBetweenPoints(point, handlePoint) <= RESIZE_HANDLE_RADIUS + 4
      );
    })?.[0] as ResizeHandle | undefined) ?? null
  );
}

export function translateShape(shape: CanvasShape, deltaX: number, deltaY: number) {
  return {
    ...shape,
    x1: shape.x1 + deltaX,
    y1: shape.y1 + deltaY,
    x2: shape.x2 === undefined ? undefined : shape.x2 + deltaX,
    y2: shape.y2 === undefined ? undefined : shape.y2 + deltaY,
    points: shape.points?.map((point) => ({
      x: point.x + deltaX,
      y: point.y + deltaY,
    })),
  };
}

export function resizeShapeFromHandle(
  shape: CanvasShape,
  nextPoint: CanvasPoint,
  handle: ResizeHandle,
) {
  if (
    shape.type === "text" ||
    shape.type === "pencil" ||
    shape.x2 === undefined ||
    shape.y2 === undefined
  ) {
    return shape;
  }

  const nextShape = { ...shape };
  const isLeftHandle = handle === "top-left" || handle === "bottom-left";
  const isTopHandle = handle === "top-left" || handle === "top-right";

  if (isLeftHandle) {
    if (shape.x1 <= shape.x2) {
      nextShape.x1 = nextPoint.x;
    } else {
      nextShape.x2 = nextPoint.x;
    }
  } else if (shape.x1 <= shape.x2) {
    nextShape.x2 = nextPoint.x;
  } else {
    nextShape.x1 = nextPoint.x;
  }

  if (isTopHandle) {
    if (shape.y1 <= shape.y2) {
      nextShape.y1 = nextPoint.y;
    } else {
      nextShape.y2 = nextPoint.y;
    }
  } else if (shape.y1 <= shape.y2) {
    nextShape.y2 = nextPoint.y;
  } else {
    nextShape.y1 = nextPoint.y;
  }

  return nextShape;
}

export function getResizeCursor(handle: ResizeHandle) {
  switch (handle) {
    case "top-left":
    case "bottom-right":
      return "nwse-resize";
    case "top-right":
    case "bottom-left":
      return "nesw-resize";
    default:
      return "pointer";
  }
}

export function getShapePosition(shape: CanvasShape): CanvasPoint {
  const bounds = getShapeBounds(shape);

  return {
    x: bounds.left,
    y: bounds.top,
  };
}

export function mergeShapeUpdates(
  shape: CanvasShape,
  updates: Partial<CanvasShape>,
): CanvasShape {
  return {
    ...shape,
    ...updates,
    points: updates.points ?? shape.points,
  };
}

export function isShapeHit(shape: CanvasShape, point: CanvasPoint) {
  if (shape.type === "pencil" && shape.points && shape.points.length > 1) {
    for (let index = 1; index < shape.points.length; index += 1) {
      if (
        distanceToSegment(point, shape.points[index - 1], shape.points[index]) <=
        MIN_DISTANCE
      ) {
        return true;
      }
    }

    return false;
  }

  if (shape.type === "text") {
    const bounds = getShapeBounds(shape);

    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  if (shape.x2 === undefined || shape.y2 === undefined) {
    return false;
  }

  if (shape.type === "circle") {
    const centerX = (shape.x1 + shape.x2) / 2;
    const centerY = (shape.y1 + shape.y2) / 2;
    const radius = Math.max(
      Math.abs(shape.x2 - shape.x1),
      Math.abs(shape.y2 - shape.y1),
    ) / 2;

    return Math.hypot(point.x - centerX, point.y - centerY) <= radius + 8;
  }

  const start = { x: shape.x1, y: shape.y1 };
  const end = { x: shape.x2, y: shape.y2 };

  if (shape.type === "line" || shape.type === "arrow") {
    return distanceToSegment(point, start, end) <= MIN_DISTANCE;
  }

  const left = Math.min(shape.x1, shape.x2);
  const right = Math.max(shape.x1, shape.x2);
  const top = Math.min(shape.y1, shape.y2);
  const bottom = Math.max(shape.y1, shape.y2);

  return (
    point.x >= left - MIN_DISTANCE &&
    point.x <= right + MIN_DISTANCE &&
    point.y >= top - MIN_DISTANCE &&
    point.y <= bottom + MIN_DISTANCE
  );
}
