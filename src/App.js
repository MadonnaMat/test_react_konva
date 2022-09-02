import "./App.css";
import { useCallback, useState, useRef, forwardRef } from "react";
import { Stage, Layer, Image } from "react-konva";
import useImage from "use-image";
import { useIntervalEffect } from "@react-hookz/web";
import ZoomableStage, { SCALE_BY } from "./components/ZoomableStage";

const getScale = (widthRatio, heightRatio, scale) => {
  let newScale = Math.min(widthRatio, heightRatio);
  if (newScale > 1) {
    newScale = Math.pow(1.1, newScale) / 10 + 0.9;
  }
  newScale = Math.min(newScale, 5);
  newScale = Math.max(newScale, 0.1);
  if (Math.abs(newScale - scale) > 0.3) {
    return newScale;
  } else {
    return scale;
  }
};

const getPanXandYandScale = (left, top, right, bottom, scale) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = right - left;
  const height = bottom - top;
  const xPosition = left;
  const yPosition = top;
  const containerWidth = 600;
  const containerHeight = 400;
  const rotation = 0;

  const widthRatio = viewportWidth / width;
  const heightRatio = viewportHeight / height;
  const newScale = getScale(widthRatio, heightRatio, scale);

  const centerViewX = viewportWidth / 2 - (width * newScale) / 2;
  const centerViewY = viewportHeight / 2 - (height * newScale) / 2;

  const magicSauce = (newScale - 1) / 2;

  const x =
    -1 * (xPosition * newScale - containerWidth * magicSauce - centerViewX);
  const y =
    -1 * (yPosition * newScale - containerHeight * magicSauce - centerViewY);

  const viewCenterX = (viewportWidth - containerWidth) / 2;
  const viewCenterY = (viewportHeight - containerHeight) / 2;

  const radians = (Math.PI / 180) * rotation;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const newX = cos * (x - viewCenterX) - sin * (y - viewCenterY) + viewCenterX;
  const newY = cos * (y - viewCenterY) + sin * (x - viewCenterX) + viewCenterY;

  return [newX, newY, newScale];
};

const BackgroundImage = forwardRef((props, ref) => {
  const [image] = useImage(
    "https://image.shutterstock.com/image-vector/white-shelf-mockup-empty-shelves-260nw-1927984952.jpg"
  );
  return <Image image={image} width={600} height={400} ref={ref} {...props} />;
});

const PhoneImage = ({ zoomTo, ...props }) => {
  const ref = useRef();
  const [image] = useImage(
    "https://media.istockphoto.com/photos/mobile-phone-top-view-with-white-screen-picture-id1161116588?k=20&m=1161116588&s=612x612&w=0&h=NKv_O5xQecCHZic53onobxjqGfW7I-D-tBrzXaPbj_Q="
  );

  return (
    <Image
      image={image}
      width={100}
      height={100}
      ref={ref}
      onClick={() => zoomTo(ref)}
      {...props}
    />
  );
};

function App() {
  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 300,
    y: window.innerHeight / 2 - 200,
  });
  const [scale, setScale] = useState(1);

  const zoomOut = useCallback(() => {
    setPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setScale(scale / SCALE_BY);
  }, [scale]);
  const zoomIn = useCallback(() => {
    setPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setScale(scale * SCALE_BY);
  }, [scale]);

  const zoomTo = (ref) => {
    const img = ref.current;
    const [x, y, newScale] = getPanXandYandScale(
      img.x(),
      img.y(),
      img.x() + img.width(),
      img.y() + img.height(),
      scale
    );
    setPosition({
      x,
      y,
    });
    setScale(newScale);
  };

  return (
    <div className="App">
      <button onClick={zoomOut}>Zoom Out</button>
      <button onClick={zoomIn}>Zoom In</button>
      <ZoomableStage
        width={window.innerWidth}
        height={window.innerHeight}
        position={position}
        setPosition={setPosition}
        scale={scale}
        setScale={setScale}
        draggable
      >
        <Layer>
          <BackgroundImage x={0} y={0} />
          <PhoneImage x={150} y={-30} zoomTo={zoomTo} />
          <PhoneImage x={300} y={-30} zoomTo={zoomTo} />
          <PhoneImage x={150} y={90} zoomTo={zoomTo} />
          <PhoneImage x={300} y={90} zoomTo={zoomTo} />
          <PhoneImage x={150} y={200} zoomTo={zoomTo} />
          <PhoneImage x={300} y={200} zoomTo={zoomTo} />
        </Layer>
      </ZoomableStage>
    </div>
  );
}

export default App;
