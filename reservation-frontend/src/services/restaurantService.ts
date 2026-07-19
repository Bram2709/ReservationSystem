import axios from 'axios';
import type {
    CreateRestaurantPayload,
    Restaurant,
    RestaurantSettings,
    UpdateRestaurantPayload,
} from '../types/restaurant';

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

    static async createRestaurant(payload: CreateRestaurantPayload): Promise<Restaurant> {
        try {
            const response = await axios.post<Restaurant>('/restaurant', payload);
            return response.data;
        } catch (error) {
            console.error("Failed to create restaurant:", error);
            throw error;
        }
    }

    static async updateRestaurant(payload: UpdateRestaurantPayload): Promise<Restaurant> {
        try {
            const response = await axios.put<Restaurant>(`/restaurant/${payload.id}`, payload);
            return response.data;
        } catch (error) {
            console.error("Failed to update restaurant:", error);
            throw error;
        }
    }

    static async updateSettings(id: string, settings: RestaurantSettings): Promise<Restaurant> {
        try {
            const response = await axios.put<Restaurant>(`/restaurant/${id}/settings`, settings);
            return response.data;
        } catch (error) {
            console.error("Failed to update restaurant settings:", error);
            throw error;
        }
    }

    static async deleteRestaurant(id: string): Promise<void> {
        try {
            await axios.delete(`/restaurant/${id}`);
        } catch (error) {
            console.error("Failed to delete restaurant:", error);
            throw error;
        }
    }
}
