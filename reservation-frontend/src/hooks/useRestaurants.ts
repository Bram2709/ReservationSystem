import { useCallback, useEffect, useState } from "react";
import type {
    CreateRestaurantPayload,
    CreateRoomPayload,
    Restaurant,
    UpdateRestaurantPayload,
    UpdateRoomPayload,
} from "../types/restaurant";
import { RestaurantService } from "../services/restaurantService";
import { RoomService } from "../services/roomService";

/**
 * Restaurants come back with their rooms nested, so this hook is the single source of
 * truth for both. Room mutations refetch restaurants rather than keeping a second list
 * that could drift out of sync.
 */
export function useRestaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        try {
            setRestaurants(await RestaurantService.getRestaurants());
        } catch {
            setError("Could not load restaurants.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const createRestaurant = useCallback(async (payload: CreateRestaurantPayload) => {
        const created = await RestaurantService.createRestaurant(payload);
        await refresh();
        return created;
    }, [refresh]);

    const updateRestaurant = useCallback(async (payload: UpdateRestaurantPayload) => {
        const updated = await RestaurantService.updateRestaurant(payload);
        await refresh();
        return updated;
    }, [refresh]);

    const deleteRestaurant = useCallback(async (id: string) => {
        await RestaurantService.deleteRestaurant(id);
        await refresh();
    }, [refresh]);

    const createRoom = useCallback(async (payload: CreateRoomPayload) => {
        const created = await RoomService.createRoom(payload);
        await refresh();
        return created;
    }, [refresh]);

    const updateRoom = useCallback(async (payload: UpdateRoomPayload) => {
        const updated = await RoomService.updateRoom(payload);
        await refresh();
        return updated;
    }, [refresh]);

    const deleteRoom = useCallback(async (id: string) => {
        await RoomService.deleteRoom(id);
        await refresh();
    }, [refresh]);

    return {
        restaurants,
        loading,
        error,
        refresh,
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        createRoom,
        updateRoom,
        deleteRoom,
    };
}
