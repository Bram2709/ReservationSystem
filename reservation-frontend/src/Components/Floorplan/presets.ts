/**
 * Table presets offered in the editor's Add panel. Seat counts are accurate per
 * preset (the old editor's "2p" and "4p" cards created identical 6-chair tables).
 */
export interface TablePreset {
    id: string;
    label: string;
    /** shown on the preset card, e.g. "seats 2–4" */
    seatsLabel: string;
    kind: "rect" | "circle";
    minSeats: number;
    maxSeats: number;
    /** circle only */
    radius?: number;
    /** rect only */
    width?: number;
    height?: number;
    /** rect only: chairs per side [top, right, bottom, left] */
    chairsLayout?: [number, number, number, number];
    /** circle only: chairs spread evenly around */
    chairs?: number;
}

export const TABLE_PRESETS: TablePreset[] = [
    { id: "round-2", label: "Round", seatsLabel: "2 seats", kind: "circle", radius: 35, chairs: 2, minSeats: 1, maxSeats: 2 },
    { id: "round-4", label: "Round", seatsLabel: "4 seats", kind: "circle", radius: 45, chairs: 4, minSeats: 2, maxSeats: 4 },
    { id: "round-6", label: "Round", seatsLabel: "6 seats", kind: "circle", radius: 55, chairs: 6, minSeats: 4, maxSeats: 6 },
    { id: "square-4", label: "Square", seatsLabel: "4 seats", kind: "rect", width: 100, height: 100, chairsLayout: [1, 1, 1, 1], minSeats: 2, maxSeats: 4 },
    { id: "rect-6", label: "Rectangle", seatsLabel: "6 seats", kind: "rect", width: 160, height: 100, chairsLayout: [2, 1, 2, 1], minSeats: 4, maxSeats: 6 },
    { id: "rect-8", label: "Banquet", seatsLabel: "8 seats", kind: "rect", width: 220, height: 100, chairsLayout: [3, 1, 3, 1], minSeats: 6, maxSeats: 8 },
];
