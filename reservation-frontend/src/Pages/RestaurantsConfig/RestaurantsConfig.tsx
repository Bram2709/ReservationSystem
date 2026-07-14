import style from './RestaurantsConfig.module.css';
import type { Restaurant, Room } from '../../types/restaurant';
import { useRestaurants } from '../../hooks/useRestaurants';

export function RestaurantsConfig() {
    const { restaurants, loading, error } = useRestaurants();

    if (loading) return <div className={style.state}>Restaurants laden...</div>;
    if (error) return <div className={`${style.state} ${style.error}`}>{error}</div>;

    return (
        <div className={style.wrapper}>
            <h1 className={style.pageTitle}>Restaurants</h1>
            <div className={style.grid}>
                {restaurants.map((restaurant: Restaurant) => (
                    <div key={restaurant.id} className={style.card}>
                        <h2 className={style.restaurantName}>{restaurant.name}</h2>
                        <p className={style.roomCount}>
                            {restaurant.rooms.length} {restaurant.rooms.length === 1 ? 'ruimte' : 'ruimtes'}
                        </p>
                        <ul className={style.roomList}>
                            {restaurant.rooms.map((room: Room) => (
                                <li key={room.id} className={style.roomItem}>
                                    <span className={style.roomName}>{room.name}</span>
                                    <span className={style.roomCapacity}>{room.capacity} personen</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}