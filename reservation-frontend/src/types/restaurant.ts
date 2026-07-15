import type { FloorShape } from './shapes';

// Mirrors Models.DTOs.Restaurant.RoomDto
export interface Room {
    id: string;
    name: string;
    isActive: boolean;
    restaurantId: string;
    floorPlan: Floorplan | null;

    // Derived server-side from the room's floorplan, not stored on the room itself.
    tableCount: number;
    seats: number;
}

// Mirrors Models.DTOs.Restaurant.RestaurantDto
export interface Restaurant {
    id: string;
    name: string;
    address: string | null;
    rooms: Room[];
}

export interface Floorplan {
    id: string;
    restaurantId: string;
    roomId: string;
    shapes: FloorShape[];
}

export interface CreateRestaurantPayload {
    name: string;
    address?: string | null;
}

export interface UpdateRestaurantPayload extends CreateRestaurantPayload {
    id: string;
}

export interface CreateRoomPayload {
    name: string;
    isActive: boolean;
    restaurantId: string;
}

export interface UpdateRoomPayload {
    id: string;
    name: string;
    isActive: boolean;
}
