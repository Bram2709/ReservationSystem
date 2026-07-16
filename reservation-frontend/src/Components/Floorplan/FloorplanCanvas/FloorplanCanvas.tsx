import { Stage, Layer, Rect, Circle, Line, Group, Text, Transformer } from "react-konva";
import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import type { FloorShape } from "../../../types/shapes";
import { isTableShape } from "../../../types/shapes";
import {
  WALL_THICKNESS,
  WALL_FILL,
  rectTableChairs,
  circleTableChairs,
  RoomOutlinePolygon,
  doorGlyph,
  windowGlyph,
} from "../floorplanRender";
import style from "./FloorPlanCanvas.module.css";

const GRID = 10;

// Editor shape colors (Konva needs literals; these mirror styles/_colors.css)
const TABLE_FILL = "#F8FAFC";
const TABLE_FILL_SELECTED = "#EDE4F7";
const STROKE = "#64748B";
const STROKE_SELECTED = "#6D28D9";
const LABEL_COLOR = "#1D1A24";

const snap = (v: number, grid = GRID) => Math.round(v / grid) * grid;

export interface Viewport {
  scale: number;
  x: number;
  y: number;
}

interface Props {
  shapes: FloorShape[];
  selectedIds: string[];
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
  onSelect: (id: string | null, additive?: boolean) => void;
  onSelectMany: (ids: string[]) => void;
  /** Committed change (one undo step). */
  onUpdate: (id: string, updates: Partial<FloorShape>) => void;
  /** Committed change for several shapes at once (one undo step). */
  onBatchUpdate: (updates: { id: string; updates: Partial<FloorShape> }[]) => void;
  /** Transient per-frame change (outline corner drag); no undo step. */
  onPreview: (id: string, updates: Partial<FloorShape>) => void;
  /** Finalize the transient sequence into one undo step. */
  onCommitPreview: () => void;
}

interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function FloorplanCanvas({
  shapes,
  selectedIds,
  viewport,
  onViewportChange,
  onSelect,
  onSelectMany,
  onUpdate,
  onBatchUpdate,
  onPreview,
  onCommitPreview,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trTableRef = useRef<Konva.Transformer>(null);
  const trLinearRef = useRef<Konva.Transformer>(null);

  const [stageSize, setStageSize] = useState({ w: 900, h: 600 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  // Size the stage to its container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setStageSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Hold Space to pan (the stage becomes draggable); plain drag on empty canvas is marquee select.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      setSpaceDown(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Attach the right transformer for a single selection.
  useEffect(() => {
    const stage = stageRef.current;
    const attach = (tr: Konva.Transformer | null, id: string | null) => {
      if (!tr) return;
      const node = id ? stage?.findOne(`#${id}`) : null;
      tr.nodes(node ? [node] : []);
      tr.getLayer()?.batchDraw();
    };

    const single = selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) : undefined;
    const isTable = single && isTableShape(single);
    const isLinear = single && (single.type === "wall" || single.type === "door" || single.type === "window");

    attach(trTableRef.current, isTable ? single.id : null);
    attach(trLinearRef.current, isLinear ? single.id : null);
  }, [selectedIds, shapes]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition()!;
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };
    const newScale =
      e.evt.deltaY < 0 ? Math.min(oldScale * scaleBy, 5) : Math.max(oldScale / scaleBy, 0.2);
    onViewportChange({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // --- Marquee select (screen coordinates, drawn as an HTML overlay) ---

  const beginMarquee = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage() || spaceDown || e.evt.button !== 0) return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;
    marqueeStart.current = pos;
    setMarquee({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const moveMarquee = () => {
    const start = marqueeStart.current;
    const pos = stageRef.current?.getPointerPosition();
    if (!start || !pos) return;
    setMarquee({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    });
  };

  const endMarquee = () => {
    const start = marqueeStart.current;
    marqueeStart.current = null;
    if (!start || !marquee) {
      setMarquee(null);
      return;
    }
    setMarquee(null);

    // A near-still click on empty canvas clears the selection.
    if (marquee.w < 4 && marquee.h < 4) {
      onSelect(null);
      return;
    }

    // Select every shape whose screen-space bounding box intersects the marquee.
    const stage = stageRef.current;
    if (!stage) return;
    const hits: string[] = [];
    for (const node of stage.find(".selectable")) {
      const r = node.getClientRect();
      const intersects =
        r.x < marquee.x + marquee.w &&
        r.x + r.width > marquee.x &&
        r.y < marquee.y + marquee.h &&
        r.y + r.height > marquee.y;
      if (intersects && node.id()) hits.push(node.id());
    }
    onSelectMany(hits);
  };

  // --- Multi-drag: dragging one selected shape moves the whole selection ---

  const dragSiblings = (draggedId: string): FloorShape[] =>
    selectedIds.includes(draggedId) && selectedIds.length > 1
      ? shapes.filter((s) => selectedIds.includes(s.id) && s.id !== draggedId && s.type !== "room-outline")
      : [];

  const handleDragMove = (shape: FloorShape) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    node.position({ x: snap(node.x()), y: snap(node.y()) });

    const siblings = dragSiblings(shape.id);
    if (siblings.length === 0) return;
    const dx = node.x() - shape.x;
    const dy = node.y() - shape.y;
    const stage = node.getStage();
    for (const sib of siblings) {
      const sibNode = stage?.findOne(`#${sib.id}`);
      sibNode?.position({ x: sib.x + dx, y: sib.y + dy });
    }
    node.getLayer()?.batchDraw();
  };

  const handleDragEnd = (shape: FloorShape) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position();
    const siblings = dragSiblings(shape.id);
    if (siblings.length === 0) {
      onUpdate(shape.id, { x, y });
      return;
    }
    const dx = x - shape.x;
    const dy = y - shape.y;
    onBatchUpdate([
      { id: shape.id, updates: { x, y } },
      ...siblings.map((s) => ({ id: s.id, updates: { x: snap(s.x + dx), y: snap(s.y + dy) } })),
    ]);
  };

  const handleClick = (id: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
    onSelect(id, e.evt.shiftKey);
  };

  // Rotation-only transform for tables.
  const handleTableTransformEnd = (id: string) => (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    onUpdate(id, { x: node.x(), y: node.y(), rotation: node.rotation() });
    node.scaleX(1);
    node.scaleY(1);
  };

  // Length-stretch + rotation for walls/doors/windows.
  const handleLinearTransformEnd = (id: string) => (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    onUpdate(id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(10, Math.round(node.width() * node.scaleX())),
    } as Partial<FloorShape>);
    node.scaleX(1);
    node.scaleY(1);
  };

  // --- Dynamic grid, only lines visible in the viewport ---
  const { scale, x: vpX, y: vpY } = viewport;
  const worldMinX = -vpX / scale;
  const worldMinY = -vpY / scale;
  const worldMaxX = worldMinX + stageSize.w / scale;
  const worldMaxY = worldMinY + stageSize.h / scale;
  let gridStep = GRID;
  while (gridStep * scale < 20) gridStep *= 5;
  const gridLines: React.ReactNode[] = [];
  for (let gx = Math.floor(worldMinX / gridStep) * gridStep; gx <= worldMaxX; gx += gridStep)
    gridLines.push(<Line key={`v-${gx}`} points={[gx, worldMinY, gx, worldMaxY]} stroke="#e4e4ec" strokeWidth={1 / scale} />);
  for (let gy = Math.floor(worldMinY / gridStep) * gridStep; gy <= worldMaxY; gy += gridStep)
    gridLines.push(<Line key={`h-${gy}`} points={[worldMinX, gy, worldMaxX, gy]} stroke="#e4e4ec" strokeWidth={1 / scale} />);

  const outline = shapes.find((s) => s.type === "room-outline");

  return (
    <div ref={containerRef} className={style.wrapper} style={{ cursor: spaceDown ? "grab" : undefined }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Stage
          ref={stageRef}
          width={stageSize.w}
          height={stageSize.h}
          scaleX={scale}
          scaleY={scale}
          x={vpX}
          y={vpY}
          draggable={spaceDown}
          onWheel={handleWheel}
          onDragEnd={(e) => {
            if (e.target === stageRef.current)
              onViewportChange({ ...viewport, x: e.target.x(), y: e.target.y() });
          }}
          onMouseDown={beginMarquee}
          onMouseMove={moveMarquee}
          onMouseUp={endMarquee}
          onMouseLeave={endMarquee}
        >
          <Layer listening={false}>{gridLines}</Layer>

          <Layer>
            {/* Room boundary renders under everything else */}
            {outline && outline.type === "room-outline" && (
              <RoomOutlinePolygon
                points={outline.points}
                selected={selectedIds.includes(outline.id)}
                onClick={() => onSelect(outline.id)}
              />
            )}

            {shapes.map((shape) => {
              const selected = selectedIds.includes(shape.id);

              switch (shape.type) {
                case "rect-table":
                  return (
                    <Group
                      key={shape.id}
                      id={shape.id}
                      name="selectable"
                      x={shape.x}
                      y={shape.y}
                      rotation={shape.rotation}
                      draggable={!spaceDown}
                      onClick={handleClick(shape.id)}
                      onTap={() => onSelect(shape.id)}
                      onDragMove={handleDragMove(shape)}
                      onDragEnd={handleDragEnd(shape)}
                      onTransformEnd={handleTableTransformEnd(shape.id)}
                    >
                      {rectTableChairs(shape.width, shape.height, shape.chairsLayout)}
                      <Rect
                        width={shape.width}
                        height={shape.height}
                        fill={selected ? TABLE_FILL_SELECTED : TABLE_FILL}
                        stroke={selected ? STROKE_SELECTED : STROKE}
                        strokeWidth={2}
                        cornerRadius={4}
                      />
                      <Text
                        width={shape.width}
                        height={shape.height}
                        text={shape.tableNumber > 0 ? `#${shape.tableNumber}` : "—"}
                        align="center"
                        verticalAlign="middle"
                        fontSize={16}
                        fontStyle="bold"
                        fill={LABEL_COLOR}
                        listening={false}
                      />
                    </Group>
                  );

                case "circle-table":
                  return (
                    <Group
                      key={shape.id}
                      id={shape.id}
                      name="selectable"
                      x={shape.x}
                      y={shape.y}
                      rotation={shape.rotation}
                      draggable={!spaceDown}
                      onClick={handleClick(shape.id)}
                      onTap={() => onSelect(shape.id)}
                      onDragMove={handleDragMove(shape)}
                      onDragEnd={handleDragEnd(shape)}
                      onTransformEnd={handleTableTransformEnd(shape.id)}
                    >
                      {circleTableChairs(shape.radius, shape.chairs)}
                      <Circle
                        radius={shape.radius}
                        fill={selected ? TABLE_FILL_SELECTED : TABLE_FILL}
                        stroke={selected ? STROKE_SELECTED : STROKE}
                        strokeWidth={2}
                      />
                      <Text
                        x={-shape.radius}
                        y={-shape.radius}
                        width={shape.radius * 2}
                        height={shape.radius * 2}
                        text={shape.tableNumber > 0 ? `#${shape.tableNumber}` : "—"}
                        align="center"
                        verticalAlign="middle"
                        fontSize={16}
                        fontStyle="bold"
                        fill={LABEL_COLOR}
                        listening={false}
                      />
                    </Group>
                  );

                case "wall":
                  return (
                    <Rect
                      key={shape.id}
                      id={shape.id}
                      name="selectable"
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={WALL_THICKNESS}
                      offsetY={WALL_THICKNESS / 2}
                      rotation={shape.rotation}
                      draggable={!spaceDown}
                      fill={selected ? STROKE_SELECTED : WALL_FILL}
                      cornerRadius={2}
                      onClick={handleClick(shape.id)}
                      onTap={() => onSelect(shape.id)}
                      onDragMove={handleDragMove(shape)}
                      onDragEnd={handleDragEnd(shape)}
                      onTransformEnd={handleLinearTransformEnd(shape.id)}
                    />
                  );

                case "door":
                case "window":
                  return (
                    <Group
                      key={shape.id}
                      id={shape.id}
                      name="selectable"
                      x={shape.x}
                      y={shape.y}
                      rotation={shape.rotation}
                      draggable={!spaceDown}
                      onClick={handleClick(shape.id)}
                      onTap={() => onSelect(shape.id)}
                      onDragMove={handleDragMove(shape)}
                      onDragEnd={handleDragEnd(shape)}
                      onTransformEnd={handleLinearTransformEnd(shape.id)}
                    >
                      {shape.type === "door" ? doorGlyph(shape.width) : windowGlyph(shape.width)}
                      {selected && (
                        <Rect
                          x={-3}
                          y={-WALL_THICKNESS / 2 - 3}
                          width={shape.width + 6}
                          height={WALL_THICKNESS + 6}
                          stroke={STROKE_SELECTED}
                          strokeWidth={1.5}
                          dash={[4, 3]}
                          listening={false}
                        />
                      )}
                    </Group>
                  );

                default:
                  return null;
              }
            })}

            {/* Corner handles for the selected room outline */}
            {outline &&
              outline.type === "room-outline" &&
              selectedIds.includes(outline.id) &&
              Array.from({ length: outline.points.length / 2 }, (_, i) => (
                <Circle
                  key={`h-${i}`}
                  x={outline.points[i * 2]}
                  y={outline.points[i * 2 + 1]}
                  radius={8 / scale}
                  fill="#FDFEFF"
                  stroke={STROKE_SELECTED}
                  strokeWidth={2 / scale}
                  draggable
                  onDragMove={(e) => {
                    const pts = [...outline.points];
                    pts[i * 2] = snap(e.target.x());
                    pts[i * 2 + 1] = snap(e.target.y());
                    e.target.position({ x: pts[i * 2], y: pts[i * 2 + 1] });
                    onPreview(outline.id, { points: pts });
                  }}
                  onDragEnd={onCommitPreview}
                />
              ))}

            {/* Tables: rotate only. Walls/doors/windows: rotate + stretch along length. */}
            <Transformer ref={trTableRef} rotateEnabled enabledAnchors={[]} />
            <Transformer ref={trLinearRef} rotateEnabled enabledAnchors={["middle-left", "middle-right"]} />
          </Layer>
        </Stage>
      </div>

      {marquee && marquee.w + marquee.h > 4 && (
        <div
          className={style.marquee}
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}
    </div>
  );
}
