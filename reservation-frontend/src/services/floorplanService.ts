import axios from 'axios';
import type { FloorShape } from '../types/shapes';
import type { FloorplanSaveResult, FloorplanTable } from '../types/restaurant';

/**
 * Persisted floorplan rows -> canvas shapes. The editor reads from the same cached
 * restaurant tree as every other page (rooms[].floorPlan.shapes); rows with an
 * unrecognized type (legacy test data) are skipped rather than crashing the canvas.
 */
export function tablesToShapes(tables: FloorplanTable[]): FloorShape[] {
    const shapes: FloorShape[] = [];

    for (const t of tables) {
        const base = { id: t.id, x: t.x, y: t.y, rotation: t.rotation };

        switch (t.type) {
            case "rect-table": {
                const [top = 0, right = 0, bottom = 0, left = 0] = t.chairsLayout;
                shapes.push({
                    ...base,
                    type: "rect-table",
                    width: t.width,
                    height: t.height,
                    tableNumber: t.tableNumber,
                    chairs: t.chairs,
                    chairsLayout: [top, right, bottom, left],
                    minSeats: t.minSeats,
                    maxSeats: t.maxSeats,
                });
                break;
            }
            case "circle-table":
                shapes.push({
                    ...base,
                    type: "circle-table",
                    radius: t.radius,
                    tableNumber: t.tableNumber,
                    chairs: t.chairs,
                    minSeats: t.minSeats,
                    maxSeats: t.maxSeats,
                });
                break;
            case "wall":
                shapes.push({ ...base, type: "wall", width: t.width });
                break;
            case "room-outline":
                shapes.push({ ...base, type: "room-outline", points: t.points });
                break;
            case "door":
                shapes.push({ ...base, type: "door", width: t.width });
                break;
            case "window":
                shapes.push({ ...base, type: "window", width: t.width });
                break;
            default:
                break;
        }
    }

    return shapes;
}

/** Canvas shapes -> the save payload the backend's TableShapeDto expects. */
function toPayload(shapes: FloorShape[]) {
    return shapes.map((s) => ({
        id: s.id,
        type: s.type,
        x: Math.round(s.x),
        y: Math.round(s.y),
        rotation: Math.round(s.rotation),
        tableNumber: "tableNumber" in s ? s.tableNumber : 0,
        chairs: "chairs" in s ? s.chairs : 0,
        chairsLayout: s.type === "rect-table" ? s.chairsLayout : [],
        width: "width" in s ? Math.round(s.width) : 0,
        height: s.type === "rect-table" ? Math.round(s.height) : 0,
        radius: s.type === "circle-table" ? Math.round(s.radius) : 0,
        minSeats: "minSeats" in s ? s.minSeats : 0,
        maxSeats: "maxSeats" in s ? s.maxSeats : 0,
        points: s.type === "room-outline" ? s.points.map(Math.round) : [],
    }));
}

export class FloorplanService {
    static async saveFloorplan(shapes: FloorShape[], roomId: string): Promise<FloorplanSaveResult> {
        try {
            const response = await axios.post<FloorplanSaveResult>('/floorplan', {
                roomId,
                shapes: toPayload(shapes),
            });
            return response.data;
        } catch (error) {
            console.error("Failed to save floorplan:", error);
            throw error;
        }
    }
}
