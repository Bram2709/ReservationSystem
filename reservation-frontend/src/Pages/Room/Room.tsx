
import style from "./Room.module.css";
import { useState } from "react";
import { useRestaurants } from "../../hooks/useRestaurants";
import { RoomService } from "../../services/roomService";

export function Room() {
  const { restaurants, loading, error } = useRestaurants();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>(restaurants[0]?.id ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, isActive, restaurantId };

    RoomService.createRoom(payload.name, payload.isActive, payload.restaurantId);

    setName("");
    setIsActive(true);
    setRestaurantId(restaurants[0]?.id ?? "");
  }

  return (
    <div className={style.wrapper}>
      <h1>Room Layout</h1>

      <form onSubmit={handleSubmit} className={style.form}>
        <label htmlFor="room-name">Name</label>
        <input
          id="room-name"
          type="text"
          placeholder="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="room-active">
          <input
            id="room-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <label htmlFor="room-restaurant">Restaurant</label>
        {loading ? (
          <div>Loading restaurants...</div>
        ) : error ? (
          <div className={style.error}>Failed to load restaurants</div>
        ) : (
          <select
            id="room-restaurant"
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            required
          >
            <option value="">Select restaurant</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        <button type="submit">Create Room</button>
      </form>
    </div>
  );
}