
import style from "./Restaurant.module.css";
import { useState } from "react";
import { RestaurantService } from "../../services/restaurantService";

export function Restaurant() {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const created = await RestaurantService.createRestaurant(name);
      console.log("Created restaurant:", created);
      setName("");
    } catch (err) {
      console.error("Create failed:", err);
    }
  }

  return (
    <div className={style.wrapper}>
      <h1>Restaurant Layout</h1>

      <form onSubmit={handleSubmit} className={style.form}>
        <label htmlFor="restaurant-name">Name</label>
        <input
          id="restaurant-name"
          type="text"
          placeholder="Restaurant name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}