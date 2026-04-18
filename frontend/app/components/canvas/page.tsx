"use client";

import { useEffect, useRef } from "react";
import p5 from "p5";

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let myP5: p5;

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(800, 500).parent(canvasRef.current!);
        p.background(0);
      };

      p.draw = () => {
        if (p.mouseIsPressed) {
          p.stroke(0, 150, 255);
          p.strokeWeight(4);
          p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
        }
      };
    };

    myP5 = new p5(sketch);

    return () => {
      myP5.remove(); 
    };
  }, []);

  return <div ref={canvasRef}></div>;
}