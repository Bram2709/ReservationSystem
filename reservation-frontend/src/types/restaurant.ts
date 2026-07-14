export interface Room {
    id: string;
    name: string;
    capacity: number;
}

export interface Restaurant {
    id: string;
    name: string;
    rooms: Room[];
}

import type { FloorShape } from './shapes';

export interface Floorplan{
    id: string;
    restaurantId: string;
    roomId: string;
    shapes: FloorShape[];
}