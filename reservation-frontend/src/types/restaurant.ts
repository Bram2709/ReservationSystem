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

// Mirrors Models.DTOs.Restaurant.TableDto — a persisted floorplan shape with seat info.
export interface FloorplanTable {
    id: string;
    tableNumber: number;
    minSeats: number;
    maxSeats: number;
    x: number;
    y: number;
    chairs: number;
    rotation: number;
    type: string | null;
    width: number;
    height: number;
    radius: number;
    chairsLayout: number[];
}

// Mirrors Models.DTOs.Restaurant.FloorPlanDto
export interface Floorplan {
    id: string;
    shapes: FloorplanTable[];
}

// Mirrors Models.DTOs.FloorplanSaveResultDto
export interface FloorplanSaveResult {
    floorPlanId: string;
    roomId: string;
    tableCount: number;
    unassignedReservationCount: number;
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
