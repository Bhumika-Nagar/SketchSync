import type { CanvasShape } from "./types";
import { getResizeHandlePoints, getShapeBounds } from "./utils";

function drawArrowHead(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 14;

  context.moveTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6),
  );
  context.moveTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6),
  );
}

export function drawShape(context: CanvasRenderingContext2D, shape: CanvasShape) {
  context.save();
  context.strokeStyle = "rgb(241, 245, 249)";
  context.fillStyle = "rgb(241, 245, 249)";
  context.lineWidth = shape.type === "pencil" ? 2.5 : 2;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (shape.type === "text") {
    context.font = "20px sans-serif";
    context.textBaseline = "alphabetic";
    context.fillText(shape.text ?? "", shape.x1, shape.y1);
    context.restore();
    return;
  }

  if (shape.type === "pencil" && shape.points && shape.points.length > 1) {
    context.beginPath();
    context.moveTo(shape.points[0].x, shape.points[0].y);
    for (let index = 1; index < shape.points.length; index += 1) {
      context.lineTo(shape.points[index].x, shape.points[index].y);
    }
    context.stroke();
    context.restore();
    return;
  }

  if (shape.x2 === undefined || shape.y2 === undefined) {
    context.restore();
    return;
  }

  switch (shape.type) {
    case "rect": {
      const width = shape.x2 - shape.x1;
      const height = shape.y2 - shape.y1;
      context.strokeRect(shape.x1, shape.y1, width, height);
      context.restore();
      return;
    }
    case "circle": {
      const size = Math.max(
        Math.abs(shape.x2 - shape.x1),
        Math.abs(shape.y2 - shape.y1),
      );
      const diameterX = shape.x2 >= shape.x1 ? size : -size;
      const diameterY = shape.y2 >= shape.y1 ? size : -size;
      context.beginPath();
      context.ellipse(
        shape.x1 + diameterX / 2,
        shape.y1 + diameterY / 2,
        Math.abs(diameterX) / 2,
        Math.abs(diameterY) / 2,
        0,
        0,
        Math.PI * 2,
      );
      context.stroke();
      context.restore();
      return;
    }
    case "diamond": {
      const centerX = (shape.x1 + shape.x2) / 2;
      const centerY = (shape.y1 + shape.y2) / 2;
      context.beginPath();
      context.moveTo(centerX, shape.y1);
      context.lineTo(shape.x2, centerY);
      context.lineTo(centerX, shape.y2);
      context.lineTo(shape.x1, centerY);
      context.closePath();
      context.stroke();
      context.restore();
      return;
    }
    case "line": {
      context.beginPath();
      context.moveTo(shape.x1, shape.y1);
      context.lineTo(shape.x2, shape.y2);
      context.stroke();
      context.restore();
      return;
    }
    case "arrow": {
      context.beginPath();
      context.moveTo(shape.x1, shape.y1);
      context.lineTo(shape.x2, shape.y2);
      drawArrowHead(context, shape.x1, shape.y1, shape.x2, shape.y2);
      context.stroke();
      context.restore();
      return;
    }
    default:
      context.restore();
      return;
  }
}

export function drawSelection(context: CanvasRenderingContext2D, shape: CanvasShape) {
  const bounds = getShapeBounds(shape);
  const handles = getResizeHandlePoints(shape);

  context.save();
  context.strokeStyle = "rgb(96, 165, 250)";
  context.lineWidth = 1.5;
  context.strokeRect(
    bounds.left - 6,
    bounds.top - 6,
    bounds.right - bounds.left + 12,
    bounds.bottom - bounds.top + 12,
  );

  if (handles) {
    context.fillStyle = "rgb(96, 165, 250)";
    context.strokeStyle = "rgb(226, 232, 240)";
    context.lineWidth = 1.5;

    Object.values(handles).forEach((handle) => {
      context.beginPath();
      context.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
  }

  context.restore();
}
