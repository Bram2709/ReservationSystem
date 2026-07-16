import { Stage, Layer, Rect, Circle, Group, Text } from "react-konva";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { FloorplanTable } from "../../../types/restaurant";
import {
  WALL_THICKNESS,
  WALL_FILL,
  rectTableChairs,
  circleTableChairs,
  RoomOutlinePolygon,
  doorGlyph,
  windowGlyph,
} from "../floorplanRender";
import style from "./FloorViewCanvas.module.css";

// Occupancy palette (mirrors _colors.css; Konva needs literal colors).
const FREE_FILL = "#E7F6EF";
const FREE_STROKE = "#10B981";
const OCCUPIED_FILL = "#EDE4F7";
const OCCUPIED_STROKE = "#7C3AED";
const SELECTED_STROKE = "#6D28D9";
const TEXT_COLOR = "#1D1A24";

interface Props {
  tables: FloorplanTable[];
  selectedTableId: string | null;
  occupiedTableIds: Set<string>;
  onSelectTable: (id: string) => void;
}

export function FloorViewCanvas({ tables, selectedTableId, occupiedTableIds, onSelectTable }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.floor(width), h: Math.floor(height) });
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
    const mousePointTo = { x: (pointer.x - viewport.x) / oldScale, y: (pointer.y - viewport.y) / oldScale };
    const newScale = e.evt.deltaY < 0 ? Math.min(oldScale * scaleBy, 5) : Math.max(oldScale / scaleBy, 0.2);
    setViewport({ scale: newScale, x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  const outline = tables.find((t) => t.type === "room-outline");

  return (
    <div ref={containerRef} className={style.wrapper}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          x={viewport.x}
          y={viewport.y}
          draggable
          onWheel={handleWheel}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) setViewport((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
          }}
        >
          <Layer>
            {/* Structure renders passively underneath the tables */}
            {outline && <RoomOutlinePolygon points={outline.points} />}

            {tables.map((t) => {
              switch (t.type) {
                case "wall":
                  return (
                    <Rect
                      key={t.id}
                      x={t.x}
                      y={t.y}
                      width={t.width}
                      height={WALL_THICKNESS}
                      offsetY={WALL_THICKNESS / 2}
                      rotation={t.rotation}
                      fill={WALL_FILL}
                      cornerRadius={2}
                      listening={false}
                    />
                  );
                case "door":
                case "window":
                  return (
                    <Group key={t.id} x={t.x} y={t.y} rotation={t.rotation} listening={false}>
                      {t.type === "door" ? doorGlyph(t.width) : windowGlyph(t.width)}
                    </Group>
                  );
                default:
                  return null;
              }
            })}

            {tables.map((t) => {
              if (t.type !== "rect-table" && t.type !== "circle-table") return null;

              const occupied = occupiedTableIds.has(t.id);
              const selected = selectedTableId === t.id;
              const fill = occupied ? OCCUPIED_FILL : FREE_FILL;
              const stroke = selected ? SELECTED_STROKE : occupied ? OCCUPIED_STROKE : FREE_STROKE;
              const strokeWidth = selected ? 3 : 2;

              return (
                <Group
                  key={t.id}
                  x={t.x}
                  y={t.y}
                  rotation={t.rotation}
                  onClick={() => onSelectTable(t.id)}
                  onTap={() => onSelectTable(t.id)}
                  onMouseEnter={() => { const s = stageRef.current; if (s) s.container().style.cursor = "pointer"; }}
                  onMouseLeave={() => { const s = stageRef.current; if (s) s.container().style.cursor = "default"; }}
                >
                  {t.type === "rect-table" ? (
                    <>
                      {rectTableChairs(t.width, t.height, t.chairsLayout)}
                      <Rect width={t.width} height={t.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={4} />
                      <Text
                        width={t.width}
                        height={t.height}
                        text={t.tableNumber ? `#${t.tableNumber}` : ""}
                        align="center"
                        verticalAlign="middle"
                        fontSize={18}
                        fontStyle="bold"
                        fill={TEXT_COLOR}
                        listening={false}
                      />
                    </>
                  ) : (
                    <>
                      {circleTableChairs(t.radius, t.chairs)}
                      <Circle radius={t.radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                      <Text
                        x={-t.radius}
                        y={-t.radius}
                        width={t.radius * 2}
                        height={t.radius * 2}
                        text={t.tableNumber ? `#${t.tableNumber}` : ""}
                        align="center"
                        verticalAlign="middle"
                        fontSize={18}
                        fontStyle="bold"
                        fill={TEXT_COLOR}
                        listening={false}
                      />
                    </>
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
