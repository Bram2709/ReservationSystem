import axios from 'axios';
import type { TimeFrame } from '../types/reservation';

export interface PublicService {
    timeFrame: TimeFrame;
    start: number;
    end: number;
}

export interface PublicRestaurant {
    name: string;
    address: string | null;
    services: PublicService[];
}

export interface PublicAvailability {
    timeFrame: TimeFrame;
    /** local "HH:mm" start times */
    slots: string[];
}

export interface PublicBookingRequest {
    name: string;
    email: string;
    phoneNumber: string;
    description: string;
    partySize: number;
    timeFrame: TimeFrame;
    reservationDateTime: string;
}

export interface PublicBookingResult {
    reservationId: string;
    restaurantName: string;
    reservationDateTime: string;
    partySize: number;
}

export class PublicBookingService {
    static async getRestaurant(restaurantId: string): Promise<PublicRestaurant> {
        const response = await axios.get<PublicRestaurant>(`/public/restaurant/${restaurantId}`);
        return response.data;
    }

    static async getAvailability(restaurantId: string, date: string, partySize: number): Promise<PublicAvailability[]> {
        const response = await axios.get<PublicAvailability[]>(
            `/public/restaurant/${restaurantId}/availability`,
            { params: { date, partySize } }
        );
        return response.data;
    }

    static async book(restaurantId: string, request: PublicBookingRequest): Promise<PublicBookingResult> {
        const response = await axios.post<PublicBookingResult>(`/public/restaurant/${restaurantId}/book`, request);
        return response.data;
    }
}
