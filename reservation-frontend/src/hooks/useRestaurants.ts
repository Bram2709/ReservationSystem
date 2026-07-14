import { useState, useEffect } from "react";
import type { Restaurant } from "../types/restaurant";
import { RestaurantService } from "../services/restaurantService";

export function useRestaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        RestaurantService
            .getRestaurants()
            .then(setRestaurants)
            .catch(() => setError("Kon restaurants niet laden."))
            .finally(() => setLoading(false));
    }, []);

    return { restaurants, loading, error };
}
