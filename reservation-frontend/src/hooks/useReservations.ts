import { useCallback, useEffect, useState } from "react";
import type {
    CreateReservationPayload,
    Reservation,
    ReservationFilters,
    UpdateReservationPayload,
} from "../types/reservation";
import { ReservationService } from "../services/reservationService";

export function useReservations(filters: ReservationFilters) {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { restaurantId, from, to, timeFrame } = filters;

    // Depend on the individual filter values, not the object, so a caller passing a
    // fresh object literal each render doesn't retrigger the fetch forever.
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setReservations(
                await ReservationService.getReservations({ restaurantId, from, to, timeFrame })
            );
        } catch {
            setError("Could not load reservations.");
        } finally {
            setLoading(false);
        }
    }, [restaurantId, from, to, timeFrame]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const createReservation = useCallback(async (payload: CreateReservationPayload) => {
        const created = await ReservationService.createReservation(payload);
        await refresh();
        return created;
    }, [refresh]);

    const updateReservation = useCallback(async (payload: UpdateReservationPayload) => {
        const updated = await ReservationService.updateReservation(payload);
        await refresh();
        return updated;
    }, [refresh]);

    const deleteReservation = useCallback(async (id: string) => {
        await ReservationService.deleteReservation(id);
        setReservations((current) => current.filter((r) => r.id !== id));
    }, []);

    return {
        reservations,
        loading,
        error,
        refresh,
        createReservation,
        updateReservation,
        deleteReservation,
    };
}
