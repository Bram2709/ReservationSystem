import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRestaurants } from "../../hooks/useRestaurants";
import type { Restaurant, Room } from "../../types/restaurant";
import { apiErrorMessage } from "../../utils/apiError";
import { RestaurantForm } from "./RestaurantForm";
import { RoomForm } from "./RoomForm";
import style from "./RestaurantsPage.module.css";

/** Which room form is open, and under which restaurant. */
interface RoomFormTarget {
    restaurant: Restaurant;
    room: Room | null;
}

export function RestaurantsPage() {
    const {
        restaurants,
        loading,
        error,
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        createRoom,
        updateRoom,
        deleteRoom,
    } = useRestaurants();

    const [restaurantForm, setRestaurantForm] = useState<Restaurant | null | undefined>(undefined);
    const [roomForm, setRoomForm] = useState<RoomFormTarget | null>(null);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    async function copyBookingLink(restaurantId: string) {
        await navigator.clipboard.writeText(`${window.location.origin}/book/${restaurantId}`);
        setCopiedId(restaurantId);
        setTimeout(() => setCopiedId((c) => (c === restaurantId ? null : c)), 2000);
    }

    const totals = useMemo(() => {
        const rooms = restaurants.flatMap((r) => r.rooms);
        return {
            rooms: rooms.length,
            tables: rooms.reduce((sum, r) => sum + r.tableCount, 0),
            seats: rooms.reduce((sum, r) => sum + r.seats, 0),
        };
    }, [restaurants]);

    async function handleDeleteRestaurant(id: string) {
        setActionError(null);
        try {
            await deleteRestaurant(id);
            setPendingDelete(null);
        } catch (err) {
            setActionError(apiErrorMessage(err, "Could not delete that restaurant."));
            setPendingDelete(null);
        }
    }

    async function handleDeleteRoom(id: string) {
        setActionError(null);
        try {
            await deleteRoom(id);
            setPendingDelete(null);
        } catch (err) {
            setActionError(apiErrorMessage(err, "Could not delete that room."));
            setPendingDelete(null);
        }
    }

    return (
        <div className={style.wrapper}>
            <header className={style.header}>
                <div>
                    <h1 className={style.title}>Restaurants</h1>
                    <p className={style.subtitle}>
                        {loading
                            ? "Loading…"
                            : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"} · ${totals.rooms} room${totals.rooms === 1 ? "" : "s"} · ${totals.tables} tables · ${totals.seats} seats`}
                    </p>
                </div>
                <button className={style.primaryBtn} onClick={() => setRestaurantForm(null)}>
                    + New restaurant
                </button>
            </header>

            {actionError && <div className={style.errorBanner} role="alert">{actionError}</div>}
            {error && <div className={style.errorBanner} role="alert">{error}</div>}

            {loading ? (
                <div className={style.stateCard}>Loading restaurants…</div>
            ) : restaurants.length === 0 ? (
                <div className={style.stateCard}>
                    <p className={style.emptyTitle}>No restaurants yet</p>
                    <p className={style.emptyBody}>
                        Create a restaurant, add rooms to it, then draw each room's floorplan.
                    </p>
                    <button className={style.primaryBtn} onClick={() => setRestaurantForm(null)}>
                        + New restaurant
                    </button>
                </div>
            ) : (
                <div className={style.grid}>
                    {restaurants.map((restaurant) => {
                        const seats = restaurant.rooms.reduce((s, r) => s + r.seats, 0);
                        const tables = restaurant.rooms.reduce((s, r) => s + r.tableCount, 0);

                        return (
                            <section key={restaurant.id} className={style.card}>
                                <div className={style.cardHead}>
                                    <div className={style.cardHeadText}>
                                        <h2 className={style.restaurantName}>{restaurant.name}</h2>
                                        <p className={style.address}>
                                            {restaurant.address || "No address set"}
                                        </p>
                                    </div>
                                    <div className={style.cardActions}>
                                        {pendingDelete === restaurant.id ? (
                                            <>
                                                <button
                                                    className={style.dangerBtn}
                                                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className={style.ghostBtn}
                                                    onClick={() => setPendingDelete(null)}
                                                >
                                                    Keep
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className={style.ghostBtn}
                                                    onClick={() => setRestaurantForm(restaurant)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className={style.dangerGhostBtn}
                                                    onClick={() => {
                                                        setActionError(null);
                                                        setPendingDelete(restaurant.id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className={style.ghostBtn}
                                    onClick={() => copyBookingLink(restaurant.id)}
                                    title="Copy the public page where guests book a table themselves"
                                >
                                    {copiedId === restaurant.id ? "Link copied!" : "Copy booking link"}
                                </button>

                                <dl className={style.stats}>
                                    <div className={style.stat}>
                                        <dt>Rooms</dt>
                                        <dd>{restaurant.rooms.length}</dd>
                                    </div>
                                    <div className={style.stat}>
                                        <dt>Tables</dt>
                                        <dd>{tables}</dd>
                                    </div>
                                    <div className={style.stat}>
                                        <dt>Seats</dt>
                                        <dd>{seats}</dd>
                                    </div>
                                </dl>

                                <div className={style.roomsHead}>
                                    <span className={style.roomsTitle}>Rooms</span>
                                    <button
                                        className={style.addRoomBtn}
                                        onClick={() => setRoomForm({ restaurant, room: null })}
                                    >
                                        + Add room
                                    </button>
                                </div>

                                {restaurant.rooms.length === 0 ? (
                                    <p className={style.noRooms}>
                                        No rooms yet. Add one to start building its floorplan.
                                    </p>
                                ) : (
                                    <ul className={style.roomList}>
                                        {restaurant.rooms.map((room) => (
                                            <li key={room.id} className={style.roomItem}>
                                                <div className={style.roomMain}>
                                                    <span className={style.roomName}>{room.name}</span>
                                                    <span
                                                        className={room.isActive ? style.activePill : style.inactivePill}
                                                    >
                                                        {room.isActive ? "Open" : "Closed"}
                                                    </span>
                                                </div>

                                                <div className={style.roomMeta}>
                                                    {room.floorPlan
                                                        ? `${room.tableCount} table${room.tableCount === 1 ? "" : "s"} · ${room.seats} seats`
                                                        : "No floorplan yet"}
                                                </div>

                                                <div className={style.roomActions}>
                                                    {pendingDelete === room.id ? (
                                                        <>
                                                            <button
                                                                className={style.dangerBtn}
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                className={style.ghostBtn}
                                                                onClick={() => setPendingDelete(null)}
                                                            >
                                                                Keep
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link
                                                                className={style.ghostBtn}
                                                                to={`/floorplan?roomId=${room.id}`}
                                                            >
                                                                {room.floorPlan ? "Floorplan" : "Draw floorplan"}
                                                            </Link>
                                                            <button
                                                                className={style.ghostBtn}
                                                                onClick={() => setRoomForm({ restaurant, room })}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className={style.dangerGhostBtn}
                                                                onClick={() => {
                                                                    setActionError(null);
                                                                    setPendingDelete(room.id);
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {restaurantForm !== undefined && (
                <RestaurantForm
                    restaurant={restaurantForm}
                    onClose={() => setRestaurantForm(undefined)}
                    onCreate={createRestaurant}
                    onUpdate={updateRestaurant}
                />
            )}

            {roomForm && (
                <RoomForm
                    room={roomForm.room}
                    restaurantId={roomForm.restaurant.id}
                    restaurantName={roomForm.restaurant.name}
                    onClose={() => setRoomForm(null)}
                    onCreate={createRoom}
                    onUpdate={updateRoom}
                />
            )}
        </div>
    );
}
