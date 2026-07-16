export type ShapeType =
  | "rect-table"
  | "circle-table"
  | "wall"
  | "room-outline"
  | "door"
  | "window";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
}

export interface RectTableShape extends BaseShape {
  type: "rect-table";
  width: number;
  height: number;
  tableNumber: number;
  /** total chair glyphs drawn around the table */
  chairs: number;
  /** chair distribution per side: [top, right, bottom, left] */
  chairsLayout: [number, number, number, number];
  minSeats: number;
  maxSeats: number;
}

export interface CircleTableShape extends BaseShape {
  type: "circle-table";
  radius: number;
  tableNumber: number;
  chairs: number;
  minSeats: number;
  maxSeats: number;
}

export interface WallShape extends BaseShape {
  type: "wall";
  width: number;
}

/**
 * The room boundary: a closed polygon stored as flattened absolute vertices
 * [x1,y1,x2,y2,...]. Reshaped by dragging its corner handles; x/y stay 0.
 */
export interface RoomOutlineShape extends BaseShape {
  type: "room-outline";
  points: number[];
}

export interface DoorShape extends BaseShape {
  type: "door";
  width: number;
}

export interface WindowShape extends BaseShape {
  type: "window";
  width: number;
}

export type TableShape = RectTableShape | CircleTableShape;

export type FloorShape =
  | TableShape
  | WallShape
  | RoomOutlineShape
  | DoorShape
  | WindowShape;

export function isTableShape(shape: FloorShape): shape is TableShape {
  return shape.type === "rect-table" || shape.type === "circle-table";
}
