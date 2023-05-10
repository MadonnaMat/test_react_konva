import { useRef, useState, useEffect, useCallback } from "react";
import { Stage } from "react-konva"
import ZoomableStage from "./ZoomableStage";


export default function ScrollableStage({children,  containerWidth, containerHeight, style,
  scale,
  setScale,
  position,
  setPosition,
  ...props
}) {
  const PADDING = 20;

  const scrollStyle = {
    ...style,
    overflow: "auto",
    direction: 'rtl'
  }

  const largeContaienrStyle = {
    width: containerWidth,
    height: containerHeight,
    overflow: "hidden",
    direction: 'ltr'
  }
  
  const [computedContainerStyle, setComputedContainerStyle] = useState(largeContaienrStyle);
  
  const [stageWidth, setStageWidth] = useState((containerWidth + PADDING) * scale);
  const [stageHeight, setStageHeight] = useState((containerHeight + PADDING) * scale);
  
  useEffect(() => {
    setComputedContainerStyle({
      ...largeContaienrStyle,
      width: containerWidth * scale,
      height: containerHeight * scale,
    });

    setStageWidth((containerWidth + PADDING) * scale);
    setStageHeight((containerHeight + PADDING) * scale);
  }, [containerWidth, containerHeight, scale]); 

  const [computedStageStyle, setComputedStageStyle] = useState({});
  
  const stageRef = useRef();
  const containerRef = useRef();
  const scrollRef = useRef();
  
  const repositionStage = useCallback(() => {
    const stage = stageRef.current;
    const scroll = scrollRef.current;

    const dx = scroll.scrollLeft - PADDING;
    const dy = scroll.scrollTop - PADDING;

    // set stage x and y in an animation frame
    // because we do it in onScroll event
    // and it can be fired really ofter
    // so we need to optimize it a bit with RAF
    requestAnimationFrame(() => {
      stage.x(-dx)
      stage.y(-dy)
    })

    setComputedStageStyle({
      transform: `translate(${dx}px, ${dy}px)`
    });
  })
  
  useEffect(() => repositionStage(), [scale]);
  
  // Set scroll position to center of container on first load
  useEffect(() => {
    const scroll = scrollRef.current;
    const container = containerRef.current;

    scroll.scrollLeft = (container.offsetWidth - scroll.offsetWidth) / 2;
    scroll.scrollTop = (container.offsetHeight - scroll.offsetHeight) / 2;
  }, []);
  
  return (
    <div style={scrollStyle} ref={scrollRef} onScroll={repositionStage}>
      <div style={computedContainerStyle} ref={containerRef}>
        <ZoomableStage 
          width={stageWidth} 
          height={stageHeight} 
          stageRef={stageRef} 
          style={computedStageStyle}
          position={position}
          setPosition={setPosition}
          scale={scale}
          setScale={setScale}
          {...props}
        > 
          {children}
        </ZoomableStage>
      </div>      
    </div>
  )
}