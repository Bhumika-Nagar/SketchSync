import type p5 from "p5";
import type { CanvasShape } from "./types";
import { getResizeHandlePoints, getShapeBounds } from "./utils";

function drawArrowHead(
  sketch: p5,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 14;

  sketch.line(
    endX,
    endY,
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6),
  );
  sketch.line(
    endX,
    endY,
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6),
  );
}

export function drawShape(sketch: p5, shape: CanvasShape) {
  sketch.stroke(241, 245, 249);
  sketch.strokeWeight(shape.type === "pencil" ? 2.5 : 2);
  sketch.noFill();

  if (shape.type === "text") {
    sketch.noStroke();
    sketch.fill(241, 245, 249);
    sketch.textSize(20);
    sketch.textAlign(sketch.LEFT, sketch.BASELINE);
    sketch.text(shape.text ?? "", shape.x1, shape.y1);
    return;
  }

  if (shape.type === "pencil" && shape.points && shape.points.length > 1) {
    sketch.beginShape();
    shape.points.forEach((point) => {
      sketch.vertex(point.x, point.y);
    });
    sketch.endShape();
    return;
  }

  if (shape.x2 === undefined || shape.y2 === undefined) {
    return;
  }

  switch (shape.type) {
    case "rect": {
      const width = shape.x2 - shape.x1;
      const height = shape.y2 - shape.y1;
      sketch.rect(shape.x1, shape.y1, width, height);
      return;
    }
    case "circle": {
      const size = Math.max(
        Math.abs(shape.x2 - shape.x1),
        Math.abs(shape.y2 - shape.y1),
      );
      const diameterX = shape.x2 >= shape.x1 ? size : -size;
      const diameterY = shape.y2 >= shape.y1 ? size : -size;
      sketch.ellipse(
        shape.x1 + diameterX / 2,
        shape.y1 + diameterY / 2,
        Math.abs(diameterX),
        Math.abs(diameterY),
      );
      return;
    }
    case "diamond": {
      const centerX = (shape.x1 + shape.x2) / 2;
      const centerY = (shape.y1 + shape.y2) / 2;
      sketch.quad(
        centerX,
        shape.y1,
        shape.x2,
        centerY,
        centerX,
        shape.y2,
        shape.x1,
        centerY,
      );
      return;
    }
    case "line": {
      sketch.line(shape.x1, shape.y1, shape.x2, shape.y2);
      return;
    }
    case "arrow": {
      sketch.line(shape.x1, shape.y1, shape.x2, shape.y2);
      drawArrowHead(sketch, shape.x1, shape.y1, shape.x2, shape.y2);
      return;
    }
    default:
      return;
  }
}

export function drawSelection(sketch: p5, shape: CanvasShape) {
  const bounds = getShapeBounds(shape);
  const handles = getResizeHandlePoints(shape);

  sketch.push();
  sketch.noFill();
  sketch.stroke(96, 165, 250);
  sketch.strokeWeight(1.5);
  sketch.rect(
    bounds.left - 6,
    bounds.top - 6,
    bounds.right - bounds.left + 12,
    bounds.bottom - bounds.top + 12,
  );

  if (handles) {
    sketch.fill(96, 165, 250);
    sketch.stroke(226, 232, 240);
    sketch.strokeWeight(1.5);

    Object.values(handles).forEach((handle) => {
      sketch.circle(handle.x, handle.y, 12);
    });
  }

  sketch.pop();
}
