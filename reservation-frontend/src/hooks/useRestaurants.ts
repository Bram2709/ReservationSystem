// The restaurants tree is now cached and shared via RestaurantsProvider rather than fetched
// per-consumer. Re-exported here so existing `../hooks/useRestaurants` imports keep working.
export { useRestaurants } from "../context/RestaurantsContext";
