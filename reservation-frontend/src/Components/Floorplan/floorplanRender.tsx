import { Arc, Line, Rect } from "react-konva";

/**
 * Geometry and glyphs shared by the editor canvas (FloorplanCanvas) and the
 * read-only Floor View canvas (FloorViewCanvas), so chairs, walls, doors and
 * windows look identical in both. Konva needs literal colors (no CSS vars);
 * these mirror the purple palette in styles/_colors.css.
 */

export const WALL_THICKNESS = 8;

export const CHAIR_W = 30;
export const CHAIR_H = 8;
export const CHAIR_GAP = 4;
export const CHAIR_FILL = "#d8cbe8";
export const CHAIR_STROKE = "#9a86bf";

export const OUTLINE_STROKE = "#64748B";
export const OUTLINE_FILL = "rgba(100, 116, 139, 0.06)";
export const WALL_FILL = "#444444";
export const DOOR_FILL = "#7C3AED";
export const WINDOW_FILL = "#FDFEFF";
export const WINDOW_STROKE = "#6D28D9";

/** Chairs along each side of a rect table. counts = [top, right, bottom, left] */
export function rectTableChairs(w: number, h: number, counts: number[]) {
  const [top = 0, right = 0, bottom = 0, left = 0] = counts;
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
          fill={CHAIR_FILL}
          stroke={CHAIR_STROKE}
          strokeWidth={1}
          cornerRadius={3}
          listening={false}
        />
      );
    }
  };

  placeRow(top, w, 0, -(CHAIR_H + CHAIR_GAP), true);
  placeRow(bottom, w, 0, h + CHAIR_GAP, true);
  placeRow(left, h, -(CHAIR_H + CHAIR_GAP), 0, false);
  placeRow(right, h, w + CHAIR_GAP, 0, false);

  return chairs;
}

/** Chairs spread evenly around a circle table. */
export function circleTableChairs(radius: number, count: number) {
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

/** Closed room boundary polygon. Passive by default; the editor passes onClick + handles. */
export function RoomOutlinePolygon({
  points,
  selected = false,
  onClick,
}: {
  points: number[];
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Line
      points={points}
      closed
      fill={OUTLINE_FILL}
      stroke={selected ? "#6D28D9" : OUTLINE_STROKE}
      strokeWidth={selected ? 4 : 3}
      lineJoin="round"
      listening={!!onClick}
      hitStrokeWidth={onClick ? 16 : 0}
      onClick={onClick}
      onTap={onClick}
    />
  );
}

/**
 * Door glyph: the leaf plus its swing arc, drawn around local (0,0) so callers
 * can wrap it in a positioned/rotated Group.
 */
export function doorGlyph(width: number) {
  return (
    <>
      <Arc
        x={0}
        y={0}
        innerRadius={width}
        outerRadius={width}
        angle={90}
        rotation={-90}
        stroke={DOOR_FILL}
        strokeWidth={1.5}
        dash={[6, 4]}
        listening={false}
      />
      <Rect
        x={0}
        y={-WALL_THICKNESS / 2}
        width={width}
        height={WALL_THICKNESS}
        fill={DOOR_FILL}
        cornerRadius={2}
      />
    </>
  );
}

/** Window glyph: a light bar with a center mullion line. */
export function windowGlyph(width: number) {
  return (
    <>
      <Rect
        x={0}
        y={-WALL_THICKNESS / 2}
        width={width}
        height={WALL_THICKNESS}
        fill={WINDOW_FILL}
        stroke={WINDOW_STROKE}
        strokeWidth={1.5}
        cornerRadius={2}
      />
      <Line
        points={[0, 0, width, 0]}
        stroke={WINDOW_STROKE}
        strokeWidth={1}
        listening={false}
      />
    </>
  );
}
