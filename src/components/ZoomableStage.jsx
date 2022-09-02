import { useRef, useState, useEffect, useCallback } from "react";
import { Stage } from "react-konva";
export const SCALE_BY = 1.1;

export default function ZoomableStage({
  scale,
  setScale,
  position,
  setPosition,
  ...props
}) {
  const stageRef = useRef();

  useEffect(() => {
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    console.log(position);

    stage.scale({ x: scale, y: scale });
    stage.position(position);
  }, [stageRef, scale, position]);

  const onWheel = useCallback(
    (e) => {
      // stop default scrolling
      e.evt.preventDefault();
      const stage = stageRef.current;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      // how to scale? Zoom in? Or zoom out?
      let direction = e.evt.deltaY > 0 ? 1 : -1;

      // when we zoom on trackpad, e.evt.ctrlKey is true
      // in that case lets revert direction
      if (e.evt.ctrlKey) {
        direction = -direction;
      }

      const newScale =
        direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
      const x = pointer.x;
      const y = pointer.y;
      const pointTo = {
        x: (x - stage.x()) / oldScale,
        y: (y - stage.y()) / oldScale,
      };

      const newPos = {
        x: x - pointTo.x * newScale,
        y: y - pointTo.y * newScale,
      };

      setPosition(newPos);
      setScale(newScale);
    },
    [stageRef]
  );

  return <Stage ref={stageRef} {...props} onWheel={onWheel} />;
}
