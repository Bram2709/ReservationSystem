import axios from 'axios';

export class RoomService {
    static async createRoom(name: string, active: boolean, restaurantId: string) {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('isActive', active.toString());
            formData.append('restaurantId', restaurantId);
            const response = await axios.post('/room', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error creating room:", error);
            throw error;
        }
    }
}