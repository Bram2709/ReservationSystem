import axios from 'axios';
import type { CreateRoomPayload, Room, UpdateRoomPayload } from '../types/restaurant';

export class RoomService {
    static async getRooms(restaurantId?: string): Promise<Room[]> {
        try {
            const response = await axios.get<Room[]>('/room', {
                params: { restaurantId },
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
            throw error;
        }
    }

    static async createRoom(payload: CreateRoomPayload): Promise<Room> {
        try {
            const response = await axios.post<Room>('/room', payload);
            return response.data;
        } catch (error) {
            console.error("Failed to create room:", error);
            throw error;
        }
    }

    static async updateRoom(payload: UpdateRoomPayload): Promise<Room> {
        try {
            const response = await axios.put<Room>(`/room/${payload.id}`, payload);
            return response.data;
        } catch (error) {
            console.error("Failed to update room:", error);
            throw error;
        }
    }

    static async deleteRoom(id: string): Promise<void> {
        try {
            await axios.delete(`/room/${id}`);
        } catch (error) {
            console.error("Failed to delete room:", error);
            throw error;
        }
    }
}
