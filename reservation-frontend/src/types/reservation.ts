// Mirrors Models.Enums.TimeFrame. The API serializes enums as numbers.
export const TimeFrame = {
    Breakfast: 0,
    Lunch: 1,
    Dinner: 2,
} as const;

export type TimeFrame = (typeof TimeFrame)[keyof typeof TimeFrame];

export const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
    [TimeFrame.Breakfast]: "Breakfast",
    [TimeFrame.Lunch]: "Lunch",
    [TimeFrame.Dinner]: "Dinner",
};

// Mirrors Models.DTOs.Reservation.ReservationDto
export interface Reservation {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    description: string;
    partySize: number;
    timeFrame: TimeFrame;
    reservationDateTime: string;
    restaurantId: string;
    restaurantName: string | null;
    tableId: string | null;
    tableNumber: number | null;
    createdAt: string;
    updatedAt: string | null;
}

// Mirrors Models.DTOs.Reservation.CreateReservationDto
export interface CreateReservationPayload {
    name: string;
    email: string;
    phoneNumber: string;
    description: string;
    partySize: number;
    timeFrame: TimeFrame;
    reservationDateTime: string;
    restaurantId: string;
    tableId?: string | null;
}

// Mirrors Models.DTOs.Reservation.UpdateReservationDto
export interface UpdateReservationPayload extends Omit<CreateReservationPayload, "restaurantId"> {
    id: string;
}

export interface ReservationFilters {
    restaurantId?: string;
    from?: string;
    to?: string;
    timeFrame?: TimeFrame;
}

// Mirrors Models.DTOs.Reservation.TableAvailabilityDto
export interface TableAvailability {
    id: string;
    tableNumber: number;
    minSeats: number;
    maxSeats: number;
    roomName: string | null;
    isOccupied: boolean;
    occupiedByName: string | null;
    fitsParty: boolean;
    isCurrent: boolean;
}
