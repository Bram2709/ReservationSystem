import axios from 'axios';
import type {
    CreateReservationPayload,
    Reservation,
    ReservationFilters,
    UpdateReservationPayload,
} from '../types/reservation';

export class ReservationService {
    static async getReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
        try {
            const response = await axios.get<Reservation[]>('/reservation', {
                // Axios drops undefined params, so unset filters are simply not sent.
                params: {
                    restaurantId: filters.restaurantId,
                    from: filters.from,
                    to: filters.to,
                    timeFrame: filters.timeFrame,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch reservations:", error);
            throw error;
        }
    }

    static async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
        try {
            const response = await axios.post<Reservation>('/reservation', payload);
            return response.data;
        } catch (error) {
            console.error("Failed to create reservation:", error);
            throw error;
        }
    }

    static async updateReservation(payload: UpdateReservationPayload): Promise<Reservation> {
        try {
            const response = await axios.put<Reservation>(`/reservation/${payload.id}`, payload);
            return response.data;
        } catch (error) {
            console.error("Failed to update reservation:", error);
            throw error;
        }
    }

    static async deleteReservation(id: string): Promise<void> {
        try {
            await axios.delete(`/reservation/${id}`);
        } catch (error) {
            console.error("Failed to delete reservation:", error);
            throw error;
        }
    }
}
