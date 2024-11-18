import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import CustomColorInput from "./components/CustomColorInput";

function App() {
  const url = new URL(window.location.href);
  const initialTheme = url.searchParams.get("theme");

  const [theme, setTheme] = useState(initialTheme || null);

  const [rows, setRows] = useState(20);
  const [columns, setColumns] = useState(20);
  const [fieldType, setFieldType] = useState("magnetic");
  const [direction, setDirection] = useState(0);
  const [intensity, setIntensity] = useState(1);
  const [shape, setShape] = useState("line");
  const [roundedCorners, setRoundedCorners] = useState(true);
  const [spiral, setSpiral] = useState(true);
  const [spiralIntensity, setSpiralIntensity] = useState(0.1);
  const [gradientType, setGradientType] = useState("none");
  const [shapeSize, setShapeSize] = useState(1);
  const [vectorScale, setVectorScale] = useState(1);
  const [lineThickness, setLineThickness] = useState(1);
  const [xSpacing, setXSpacing] = useState(1);
  const [ySpacing, setYSpacing] = useState(1);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [field, setField] = useState<
    {
      x: number;
      y: number;
      angle: number;
      length: number;
      r: number;
    }[]
  >([]);
  const [fillParent, setFillParent] = useState(true);
  const [pastedSvg, setPastedSvg] = useState("");
  const [customShapeSource, setCustomShapeSource] = useState(null);

  const [frameWidth, setFrameWidth] = useState(600);
  const [frameHeight, setFrameHeight] = useState(600);
  const [actualFrameWidth, setActualFrameWidth] = useState(600);
  const [actualFrameHeight, setActualFrameHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState("#1e1e1e");
  const [shapeColor, setShapeColor] = useState("#ffffff");
  const [customShape, setCustomShape] = useState<string | null>(null);
  const [customShapeViewBox, setCustomShapeViewBox] = useState(null);
  const [userChangedColor, setUserChangedColor] = useState(false);
  const [isWaitingForVectorSelection, setIsWaitingForVectorSelection] =
    useState(false);
  const [userOverrideBgColor, setUserOverrideBgColor] = useState(false);

  const svgRef = useRef(null);

  const generateField = useCallback(
    (
      rows: number,
      columns: number,
      type: string,
      direction: number,
      intensity: number,
      spiral: boolean,
      spiralIntensity: number,
      xSpacing: number,
      ySpacing: number,
      xOffsetPercent: number,
      yOffsetPercent: number
    ) => {
      const newField = [];
      const cellWidth = frameWidth / (columns - 1);
      const cellHeight = frameHeight / (rows - 1);
      const centerX = frameWidth / 2;
      const centerY = frameHeight / 2;
      const seed = Math.random();

      const xOffset = (xOffsetPercent / 100) * frameWidth;
      const yOffset = (yOffsetPercent / 100) * frameHeight;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          let vectorAngle = 0,
            length = 5;
          const posX = x * cellWidth * xSpacing;
          const posY = y * cellHeight * ySpacing;
          const dx = posX - centerX + xOffset;
          const dy = posY - centerY + yOffset;
          const r = Math.sqrt(dx * dx + dy * dy);

          switch (type) {
            case "fluid":
              vectorAngle =
                (Math.sin((posX + xOffset) * 0.05 + seed) +
                  Math.cos((posY + yOffset) * 0.05 + seed)) *
                  Math.PI +
                (direction * Math.PI) / 180;
              length =
                5 +
                Math.sin(
                  (posX + xOffset) * 0.01 + (posY + yOffset) * 0.01 + seed
                ) *
                  2 *
                  intensity;
              break;
            case "magnetic":
              vectorAngle =
                Math.atan2(dy, dx) + Math.PI / 2 + (direction * Math.PI) / 180;
              length = 5 + r * 0.02 * intensity;
              break;
            case "electric":
              vectorAngle = Math.atan2(dy, dx) + (direction * Math.PI) / 180;
              length = (10 - Math.min(r * 0.03, 8)) * intensity;
              break;
            case "vortex":
              vectorAngle =
                Math.atan2(dy, dx) + Math.PI / 2 + (direction * Math.PI) / 180;
              length = (5 + Math.min(r * 0.05, 10)) * intensity;
              break;
            case "sink":
              vectorAngle =
                Math.atan2(dy, dx) + Math.PI + (direction * Math.PI) / 180;
              length = (10 - Math.min(r * 0.05, 9)) * intensity;
              break;
            case "source":
              vectorAngle = Math.atan2(dy, dx) + (direction * Math.PI) / 180;
              length = (10 - Math.min(r * 0.05, 9)) * intensity;
              break;
            case "saddle":
              vectorAngle =
                Math.atan2(dy * dy - dx * dx, 2 * dx * dy) +
                (direction * Math.PI) / 180;
              length =
                Math.min(Math.sqrt(Math.abs(dx * dx - dy * dy)) * 0.1, 10) *
                intensity;
              break;
            case "wind":
              vectorAngle =
                (direction * Math.PI) / 180 +
                Math.sin((posY + yOffset) * 0.1 + seed) * 0.5;
              length =
                (5 + Math.cos((posX + xOffset) * 0.1 + seed) * 2) * intensity;
              break;
            case "grid":
              vectorAngle = (direction * Math.PI) / 180;
              length = 5 * intensity;
              break;
            case "half-screen":
              if (posY >= frameHeight / 2) {
                vectorAngle = (direction * Math.PI) / 180;
                length = 5 * intensity;
              } else {
                continue;
              }
              break;
            default:
              console.warn(`Unknown field type: ${type}`);
              continue;
          }

          if (spiral && type !== "grid" && type !== "half-screen") {
            const spiralAngle = Math.atan2(dy, dx) + r * spiralIntensity * 0.1;
            vectorAngle = (vectorAngle + spiralAngle) / 2;
          }

          newField.push({ x: posX, y: posY, angle: vectorAngle, length, r });
        }
      }
      return newField;
    },
    [frameWidth, frameHeight]
  );

  const updateFrameDimensions = useCallback(
    (width: number, height: number) => {
      if (fillParent) {
        const aspectRatio = width / height;
        let scaledWidth, scaledHeight;

        if (aspectRatio > 1) {
          scaledWidth = 600;
          scaledHeight = 600 / aspectRatio;
        } else {
          scaledHeight = 600;
          scaledWidth = 600 * aspectRatio;
        }

        setFrameWidth(scaledWidth);
        setFrameHeight(scaledHeight);
      } else {
        setFrameWidth(600);
        setFrameHeight(600);
        setActualFrameHeight(600);
        setActualFrameWidth(600);
      }
    },
    [fillParent]
  );

  const getComplementaryColor = useCallback((hexColor: string) => {
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    h = (h + 0.5) % 1;
    l = l > 0.5 ? Math.max(0, l - 0.5) : Math.min(1, l + 0.5);
    s = Math.min(1, s + 0.3);

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);

    return `#${Math.round(r * 255)
      .toString(16)
      .padStart(2, "0")}${Math.round(g * 255)
      .toString(16)
      .padStart(2, "0")}${Math.round(b * 255)
      .toString(16)
      .padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    const newField = generateField(
      rows,
      columns,
      fieldType,
      direction,
      intensity,
      spiral,
      spiralIntensity,
      xSpacing,
      ySpacing,
      xOffset,
      yOffset
    );
    setField(newField);
  }, [
    rows,
    columns,
    fieldType,
    direction,
    intensity,
    spiral,
    spiralIntensity,
    xSpacing,
    ySpacing,
    xOffset,
    yOffset,
    generateField,
  ]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log("EVENT: ", event);
      if (event.data.type === "theme") {
        setTheme(event.data.content);
      }

      if (event.data.type === "board-selected") {
        const { width, height, backgroundColor: frameBgColor } = event.data;
        setActualFrameWidth(width);
        setActualFrameHeight(height);
        updateFrameDimensions(width, height);
        if (frameBgColor && !userOverrideBgColor) {
          setBackgroundColor(frameBgColor);
          const complementaryColor = getComplementaryColor(frameBgColor);
          setShapeColor(complementaryColor);
        }
      }
    });
  }, [updateFrameDimensions, getComplementaryColor, userOverrideBgColor]);

  const parseSvgString = (svgString: string, source: string) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");

    if (svgElement) {
      const viewBox = svgElement.getAttribute("viewBox");
      setCustomShapeViewBox(viewBox);
      setCustomShape(svgString);
      setShape("custom");
      setCustomShapeSource(source);
      setUserChangedColor(false); // Reset this when a new custom shape is set
    } else {
      console.error("No SVG element found in the parsed document");
    }
  };

  useEffect(() => {
    updateFrameDimensions(actualFrameWidth, actualFrameHeight);
  }, [fillParent, actualFrameWidth, actualFrameHeight, updateFrameDimensions]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // Send a message to the plugin to close itself
        parent.postMessage({ pluginMessage: { type: "close-plugin" } }, "*");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
  }, []);

  const getGradientOpacity = useCallback(
    (vector) => {
      const { x, y, r } = vector;
      const maxR = Math.sqrt(
        (frameWidth * frameWidth) / 4 + (frameHeight * frameHeight) / 4
      );
      switch (gradientType) {
        case "radial":
          return Math.max(0, 1 - r / maxR);
        case "angular":
          return (
            (Math.atan2(y - frameHeight / 2, x - frameWidth / 2) + Math.PI) /
            (2 * Math.PI)
          );
        case "wave":
          return (Math.sin(r * 0.1) + 1) / 2;
        default:
          return 1;
      }
    },
    [gradientType, frameWidth, frameHeight]
  );

  const renderCustomSvg = useCallback(() => {
    if (customShape && customShapeViewBox) {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(customShape, "image/svg+xml");
      const svgElement = svgDoc.documentElement;

      const updateColors = (element) => {
        Array.from(element.children).forEach(updateColors);
      };

      updateColors(svgElement);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      return <g dangerouslySetInnerHTML={{ __html: svgString }} />;
    }
    return null;
  }, [
    customShape,
    customShapeViewBox,
    shapeColor,
    userChangedColor,
    customShapeSource,
  ]);

  const renderVector = useCallback(
    (vector, index) => {
      const scaledLength = vector.length * vectorScale;
      const endX = vector.x + Math.cos(vector.angle) * scaledLength;
      const endY = vector.y + Math.sin(vector.angle) * scaledLength;
      const opacity = getGradientOpacity(vector);
      const color = `${shapeColor}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;

      if (shape === "custom" && customShape && customShapeViewBox) {
        const [, , vbWidth, vbHeight] = customShapeViewBox
          .split(" ")
          .map(Number);
        const aspectRatio = vbWidth / vbHeight;

        const cellSize = Math.min(frameWidth / columns, frameHeight / rows);
        const baseSize = cellSize * shapeSize;

        let scaledWidth, scaledHeight;
        if (aspectRatio > 1) {
          scaledWidth = baseSize;
          scaledHeight = baseSize / aspectRatio;
        } else {
          scaledHeight = baseSize;
          scaledWidth = baseSize * aspectRatio;
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(customShape, "image/svg+xml");
        const svgElement = svgDoc.documentElement;

        const updateColors = (element) => {
          Array.from(element.children).forEach(updateColors);
        };

        updateColors(svgElement);

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);

        return (
          <g
            key={index}
            transform={`translate(${endX - scaledWidth / 2}, ${
              endY - scaledHeight / 2
            }) rotate(${(vector.angle * 180) / Math.PI})`}
          >
            <svg
              viewBox={customShapeViewBox}
              width={scaledWidth}
              height={scaledHeight}
              style={{ overflow: "visible" }}
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          </g>
        );
      }

      switch (shape) {
        case "line":
          return (
            <line
              key={index}
              x1={vector.x}
              y1={vector.y}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth={lineThickness}
              strokeLinecap={roundedCorners ? "round" : "butt"}
            />
          );
        case "dot":
          return (
            <circle
              key={index}
              cx={endX}
              cy={endY}
              r={shapeSize}
              fill={color}
            />
          );
        case "arrow":
          const arrowSize = 2 * shapeSize;
          const angle = Math.atan2(endY - vector.y, endX - vector.x);
          return (
            <g key={index}>
              <line
                x1={vector.x}
                y1={vector.y}
                x2={endX}
                y2={endY}
                stroke={color}
                strokeWidth={lineThickness}
              />
              <path
                d={`M ${endX} ${endY} L ${
                  endX - arrowSize * Math.cos(angle - Math.PI / 6)
                } ${endY - arrowSize * Math.sin(angle - Math.PI / 6)} L ${
                  endX - arrowSize * Math.cos(angle + Math.PI / 6)
                } ${endY - arrowSize * Math.sin(angle + Math.PI / 6)} Z`}
                fill={color}
              />
            </g>
          );
        case "triangle":
          const triangleSize = 3 * shapeSize;
          return (
            <path
              key={index}
              d={`M ${endX} ${endY} 
               L ${
                 endX - triangleSize * Math.cos(vector.angle - Math.PI / 6)
               } ${endY - triangleSize * Math.sin(vector.angle - Math.PI / 6)} 
               L ${
                 endX - triangleSize * Math.cos(vector.angle + Math.PI / 6)
               } ${endY - triangleSize * Math.sin(vector.angle + Math.PI / 6)} 
               Z`}
              fill={color}
            />
          );
        default:
          return null;
      }
    },
    [
      shape,
      shapeSize,
      vectorScale,
      lineThickness,
      getGradientOpacity,
      shapeColor,
      customShape,
      customShapeViewBox,
      columns,
      rows,
      frameWidth,
      frameHeight,
      renderCustomSvg,
      roundedCorners,
    ]
  );

  const handleSvgPaste = (event) => {
    const pastedValue = event.target.value;
    setPastedSvg(pastedValue);
    if (pastedValue) {
      parseSvgString(pastedValue, "text");
    }
  };

  const resetState = () => {
    setRows(20);
    setColumns(20);
    setFieldType("magnetic");
    setDirection(0);
    setIntensity(1);
    setShape("line");
    setRoundedCorners(true);
    setSpiral(true);
    setSpiralIntensity(0.1);
    setGradientType("none");
    setShapeSize(1);
    setVectorScale(1);
    setLineThickness(1);
    setXOffset(0);
    setYOffset(0);
    setXSpacing(1);
    setYSpacing(1);
    setFillParent(true);
    setCustomShape(null);
    setIsWaitingForVectorSelection(false);
    setUserOverrideBgColor(false);
    setUserChangedColor(false);
    setCustomShape(null);
    setCustomShapeViewBox(null);
    setPastedSvg("");
  };

  const sendSvgToPenpot = () => {
    if (svgRef.current) {
      const svgElement = svgRef.current.cloneNode(true);
      const scaleX = actualFrameWidth / frameWidth;
      const scaleY = actualFrameHeight / frameHeight;

      // Set the viewBox to match the original preview dimensions
      svgElement.setAttribute("viewBox", `0 0 ${frameWidth} ${frameHeight}`);
      svgElement.setAttribute("width", actualFrameWidth);
      svgElement.setAttribute("height", actualFrameHeight);

      // We won't apply any scaling to individual elements
      // Instead, we'll let Penpot handle the scaling based on the new width and height

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const cleanedSvgData = svgData.replace(/xmlns="[^"]*"/, "");

      console.log("Sending data to Penpot:", {
        svg: cleanedSvgData,
        width: actualFrameWidth,
        height: actualFrameHeight,
        backgroundColor,
        frameWidth,
        frameHeight,
        scaleX,
        scaleY,
      });

      parent.postMessage(
        {
          pluginMessage: {
            type: "create-svg",
            svg: cleanedSvgData,
            width: actualFrameWidth,
            height: actualFrameHeight,
            backgroundColor: backgroundColor,
            scaleX: scaleX,
            scaleY: scaleY,
            isCustomShape: shape === "custom",
          },
        },
        "*"
      );
    } else {
      console.error("SVG ref is null");
    }
  };

  const renderControl = (
    label: string,
    value: number,
    setValue,
    min: number,
    max: number,
    step: number,
    unit = "",
    disabled = false
  ) => (
    <div key={label} className="form-group">
      <label htmlFor="step" className="caption">
        {label}: <span className="value-span">{value.toFixed(2)}</span>{" "}
        <span className="unit-span">{unit}</span>
      </label>

      <input
        type="range"
        id="step"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        disabled={disabled}
        style={{
          width: "100%",
        }}
        className={theme === "light" ? "light-range" : "dark-range"}
      />
    </div>
  );

  return (
    <div className="app" data-theme={theme}>
      <div
        className="preview"
        style={{
          width: 600,
          height: 600,
          margin: "0 auto",
          position: "relative",
        }}
      >
        <svg
          ref={svgRef}
          width={frameWidth}
          height={frameHeight}
          viewBox={`0 0 ${frameWidth} ${frameHeight}`}
          style={{
            backgroundColor: backgroundColor,
          }}
        >
          {field.map((vector, index) => renderVector(vector, index))}
        </svg>
        <div className="size-label">
          {Math.round(actualFrameWidth)}x{Math.round(actualFrameHeight)}
        </div>
      </div>
      <div className="form">
        <div className="fields">
          <div className="form-group">
            <label htmlFor="shape-select" className="caption">
              Shape
            </label>
            <select
              className="select"
              id="shape-select"
              value={shape}
              onChange={(e) => setShape(e.target.value)}
            >
              <option value="line">Lines</option>
              <option value="dot">Dots</option>
              <option value="arrow">Arrows</option>
              <option value="triangle">Triangles</option>
              <option value="custom">
                {isWaitingForVectorSelection
                  ? "Select a vector in Penpot"
                  : "Custom Shape"}
              </option>
            </select>
          </div>

          {shape === "custom" && (
            <div className="form-group">
              <label htmlFor="svg-textarea">Paste SVG Code</label>
              <textarea
                id="svg-textarea"
                value={pastedSvg}
                onChange={handleSvgPaste}
                placeholder="Select a vector layer or paste your SVG code here"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="field-type-select" className="caption">
              Field Type
            </label>
            <select
              className="select"
              id="field-type-select"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
            >
              <option value="magnetic">Magnetic Field</option>
              <option value="grid">Grid</option>
              <option value="fluid">Fluid Flow</option>
              <option value="electric">Electric Field</option>
              <option value="vortex">Vortex</option>
              <option value="sink">Sink</option>
              <option value="source">Source</option>
              <option value="saddle">Saddle Point</option>
              <option value="wind">Wind Flow</option>
              <option value="half-screen">Half Screen</option>
            </select>
          </div>

          <div className="form-group counter-container">
            <label htmlFor="rows-input" className="caption">
              Rows <span className="value-span">{rows}</span>
            </label>

            <input
              id="rows-input"
              type="range"
              min={2}
              max={100}
              step={1}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              style={{ width: "100%" }}
              className={theme === "light" ? "light-range" : "dark-range"}
            />
          </div>

          <div className="form-group counter-container">
            <label htmlFor="columns-input" className="caption">
              Columns <span className="value-span">{columns}</span>
            </label>

            <input
              id="columns-input"
              type="range"
              min={2}
              max={100}
              step={1}
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              style={{ width: "100%" }}
              className={theme === "light" ? "light-range" : "dark-range"}
            />
          </div>
          {/* </div> */}

          <CustomColorInput
            label="Background Color"
            value={backgroundColor}
            onChange={setBackgroundColor}
            format="hex"
          />

          <CustomColorInput
            label="Shape Color"
            value={shapeColor}
            onChange={setShapeColor}
            format="hex"
          />

          <div className="form-group">
            <label htmlFor="gradient-type-select" className="caption">
              Gradient Type
            </label>
            <select
              className="select"
              id="gradient-type-select"
              value={gradientType}
              onChange={(e) => setGradientType(e.target.value)}
            >
              <option value="none">None</option>
              <option value="angular">Angular Gradient</option>
              <option value="radial">Radial Gradient</option>
              <option value="wave">Wave Gradient</option>
            </select>
          </div>

          <div className="divider"></div>

          {renderControl("X Offset", xOffset, setXOffset, -50, 50, 1, "%")}
          {renderControl("Y Offset", yOffset, setYOffset, -50, 50, 1, "%")}
          {renderControl(
            "Field Rotation",
            direction,
            setDirection,
            0,
            360,
            1,
            "°"
          )}
          <div>
            <div
              className="checkbox-container checkbox-custom"
              data-check="true"
            >
              <input
                className="checkbox-input"
                id="additional-spiral-checkbox"
                type="checkbox"
                checked={spiral}
                onChange={(event) => setSpiral(event.target.checked)}
              />
              <label htmlFor="additional-spiral-checkbox" className="caption">
                Additional spiral
              </label>
            </div>
          </div>
          {spiral &&
            renderControl(
              "Spiral Intensity",
              spiralIntensity,
              setSpiralIntensity,
              0,
              1,
              0.1,
              "",
              !spiral
            )}

          {renderControl(
            "Field Strength",
            intensity,
            setIntensity,
            0.1,
            20,
            0.1,
            "x"
          )}

          {(shape === "line" || shape === "arrow") && (
            <>
              {renderControl(
                "Line Length",
                vectorScale,
                setVectorScale,
                0.1,
                12,
                0.1,
                "x"
              )}
              {renderControl(
                "Line Thickness",
                lineThickness,
                setLineThickness,
                0.1,
                12,
                0.1,
                "px"
              )}
              {shape === "line" && (
                <div>
                  <div className="checkbox-container checkbox-custom">
                    <input
                      className="checkbox-input"
                      id="rounded-corners-checkbox"
                      type="checkbox"
                      checked={roundedCorners}
                      onChange={(event) =>
                        setRoundedCorners(event.target.checked)
                      }
                    />
                    <label
                      htmlFor="rounded-corners-checkbox"
                      className="caption"
                    >
                      Rounded Corners
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {(shape === "dot" || shape === "triangle" || shape === "custom") &&
            renderControl(
              "Shape Size",
              shapeSize,
              setShapeSize,
              0.1,
              10,
              0.1,
              "x"
            )}

          {/* {renderControl("Vector Spacing", spacing, setSpacing, 0.5, 2, 0.1, "x")} */}
          {renderControl("X Spacing", xSpacing, setXSpacing, 0.5, 10, 0.1, "x")}
          {renderControl("Y Spacing", ySpacing, setYSpacing, 0.5, 10, 0.1, "x")}
        </div>
        <div className="button-wrapper">
          <button
            id="reset-btn"
            onClick={resetState}
            data-appearance="secondary"
          >
            Reset
          </button>

          <button
            id="send-to-penpot-btn"
            data-appearance="primary"
            onClick={() => sendSvgToPenpot()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
