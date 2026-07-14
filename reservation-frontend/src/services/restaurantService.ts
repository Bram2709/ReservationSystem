import axios from 'axios';
import type { Restaurant } from '../types/restaurant';

export class RestaurantService {
    static async getRestaurants(): Promise<Restaurant[]> {
        try {
            const response = await axios.get<Restaurant[]>('/restaurant');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch restaurants:", error);
            throw error;
        }
    }

    static async createRestaurant(name: string): Promise<Restaurant> {
        try {
            const fromData = new FormData();
            fromData.append('name', name);
            const response = await axios.post('/restaurant', fromData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Failed to create restaurant:", error);
            throw error;
        }
    }
}