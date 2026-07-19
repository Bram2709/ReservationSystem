import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useReservations } from "../../hooks/useReservations";
import { useRestaurants } from "../../hooks/useRestaurants";
import { ACTIVE_STATUSES, ReservationStatus, TIME_FRAME_LABELS, TimeFrame } from "../../types/reservation";
import type { Reservation, ReservationFilters } from "../../types/reservation";
import style from "./DashboardPage.module.css";

/** Monday 00:00 of the current week (local time). */
function startOfWeek(): Date {
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return monday;
}

const sameLocalDay = (iso: string, day: Date) => {
    const d = new Date(iso);
    return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
};

function timeOf(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("");
}

const SERVICES: TimeFrame[] = [TimeFrame.Breakfast, TimeFrame.Lunch, TimeFrame.Dinner];

export function DashboardPage() {
    const { restaurants } = useRestaurants();

    // One fetch covers everything on the page: the whole current week's reservations.
    const filters: ReservationFilters = useMemo(() => {
        const monday = startOfWeek();
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        return { from: monday.toISOString(), to: nextMonday.toISOString() };
    }, []);
    const { reservations, loading } = useReservations(filters);

    const now = new Date();
    // Cancelled, no-show and waitlisted bookings don't count toward today's numbers.
    const today = useMemo(() => reservations.filter(
        (r) => sameLocalDay(r.reservationDateTime, now) &&
            (ACTIVE_STATUSES.includes(r.status) || r.status === ReservationStatus.Finished)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [reservations]);

    const guestsToday = today.reduce((sum, r) => sum + r.partySize, 0);
    const bookedTables = new Set(today.filter((r) => r.tableId).map((r) => r.tableId as string)).size;
    const unassignedToday = today.filter((r) => r.tableId === null);

    const allRooms = restaurants.flatMap((r) => r.rooms);
    const totalTables = allRooms.reduce((sum, room) => sum + room.tableCount, 0);
    const totalSeats = allRooms.reduce((sum, room) => sum + room.seats, 0);

    // Reservations per weekday for the bar chart.
    const week = useMemo(() => {
        const monday = startOfWeek();
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const count = reservations.filter((r) => sameLocalDay(r.reservationDateTime, day)).length;
            return {
                label: day.toLocaleDateString(undefined, { weekday: "short" }),
                isToday: sameLocalDay(new Date().toISOString(), day),
                count,
            };
        });
    }, [reservations]);
    const weekMax = Math.max(1, ...week.map((d) => d.count));
    const weekTotal = week.reduce((sum, d) => sum + d.count, 0);

    const upcoming = useMemo(
        () =>
            today
                // Still expected: confirmed and in the future (seated parties are already in).
                .filter((r) => r.status === ReservationStatus.Confirmed && new Date(r.reservationDateTime) >= now)
                .sort((a, b) => a.reservationDateTime.localeCompare(b.reservationDateTime))
                .slice(0, 5),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [today]
    );

    const bookedTodayFor = (restaurantId: string) =>
        today.filter((r) => r.restaurantId === restaurantId).length;

    const serviceCount = (tf: TimeFrame) => today.filter((r) => r.timeFrame === tf).length;

    return (
        <div className={style.wrapper}>
            <header className={style.header}>
                <div>
                    <h1 className={style.title}>Overview</h1>
                    <p className={style.subtitle}>
                        {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                </div>
                <Link className={style.primaryBtn} to="/reservations">+ New reservation</Link>
            </header>

            {/* --- Today's stats --- */}
            <section className={style.stats}>
                <div className={style.statCard}>
                    <span className={style.statLabel}>Reservations today</span>
                    <span className={style.statValue}>{loading ? "…" : today.length}</span>
                </div>
                <div className={style.statCard}>
                    <span className={style.statLabel}>Guests today</span>
                    <span className={style.statValue}>{loading ? "…" : guestsToday}</span>
                </div>
                <div className={style.statCard}>
                    <span className={style.statLabel}>Tables booked</span>
                    <span className={style.statValue}>
                        {loading ? "…" : `${bookedTables}/${totalTables}`}
                    </span>
                    <span className={style.statHint}>{totalSeats} seats total</span>
                </div>
                <Link
                    to="/reservations"
                    className={`${style.statCard} ${style.statLink} ${unassignedToday.length > 0 ? style.statWarning : ""}`}
                >
                    <span className={style.statLabel}>Unassigned today</span>
                    <span className={style.statValue}>{loading ? "…" : unassignedToday.length}</span>
                    {unassignedToday.length > 0 && <span className={style.statHint}>needs a table →</span>}
                </Link>
            </section>

            <div className={style.mainRow}>
                {/* --- This week chart --- */}
                <section className={style.chartCard}>
                    <div className={style.cardHead}>
                        <h2 className={style.cardTitle}>This week</h2>
                        <span className={style.cardMeta}>
                            {weekTotal} reservation{weekTotal === 1 ? "" : "s"}
                        </span>
                    </div>

                    {loading ? (
                        <p className={style.muted}>Loading…</p>
                    ) : (
                        <>
                            <div className={style.chart} role="img" aria-label="Reservations per day this week">
                                {week.map((d) => (
                                    <div key={d.label} className={style.chartCol}>
                                        <span className={style.barCount}>{d.count}</span>
                                        <div className={style.barTrack}>
                                            <div
                                                className={`${style.bar} ${d.isToday ? style.barToday : ""}`}
                                                style={{ height: `${Math.max(4, (d.count / weekMax) * 100)}%` }}
                                            />
                                        </div>
                                        <span className={`${style.barLabel} ${d.isToday ? style.barLabelToday : ""}`}>
                                            {d.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className={style.services}>
                                {SERVICES.map((tf) => (
                                    <div key={tf} className={style.serviceChip}>
                                        <span className={style.serviceName}>{TIME_FRAME_LABELS[tf]}</span>
                                        <span className={style.serviceCount}>{serviceCount(tf)} today</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {/* --- Next arrivals --- */}
                <section className={style.arrivalsCard}>
                    <div className={style.cardHead}>
                        <h2 className={style.cardTitle}>Next arrivals</h2>
                        <Link className={style.viewAll} to="/reservations">View all</Link>
                    </div>

                    {loading ? (
                        <p className={style.muted}>Loading…</p>
                    ) : upcoming.length === 0 ? (
                        <p className={style.muted}>
                            {today.length === 0
                                ? "No reservations today yet."
                                : "No more arrivals today — all guests are in."}
                        </p>
                    ) : (
                        <ul className={style.arrivalList}>
                            {upcoming.map((r: Reservation) => (
                                <li key={r.id} className={style.arrival}>
                                    <span className={style.avatar}>{initials(r.name)}</span>
                                    <div className={style.arrivalInfo}>
                                        <div className={style.arrivalTop}>
                                            <span className={style.arrivalName}>{r.name}</span>
                                            <span className={style.arrivalTime}>{timeOf(r.reservationDateTime)}</span>
                                        </div>
                                        <div className={style.arrivalMeta}>
                                            {r.partySize} guest{r.partySize === 1 ? "" : "s"}
                                            <span className={style.dot} />
                                            {r.tableNumber != null
                                                ? <span className={style.tableBadge}>Table #{r.tableNumber}</span>
                                                : <span className={style.unassigned}>Unassigned</span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* --- Restaurants snapshot --- */}
            <section>
                <div className={style.cardHead}>
                    <h2 className={style.cardTitle}>Your restaurants</h2>
                </div>
                {restaurants.length === 0 ? (
                    <div className={style.emptyCard}>
                        <p className={style.muted}>No restaurants yet.</p>
                        <Link className={style.primaryBtn} to="/restaurants">Create your first restaurant</Link>
                    </div>
                ) : (
                    <div className={style.restaurantGrid}>
                        {restaurants.map((r) => {
                            const tables = r.rooms.reduce((s, room) => s + room.tableCount, 0);
                            const seats = r.rooms.reduce((s, room) => s + room.seats, 0);
                            return (
                                <div key={r.id} className={style.restaurantCard}>
                                    <div className={style.restaurantName}>{r.name}</div>
                                    <div className={style.restaurantMeta}>
                                        {r.rooms.length} room{r.rooms.length === 1 ? "" : "s"} · {tables} tables · {seats} seats
                                    </div>
                                    <div className={style.restaurantToday}>
                                        <span className={style.restaurantCount}>{bookedTodayFor(r.id)}</span> reservations today
                                    </div>
                                    <div className={style.restaurantLinks}>
                                        <Link className={style.ghostBtn} to="/floor-view">Floor view</Link>
                                        <Link className={style.ghostBtn} to="/floorplan">Floorplan</Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
