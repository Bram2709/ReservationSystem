import { Stage, Layer, Rect, Circle, Group, Text } from "react-konva";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import type { FloorplanTable } from "../../../types/restaurant";
import style from "./FloorViewCanvas.module.css";

const WALL_THICKNESS = 8;
const CHAIR_W = 30;
const CHAIR_H = 8;
const CHAIR_GAP = 4;
const CHAIR_FILL = "#d8cbe8";
const CHAIR_STROKE = "#9a86bf";

// Palette (mirrors _colors.css; Konva needs literal colors, not CSS vars).
const FREE_FILL = "#E7F6EF";
const FREE_STROKE = "#10B981";
const OCCUPIED_FILL = "#EDE4F7";
const OCCUPIED_STROKE = "#7C3AED";
const SELECTED_STROKE = "#6D28D9";
const TEXT_COLOR = "#1D1A24";

/** Chairs on each side of a rect table. counts = [top, right, bottom, left] */
function rectChairs(w: number, h: number, counts: number[]) {
  const [top = 0, right = 0, bottom = 0, left = 0] = counts;
  const nodes: React.ReactNode[] = [];
  const row = (n: number, length: number, xOff: number, yFixed: number, horizontal: boolean) => {
    if (n <= 0) return;
    const spacing = length / n;
    for (let i = 0; i < n; i++) {
      const along = spacing * i + spacing / 2;
      nodes.push(
        <Rect
          key={`${xOff}-${yFixed}-${i}`}
          x={horizontal ? xOff + along - CHAIR_W / 2 : xOff}
          y={horizontal ? yFixed : yFixed + along - CHAIR_W / 2}
          width={horizontal ? CHAIR_W : CHAIR_H}
          height={horizontal ? CHAIR_H : CHAIR_W}
          fill={CHAIR_FILL} stroke={CHAIR_STROKE} strokeWidth={1} cornerRadius={3} listening={false}
        />
      );
    }
  };
  row(top, w, 0, -(CHAIR_H + CHAIR_GAP), true);
  row(bottom, w, 0, h + CHAIR_GAP, true);
  row(left, h, -(CHAIR_H + CHAIR_GAP), 0, false);
  row(right, h, w + CHAIR_GAP, 0, false);
  return nodes;
}

function circleChairs(radius: number, count: number) {
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const cx = Math.cos(angle) * (radius + CHAIR_GAP + CHAIR_H / 2);
    const cy = Math.sin(angle) * (radius + CHAIR_GAP + CHAIR_H / 2);
    nodes.push(
      <Rect
        key={`c${i}`} x={cx - CHAIR_W / 2} y={cy - CHAIR_H / 2}
        width={CHAIR_W} height={CHAIR_H}
        rotation={(angle * 180) / Math.PI + 90}
        offsetX={CHAIR_W / 2} offsetY={CHAIR_H / 2}
        fill={CHAIR_FILL} stroke={CHAIR_STROKE} strokeWidth={1} cornerRadius={3} listening={false}
      />
    );
  }
  return nodes;
}

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
            {tables.map((t) => {
              if (t.type === "wall") {
                return (
                  <Rect
                    key={t.id}
                    x={t.x} y={t.y} width={t.width} height={WALL_THICKNESS}
                    offsetY={WALL_THICKNESS / 2} rotation={t.rotation}
                    fill="#444" cornerRadius={2} listening={false}
                  />
                );
              }
              if (t.type !== "rect-table" && t.type !== "circle-table") return null;

              const occupied = occupiedTableIds.has(t.id);
              const selected = selectedTableId === t.id;
              const fill = occupied ? OCCUPIED_FILL : FREE_FILL;
              const stroke = selected ? SELECTED_STROKE : occupied ? OCCUPIED_STROKE : FREE_STROKE;
              const strokeWidth = selected ? 3 : 2;

              return (
                <Group
                  key={t.id}
                  x={t.x} y={t.y} rotation={t.rotation}
                  onClick={() => onSelectTable(t.id)}
                  onTap={() => onSelectTable(t.id)}
                  onMouseEnter={() => { const s = stageRef.current; if (s) s.container().style.cursor = "pointer"; }}
                  onMouseLeave={() => { const s = stageRef.current; if (s) s.container().style.cursor = "default"; }}
                >
                  {t.type === "rect-table" ? (
                    <>
                      {rectChairs(t.width, t.height, t.chairsLayout)}
                      <Rect width={t.width} height={t.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={4} />
                      <Text
                        width={t.width} height={t.height}
                        text={t.tableNumber ? `#${t.tableNumber}` : ""}
                        align="center" verticalAlign="middle"
                        fontSize={18} fontStyle="bold" fill={TEXT_COLOR} listening={false}
                      />
                    </>
                  ) : (
                    <>
                      {circleChairs(t.radius, t.chairs)}
                      <Circle radius={t.radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                      <Text
                        x={-t.radius} y={-t.radius} width={t.radius * 2} height={t.radius * 2}
                        text={t.tableNumber ? `#${t.tableNumber}` : ""}
                        align="center" verticalAlign="middle"
                        fontSize={18} fontStyle="bold" fill={TEXT_COLOR} listening={false}
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
