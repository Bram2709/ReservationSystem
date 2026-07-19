import axios from 'axios';
import type {
    CreateReservationPayload,
    Customer,
    Reservation,
    ReservationFilters,
    ReservationStatus,
    TableAvailability,
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

    static async getAvailableTables(reservationId: string): Promise<TableAvailability[]> {
        try {
            const response = await axios.get<TableAvailability[]>(`/reservation/${reservationId}/available-tables`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch available tables:", error);
            throw error;
        }
    }

    static async updateStatus(reservationId: string, status: ReservationStatus): Promise<Reservation> {
        try {
            const response = await axios.put<Reservation>(`/reservation/${reservationId}/status`, { status });
            return response.data;
        } catch (error) {
            console.error("Failed to update reservation status:", error);
            throw error;
        }
    }

    static async getCustomers(): Promise<Customer[]> {
        try {
            const response = await axios.get<Customer[]>('/customer');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch customers:", error);
            throw error;
        }
    }

    /** Pass null to unassign the reservation from its table. */
    static async assignTable(reservationId: string, tableId: string | null): Promise<Reservation> {
        try {
            const response = await axios.put<Reservation>(`/reservation/${reservationId}/table`, { tableId });
            return response.data;
        } catch (error) {
            console.error("Failed to assign table:", error);
            throw error;
        }
    }
}
