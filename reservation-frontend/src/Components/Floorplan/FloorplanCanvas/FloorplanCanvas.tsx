import {
  Stage,
  Layer,
  Rect,
  Circle,
  Transformer,
  Line,
  Group
} from "react-konva";
import { useRef, useEffect, useState } from "react";
import type { FloorShape } from "../../../types/shapes";
import Konva from "konva";
import style from "./FloorplanCanvas.module.css";

const GRID = 10;

const VIRTUAL_W = 900;
const VIRTUAL_H = 600;

const WALL_THICKNESS = 8;

const CHAIR_W = 30;
const CHAIR_H = 8;
const CHAIR_GAP = 4; // gap between table edge and chair
const CHAIR_FILL = "#c8a97d";
const CHAIR_STROKE = "#7a5c30";

/** Chairs on each side of a rect table. counts = [top, right, bottom, left] */
function rectTableChairs(w: number, h: number, counts: [number, number, number, number]) {
  const [top, right, bottom, left] = counts;
  const chairs: React.ReactNode[] = [];

  const placeRow = (n: number, length: number, xOffset: number, yFixed: number, horizontal: boolean) => {
    if (n <= 0) return;
    const spacing = length / n;
    for (let i = 0; i < n; i++) {
      const along = spacing * i + spacing / 2;
      chairs.push(
        <Rect
          key={`${xOffset}-${yFixed}-${i}`}
          x={horizontal ? xOffset + along - CHAIR_W / 2 : xOffset}
          y={horizontal ? yFixed : yFixed + along - CHAIR_W / 2}
          width={horizontal ? CHAIR_W : CHAIR_H}
          height={horizontal ? CHAIR_H : CHAIR_W}
          fill={CHAIR_FILL} stroke={CHAIR_STROKE} strokeWidth={1} cornerRadius={3} listening={false}
        />
      );
    }
  };

  placeRow(top,    w, 0,                     -(CHAIR_H + CHAIR_GAP), true);
  placeRow(bottom, w, 0,                     h + CHAIR_GAP,          true);
  placeRow(left,   h, -(CHAIR_H + CHAIR_GAP), 0,                     false);
  placeRow(right,  h, w + CHAIR_GAP,          0,                     false);

  return chairs;
}

/** Chairs evenly around a circle table */
function circleTableChairs(radius: number, count: number) {
  const chairs: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const cx = Math.cos(angle) * (radius + CHAIR_GAP + CHAIR_H / 2);
    const cy = Math.sin(angle) * (radius + CHAIR_GAP + CHAIR_H / 2);
    chairs.push(
      <Rect
        key={`c${i}`}
        x={cx - CHAIR_W / 2}
        y={cy - CHAIR_H / 2}
        width={CHAIR_W}
        height={CHAIR_H}
        rotation={(angle * 180) / Math.PI + 90}
        offsetX={CHAIR_W / 2}
        offsetY={CHAIR_H / 2}
        fill={CHAIR_FILL}
        stroke={CHAIR_STROKE}
        strokeWidth={1}
        cornerRadius={3}
        listening={false}
      />
    );
  }
  return chairs;
}

const snapToGrid = (value: number, grid = GRID) =>
  Math.round(value / grid) * grid;

interface Props {
  shapes: FloorShape[];
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FloorShape>) => void;
  onBatchUpdate: (updates: { id: string; updates: Partial<FloorShape> }[]) => void;
}

export function FloorplanCanvas({
  shapes,
  selectedId,
  selectedIds,
  onSelect,
  onMultiSelect,
  onUpdate,
  onBatchUpdate
}: Props) {
  const trTableRef = useRef<any>(null);
  const trWallRef = useRef<any>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: VIRTUAL_W, h: VIRTUAL_H });
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Observe the OUTER div (no canvas child) so the canvas can never
    // inflate contentRect and cause a grow loop.
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0)
        setStageSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, 5)
      : Math.max(oldScale / scaleBy, 0.2);
    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // attach the correct transformer based on selected shape type
  useEffect(() => {
    const selectedShape = shapes.find(s => s.id === selectedId);
    const isTable = selectedShape?.type === "rect-table" || selectedShape?.type === "circle-table";
    const isWall = selectedShape?.type === "wall";

    const attachTo = (tr: any, id: string) => {
      const node = tr?.getStage().findOne(`#${id}`);
      if (node) { tr.nodes([node]); tr.getLayer().batchDraw(); }
    };
    const detach = (tr: any) => {
      if (tr) { tr.nodes([]); tr.getLayer()?.batchDraw(); }
    };

    if (selectedId && isTable) {
      attachTo(trTableRef.current, selectedId);
      detach(trWallRef.current);
    } else if (selectedId && isWall) {
      attachTo(trWallRef.current, selectedId);
      detach(trTableRef.current);
    } else {
      detach(trTableRef.current);
      detach(trWallRef.current);
    }
  }, [selectedId, shapes]);

  // Map wallId -> { label, sibling wall ids } for room membership
  const wallToRoom = new Map<string, string>();
  const wallToSiblings = new Map<string, string[]>();
  shapes.forEach(s => {
    if (s.type === "room") {
      s.wallIds.forEach(wid => {
        wallToRoom.set(wid, s.label ?? s.id);
        wallToSiblings.set(wid, s.wallIds.filter(id => id !== wid));
      });
    }
  });

  // Dynamic grid: only render lines that are visible in the current viewport
  const { scale, x: vpX, y: vpY } = viewport;
  const { w: STAGE_W, h: STAGE_H } = stageSize;
  const worldMinX = -vpX / scale;
  const worldMinY = -vpY / scale;
  const worldMaxX = worldMinX + STAGE_W / scale;
  const worldMaxY = worldMinY + STAGE_H / scale;
  let gridStep = GRID;
  while (gridStep * scale < 20) gridStep *= 5;
  const gridStartX = Math.floor(worldMinX / gridStep) * gridStep;
  const gridStartY = Math.floor(worldMinY / gridStep) * gridStep;
  const gridLines: React.ReactNode[] = [];
  for (let gx = gridStartX; gx <= worldMaxX; gx += gridStep)
    gridLines.push(<Line key={`v-${gx}`} points={[gx, worldMinY, gx, worldMaxY]} stroke="#e0e0e0" strokeWidth={1 / scale} />);
  for (let gy = gridStartY; gy <= worldMaxY; gy += gridStep)
    gridLines.push(<Line key={`h-${gy}`} points={[worldMinX, gy, worldMaxX, gy]} stroke="#e0e0e0" strokeWidth={1 / scale} />);

  return (
    // Outer div: purely CSS-sized, observed for dimensions
    <div ref={containerRef} className={style.wrapper}>
      {/* Inner div: absolutely fills the outer div, contains the Stage */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Stage
          ref={stageRef}
          width={stageSize.w}
          height={stageSize.h}
      scaleX={scale}
      scaleY={scale}
      x={vpX}
      y={vpY}
      draggable
      onWheel={handleWheel}
      onDragEnd={(e) => {
        if (e.target === stageRef.current)
          setViewport(v => ({ ...v, x: e.target.x(), y: e.target.y() }));
      }}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      {/* Grid layer – behind everything, non-interactive */}
      <Layer listening={false}>
        {gridLines}
      </Layer>
      <Layer>
        {shapes.map(shape => {
          switch (shape.type) {
            case "rect-table":
              return (
                <Group
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  rotation={shape.rotation}
                  draggable
                  onDragMove={(e) => {
                    const pos = e.target.position();
                    e.target.position({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) });
                  }}
                  onClick={() => onSelect(shape.id)}
                  onDragEnd={(e) => {
                    const { x, y } = e.target.position();
                    onUpdate(shape.id, { x, y });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    onUpdate(shape.id, { x: node.x(), y: node.y(), rotation: node.rotation() });
                    node.scaleX(1); node.scaleY(1);
                  }}
                >
                  {rectTableChairs(shape.width, shape.height, shape.chairsLayout)}
                  <Rect
                    width={shape.width}
                    height={shape.height}
                    fill={shape.id === selectedId ? "#bcd4ff" : "#e5e5e5"}
                    stroke="black"
                    strokeWidth={2}
                  />
                </Group>
              );

            case "circle-table":
              return (
                <Group
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  rotation={shape.rotation}
                  draggable
                  onDragMove={(e) => {
                    const pos = e.target.position();
                    e.target.position({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) });
                  }}
                  onClick={() => onSelect(shape.id)}
                  onDragEnd={(e) => {
                    const { x, y } = e.target.position();
                    onUpdate(shape.id, { x, y });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    onUpdate(shape.id, { x: node.x(), y: node.y(), rotation: node.rotation() });
                    node.scaleX(1); node.scaleY(1);
                  }}
                >
                  {circleTableChairs(shape.radius, shape.chairs)}
                  <Circle
                    radius={shape.radius}
                    fill={shape.id === selectedId ? "#ffe0b3" : "#ffeccc"}
                    stroke="black"
                    strokeWidth={2}
                  />
                </Group>
              );

            case "wall": {
              const inRoom = wallToRoom.has(shape.id);
              const isMultiSelected = selectedIds.includes(shape.id);
              const wallFill = isMultiSelected
                ? "#5b8dd9"
                : shape.id === selectedId
                ? "#777"
                : "#444";
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={WALL_THICKNESS}
                  offsetY={WALL_THICKNESS / 2}
                  rotation={shape.rotation}
                  draggable
                  fill={wallFill}
                  stroke={inRoom ? "#3b82f6" : undefined}
                  strokeWidth={inRoom ? 2 : 0}
                  cornerRadius={2}
                  onClick={(e) => {
                    if (e.evt.shiftKey) {
                      onMultiSelect(shape.id);
                    } else {
                      onSelect(shape.id);
                    }
                  }}
                  onDragMove={(e) => {
                    // Snap dragged wall to grid in world space
                    const node = e.target;
                    const pos = node.position();
                    const snappedX = snapToGrid(pos.x);
                    const snappedY = snapToGrid(pos.y);
                    node.position({ x: snappedX, y: snappedY });
                    // Move sibling walls in lockstep
                    const siblings = wallToSiblings.get(shape.id);
                    if (!siblings || siblings.length === 0) return;
                    const dx = snappedX - shape.x;
                    const dy = snappedY - shape.y;
                    const stage = node.getStage();
                    if (!stage) return;
                    siblings.forEach(sibId => {
                      const sibNode = stage.findOne(`#${sibId}`);
                      const sibShape = shapes.find(s => s.id === sibId);
                      if (sibNode && sibShape)
                        sibNode.position({ x: sibShape.x + dx, y: sibShape.y + dy });
                    });
                    node.getLayer()?.batchDraw();
                  }}
                  onDragEnd={(e) => {
                    const { x: newX, y: newY } = e.target.position();
                    const siblings = wallToSiblings.get(shape.id);
                    if (siblings && siblings.length > 0) {
                      const dx = newX - shape.x;
                      const dy = newY - shape.y;
                      const siblingShapes = shapes.filter(
                        s => s.type === "wall" && siblings.includes(s.id)
                      );
                      onBatchUpdate([
                        { id: shape.id, updates: { x: newX, y: newY } },
                        ...siblingShapes.map(s => ({
                          id: s.id,
                          updates: { x: snapToGrid(s.x + dx), y: snapToGrid(s.y + dy) }
                        }))
                      ]);
                    } else {
                      onUpdate(shape.id, { x: newX, y: newY });
                    }
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    onUpdate(shape.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(10, node.width() * node.scaleX()),
                      rotation: node.rotation()
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
              );
            }

            case "room":
              return null;

            default:
              return null;
          }
        })}

        {/* Transformer for tables – rotate only, no resize handles */}
        <Transformer
          ref={trTableRef}
          rotateEnabled={true}
          enabledAnchors={[]}
        />

        {/* Transformer for walls – only stretch along length, no thickness change */}
        <Transformer
          ref={trWallRef}
          rotateEnabled={true}
          enabledAnchors={["middle-left", "middle-right"]}
        />
      </Layer>
    </Stage>
      </div>
    </div>
  );
}