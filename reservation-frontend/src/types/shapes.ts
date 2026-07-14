export type ShapeType = "rect-table" | "circle-table" | "wall" | "room";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  tableNumber?: number;
  zIndex?: number;
}

export interface RectTableShape extends BaseShape {
  type: "rect-table";
  width: number;
  height: number;
  /** total chair count */
  chairs: number;
  /** chair distribution per side: [top, right, bottom, left] */
  chairsLayout: [number, number, number, number];
}

export interface CircleTableShape extends BaseShape {
  type: "circle-table";
  radius: number;
  chairs: number;
}

export interface WallShape extends BaseShape {
  type: "wall";
  width: number;
}

export interface RoomShape extends BaseShape {
  id: string;
  type: "room";
  wallIds: string[];
  label?: string;
}

export type FloorShape = RectTableShape | CircleTableShape | WallShape | RoomShape;
