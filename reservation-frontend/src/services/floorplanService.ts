import axios from 'axios';
import type { FloorShape } from '../types/shapes';
import type { Floorplan } from '../types/restaurant';

/** Serialize shapes for backend — do not coerce `chairs` here. */
function serializeShapes(shapes: FloorShape[]) {
    return shapes;
}

export class FloorplanService {
    static async getFloorplan(roomId: string): Promise<FloorShape[]> {
        try {
            const response = await axios.get<Floorplan>(`/floorplan/${roomId}`);

            // Response may be a single object or an array (regression from backend).
            let raw: any = response.data ?? {};
            if (Array.isArray(raw)) {
                // try to find matching roomId, otherwise take the first element
                raw = raw.find((r: any) => r?.roomId === roomId) ?? raw[0] ?? {};
            }

            // Support backend responses that may use `shapes` or `tables` as the payload key.
            const arr = raw.shapes ?? raw.tables ?? [];

            return arr as FloorShape[];
        } catch (error) {
            console.error("Failed to load floorplan:", error);
            throw error;
        }
    }

    static async saveFloorplan(floorplanData: FloorShape[], roomId: string): Promise<Floorplan> {
        try {
            const response = await axios.post('/floorplan', {
                roomId,
                shapes: serializeShapes(floorplanData),
            });
            return response.data;
        } catch (error) {
            console.error("Failed to save floorplan:", error);
            throw error;
        }
    }

    static async patchShape(shapeId: string, updates: Partial<FloorShape>): Promise<void> {
        try {
            await axios.patch(`/floorplan/shape/${shapeId}`, updates);
        } catch (error) {
            console.error("Failed to update shape:", error);
            throw error;
        }
    }
}
