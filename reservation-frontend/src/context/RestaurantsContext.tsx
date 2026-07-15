import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
    CreateRestaurantPayload,
    CreateRoomPayload,
    Restaurant,
    Room,
    UpdateRestaurantPayload,
    UpdateRoomPayload,
} from "../types/restaurant";
import { RestaurantService } from "../services/restaurantService";
import { RoomService } from "../services/roomService";

// How long cached restaurants are considered fresh. Navigating within this window serves the
// cache instantly with no network call; after it, a consumer mount triggers a background refresh.
const STALE_MS = 60_000;

interface RestaurantsContextValue {
    restaurants: Restaurant[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    revalidateIfStale: () => void;
    createRestaurant: (payload: CreateRestaurantPayload) => Promise<Restaurant>;
    updateRestaurant: (payload: UpdateRestaurantPayload) => Promise<Restaurant>;
    deleteRestaurant: (id: string) => Promise<void>;
    createRoom: (payload: CreateRoomPayload) => Promise<Room>;
    updateRoom: (payload: UpdateRoomPayload) => Promise<Room>;
    deleteRoom: (id: string) => Promise<void>;
}

const RestaurantsContext = createContext<RestaurantsContextValue | null>(null);

/**
 * Loads the restaurants tree (restaurants → rooms → floorplan → tables) once and shares it
 * across every page. This is the app's heaviest query and was previously re-fetched on every
 * navigation. Mutations refresh it in one place so all consumers stay consistent.
 */
export function RestaurantsProvider({ children }: { children: React.ReactNode }) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const inFlight = useRef(false);
    const lastFetched = useRef(0);
    const hasLoaded = useRef(false);

    // Never flips `loading` back to true after the first load, so background revalidation and
    // mutations refresh the data without flashing loading states across the app.
    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        try {
            const data = await RestaurantService.getRestaurants();
            setRestaurants(data);
            lastFetched.current = Date.now();
            setError(null);
        } catch {
            if (!hasLoaded.current) setError("Could not load restaurants.");
        } finally {
            inFlight.current = false;
            hasLoaded.current = true;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const revalidateIfStale = useCallback(() => {
        if (Date.now() - lastFetched.current > STALE_MS) void refresh();
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

    return (
        <RestaurantsContext.Provider
            value={{
                restaurants,
                loading,
                error,
                refresh,
                revalidateIfStale,
                createRestaurant,
                updateRestaurant,
                deleteRestaurant,
                createRoom,
                updateRoom,
                deleteRoom,
            }}
        >
            {children}
        </RestaurantsContext.Provider>
    );
}

export function useRestaurants(): RestaurantsContextValue {
    const ctx = useContext(RestaurantsContext);
    if (!ctx) throw new Error("useRestaurants must be used within a RestaurantsProvider");

    // On each page that mounts a consumer, quietly refresh if the cache has gone stale. Serves
    // cached data immediately either way — never blocks the navigation.
    useEffect(() => {
        ctx.revalidateIfStale();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return ctx;
}
