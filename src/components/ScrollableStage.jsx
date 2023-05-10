import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { Circle,  Layer, Rect, Stage, Text } from 'react-konva';
import Measure from 'react-measure';
import { createUseGesture, wheelAction, pinchAction, moveAction} from '@use-gesture/react'

const useGesture = createUseGesture([wheelAction, pinchAction, moveAction]);

// TODO: auto scale the content to fit the canvas
// TODO: support touch zoom / pan

export default function ScrollableStage({children, containerWidth, containerHeight, style}) {
  useEffect(() => {
    const handler = (e) => e.preventDefault()
    document.addEventListener('gesturestart', handler)
    document.addEventListener('gesturechange', handler)
    document.addEventListener('gestureend', handler)
    return () => {
      document.removeEventListener('gesturestart', handler)
      document.removeEventListener('gesturechange', handler)
      document.removeEventListener('gestureend', handler)
    }
  }, [])


  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  const stageRef = useRef(null);
  const controlsLayerRef = useRef(null);
  const contentLayerRef = useRef(null);

  const scrollBarWidth = 10;
  const minZoomFactor = 1;

  useEffect(() => {
    if (!stageRef.current || !controlsLayerRef.current || !contentLayerRef.current) {
      return;
    }

    stageRef.current.width(canvasDimensions.width);
    stageRef.current.height(canvasDimensions.height);

    const verticalBar = controlsLayerRef.current.find('#verticalBar')[0];
    const horizontalBar = controlsLayerRef.current.find('#horizontalBar')[0];

    if (!verticalBar || !horizontalBar) {
      return;
    }

    verticalBar.height(canvasDimensions.height);
    verticalBar.x(canvasDimensions.width - scrollBarWidth);

    horizontalBar.width(canvasDimensions.width);
    horizontalBar.y(canvasDimensions.height - scrollBarWidth);
  }, [canvasDimensions]);

  // fade in the controls layer
  const showControlsAnimation = new Konva.Animation((frame) => {
    if (!controlsLayerRef.current) {
      return;
    }

    const opacity = controlsLayerRef.current.opacity();
    const newOpacity = opacity + 0.05;
    if (newOpacity < 1) {
      controlsLayerRef.current.opacity(newOpacity);
    } else {
      controlsLayerRef.current.opacity(1);
      showControlsAnimation.stop();
    }
  }, controlsLayerRef.current);

  // fade out the controls layer
  const hideControlsAnimation = new Konva.Animation((frame) => {
    if (!controlsLayerRef.current) {
      return;
    }

    const opacity = controlsLayerRef.current.opacity();
    const newOpacity = opacity - 0.05;
    if (newOpacity > 0) {
      controlsLayerRef.current.opacity(newOpacity);
    } else {
      controlsLayerRef.current.opacity(0);
      hideControlsAnimation.stop();
    }
  }, controlsLayerRef.current);

  const onMouseEnterCanvas = () => {
    // change the cursor
    if (!stageRef.current || !contentLayerRef.current) {
      return;
    }
    stageRef.current.container().style.cursor = 'crosshair';

    // if we are zoomed all the way out, don't show the controls layer
    const currentScale = contentLayerRef.current.scaleX();
    if (currentScale <= minZoomFactor) {
      return;
    }

    // show the controls layer
    if (hideControlsAnimation.isRunning()) {
      hideControlsAnimation.stop();
    }
    showControlsAnimation.start();
  };

  const onMouseLeaveCanvas = () => {
    // hide the controls layer
    if (showControlsAnimation.isRunning()) {
      showControlsAnimation.stop();
    }
    hideControlsAnimation.start();
  };

  const handleContentMouseDown = () => {
    if (!stageRef.current) {
      return;
    }

    // change cursor type
    stageRef.current.container().style.cursor = 'move';
    stageRef.current.batchDraw();
  };

  const handleContentMouseUp = () => {
    if (!stageRef.current) {
      return;
    }

    // change cursor type
    stageRef.current.container().style.cursor = 'crosshair';
    stageRef.current.batchDraw();
  };

  const moveAndZoom = (ox, oy, dx, s, scrolling) => {
    if (!contentLayerRef.current || !stageRef.current || !controlsLayerRef.current) {
      return;
    }

    const verticalBar = controlsLayerRef.current.find('#verticalBar')[0];
    const horizontalBar = controlsLayerRef.current.find('#horizontalBar')[0];

    if (!verticalBar || !horizontalBar) {
      return;
    }

    const scaleBy = 1.2;
    const oldScale = contentLayerRef.current.scaleX();

    const pointerPosition = {x: ox, y: oy};

    // make sure we do not scroll out of bounds
    const mousePointTo = {
      x: pointerPosition.x / oldScale - contentLayerRef.current.x() / oldScale,
      y: pointerPosition.y / oldScale - contentLayerRef.current.y() / oldScale,
    };

    const newScale = s;

    // update scrollbars scale
    const oldVerticalScrollbarScale = verticalBar.scaleY();
    const oldHorizontalScrollbarScale = horizontalBar.scaleX();

    const newVerticalScrollbarScale = oldVerticalScrollbarScale * (oldScale / newScale);
    const newHorizontalScrollbarScale = oldHorizontalScrollbarScale * (oldScale / newScale);

    verticalBar.scale({ x: verticalBar.scaleX(), y: newVerticalScrollbarScale });
    horizontalBar.scale({ x: newHorizontalScrollbarScale, y: horizontalBar.scaleY() });

    contentLayerRef.current.scale({ x: newScale, y: newScale });

    const oldPos = contentLayerRef.current.position();

    const newPos = scrolling ? {
      x:  oldPos.x + pointerPosition.x ,
      y: oldPos.y + pointerPosition.y,
    } : {
      x: -(mousePointTo.x - pointerPosition.x / newScale) * newScale,
      y: -(mousePointTo.y - pointerPosition.y / newScale) * newScale,
    };


    // if we are scrolling out,
    if (dx > 0) {

      // make sure we do not scroll out of bounds
      if (newPos.x > 0) {
        newPos.x = 0;
      }

      if (newPos.y > 0) {
        newPos.y = 0;
      }

      const xEndstop = stageRef.current.width() - contentLayerRef.current.width() * newScale;
      if (newPos.x < xEndstop) {
        newPos.x = xEndstop;
      }

      const yEndstop = stageRef.current.height() - contentLayerRef.current.height() * newScale;
      if (newPos.y < yEndstop) {
        newPos.y = yEndstop;
      }
    }
    
    contentLayerRef.current.position(newPos);

    // set the scrollbar positions
    const xOffset = newPos.x / newScale;
    const yOffset = newPos.y / newScale;

    horizontalBar.x(-xOffset);
    verticalBar.y(-yOffset);

    // if we are at the minimum zoom level, hide the controls
    if (newScale <= minZoomFactor) {
      onMouseLeaveCanvas();
    } else {
      onMouseEnterCanvas();
    }
  }

  useGesture(
    {
      onWheel: ({ event, memo = 1, first, delta: [dx, dy], offset: [ox, oy], direction: [x, y], movement: [mx, my], memo: m, ctrlKey}) => {
        if(!ctrlKey) moveAndZoom(dx, dy, 1, contentLayerRef.current.scaleX(), true);
      },
      onPinch: ({event: e,  origin: [ox, oy], first, direction: [dx, dy], movement: [ms], offset: [s, a], memo }) => {
        moveAndZoom(ox, oy, dx, s, false);
      }
    },
    {
      target: stageRef,
      pinch: { scaleBounds: { min: 0.5, max: 10 }, rubberband: true },
    }
  )

  const onMouseEnterScrollBar = () => {
    // set the cursor to pointer
    if (!stageRef.current) {
      return;
    }
    stageRef.current.container().style.cursor = 'pointer';
  };

  const onMouseLeaveScrollBar = () => {
    // set the cursor to default
    if (!stageRef.current) {
      return;
    }

    stageRef.current.container().style.cursor = 'crosshair';
  };

  const horizontalScrollBarDragBoundFunc = (pos) => {
    if (!stageRef.current || !contentLayerRef.current || !controlsLayerRef.current) {
      return pos;
    }
    pos.y = stageRef.current.height() - scrollBarWidth;

    if (pos.x < 0) {
      pos.x = 0;
    }

    const horizontalBar = controlsLayerRef.current.find('#horizontalBar')[0];
    if (!horizontalBar) {
      return pos;
    }

    const xEndstop = stageRef.current.width() - horizontalBar.width() * horizontalBar.scaleX();
    if (pos.x > xEndstop) {
      pos.x = xEndstop;
    }

    return pos;
  };

  const verticalScrollBarDragBoundFunc = (pos) => {
    if (!stageRef.current || !contentLayerRef.current || !controlsLayerRef.current) {
      return pos;
    }
    pos.x = stageRef.current.width() - scrollBarWidth;

    if (pos.y < 0) {
      pos.y = 0;
    }

    const verticalBar = controlsLayerRef.current.find('#verticalBar')[0];
    if (!verticalBar) {
      return pos;
    }

    const yEndstop = stageRef.current.height() - verticalBar.height() * verticalBar.scaleY();
    if (pos.y > yEndstop) {
      pos.y = yEndstop;
    }

    return pos;
  };

  const onScrollY = () => {
    if (!stageRef.current || !controlsLayerRef.current || !contentLayerRef.current) {
      return;
    }

    const verticalBar = controlsLayerRef.current.find('#verticalBar')[0];
    if (!verticalBar) {
      return;
    }

    // calculate where the scroll bar is in relation to the scroll bar min and max
    const scrollBarMinY = (verticalBar.height() * verticalBar.scaleY()) / 2;
    const scrollBarMaxY = stageRef.current.height() - scrollBarMinY;
    const scrollBarY = verticalBar.y() + (verticalBar.height() * verticalBar.scaleY()) / 2;

    // find what percentage the scrollBarY is between scrollBarMinY and scrollBarMaxY
    const scrollPercentage = (scrollBarY - scrollBarMinY) / (scrollBarMaxY - scrollBarMinY);

    // calculate what percentage of the content is visible
    const viewPortHeight = stageRef.current.height() / contentLayerRef.current.scaleY();
    const viewPortMinY = viewPortHeight / 2;
    const viewPortMaxY = stageRef.current.height() - viewPortMinY;

    // calculate the new viewPortY
    const newViewPortY = (viewPortMaxY - viewPortMinY) * scrollPercentage;

    const yOffset = newViewPortY * contentLayerRef.current.scaleY() * -1;

    contentLayerRef.current.y(yOffset);
  };

  const onScrollX = () => {
    if (!stageRef.current || !controlsLayerRef.current || !contentLayerRef.current) {
      return;
    }

    const horizontalBar = controlsLayerRef.current.find('#horizontalBar')[0];
    if (!horizontalBar) {
      return;
    }

    // calculate where the scroll bar is in relation to the scroll bar min and max
    const scrollBarMinX = (horizontalBar.width() * horizontalBar.scaleX()) / 2;
    const scrollBarMaxX = stageRef.current.width() - scrollBarMinX;
    const scrollBarX = horizontalBar.x() + (horizontalBar.width() * horizontalBar.scaleX()) / 2;

    // find what percentage the scrollBarX is between scrollBarMinX and scrollBarMaxX
    const scrollPercentage = (scrollBarX - scrollBarMinX) / (scrollBarMaxX - scrollBarMinX);

    // calculate what percentage of the content is visible
    const viewPortWidth = stageRef.current.width() / contentLayerRef.current.scaleX();
    const viewPortMinX = viewPortWidth / 2;
    const viewPortMaxX = stageRef.current.width() - viewPortMinX;

    // calculate the new viewPortX
    const newViewPortX = (viewPortMaxX - viewPortMinX) * scrollPercentage;

    const xOffset = newViewPortX * contentLayerRef.current.scaleX() * -1;

    contentLayerRef.current.x(xOffset);
  };


  return (
    <Measure
      bounds
      onResize={(contentRect) => {
        if (!contentRect.bounds) {
          return;
        }

        setCanvasDimensions({
          width: contentRect.bounds.width,
          height: contentRect.bounds.height,
        });
      }}
    >
      {({ measureRef }) => (
        <div style={style} ref={measureRef}>
          <Stage
            ref={stageRef}
            width={containerWidth}
            height={containerHeight}
            onMouseEnter={onMouseEnterCanvas}
            onMouseLeave={onMouseLeaveCanvas}
          >
            <Layer
              ref={contentLayerRef}
              onMouseDown={handleContentMouseDown}
              onMouseUp={handleContentMouseUp}
              width={containerWidth}
              height={containerHeight}
            >
              {children}
            </Layer>

            <Layer ref={controlsLayerRef} opacity={0}>
              <Rect
                id="verticalBar"
                width={10}
                height={containerHeight}
                fill="gray"
                x={containerWidth - scrollBarWidth}
                y={0}
                dragBoundFunc={verticalScrollBarDragBoundFunc}
                onMouseEnter={onMouseEnterScrollBar}
                onMouseLeave={onMouseLeaveScrollBar}
                onDragMove={onScrollY}
                draggable
              />
              <Rect
                id="horizontalBar"
                width={containerWidth}
                height={10}
                fill="gray"
                x={0}
                y={containerHeight - scrollBarWidth}
                onMouseEnter={onMouseEnterScrollBar}
                onMouseLeave={onMouseLeaveScrollBar}
                dragBoundFunc={horizontalScrollBarDragBoundFunc}
                onDragMove={onScrollX}
                draggable
              />
            </Layer>
          </Stage>
        </div>
      )}
    </Measure>
  );
}
