import type { CanvasPoint, CanvasShape, Tool } from "./types";

const MIN_DISTANCE = 8;

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
  tool: Exclude<Tool, "eraser">,
  start: CanvasPoint,
  current: CanvasPoint,
  draftPoints: CanvasPoint[] = [],
) {
  if (tool === "pencil") {
    const points = draftPoints.length > 0 ? draftPoints : [start, current];

    return {
      type: "pencil" as const,
      x1: start.x,
      y1: start.y,
      x2: current.x,
      y2: current.y,
      points,
    };
  }

  return {
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
    const width = Math.max((shape.text?.length ?? 0) * 9, 30);
    const height = 24;

    return (
      point.x >= shape.x1 &&
      point.x <= shape.x1 + width &&
      point.y <= shape.y1 &&
      point.y >= shape.y1 - height
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
