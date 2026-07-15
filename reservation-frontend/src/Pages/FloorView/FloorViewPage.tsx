import { useEffect, useMemo, useState } from "react";
import { useRestaurants } from "../../hooks/useRestaurants";
import { useReservations } from "../../hooks/useReservations";
import { TIME_FRAME_LABELS, TimeFrame } from "../../types/reservation";
import type { Reservation, ReservationFilters } from "../../types/reservation";
import type { FloorplanTable } from "../../types/restaurant";
import { FloorViewCanvas } from "../../Components/Floorplan/FloorViewCanvas/FloorViewCanvas";
import { apiErrorMessage } from "../../utils/apiError";
import style from "./FloorViewPage.module.css";

function todayIso(): string {
    return new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd, local
}

function dayRange(day: string): { from?: string; to?: string } {
    if (!day) return {};
    const start = new Date(`${day}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
}

function timeOf(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const SERVICES: TimeFrame[] = [TimeFrame.Breakfast, TimeFrame.Lunch, TimeFrame.Dinner];

export function FloorViewPage() {
    const { restaurants } = useRestaurants();

    // Flatten rooms and keep the restaurant they belong to.
    const rooms = useMemo(
        () => restaurants.flatMap((r) =>
            r.rooms.map((room) => ({ ...room, restaurantName: r.name, restaurantId: r.id }))),
        [restaurants]
    );

    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [day, setDay] = useState(todayIso());
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [panelError, setPanelError] = useState<string | null>(null);

    useEffect(() => {
        if (rooms.length && !selectedRoomId) setSelectedRoomId(rooms[0].id);
    }, [rooms, selectedRoomId]);

    const room = rooms.find((r) => r.id === selectedRoomId);
    const restaurantId = room?.restaurantId;
    const tables: FloorplanTable[] = room?.floorPlan?.shapes ?? [];

    const filters: ReservationFilters = useMemo(
        () => ({ restaurantId, ...dayRange(day) }),
        [restaurantId, day]
    );
    const { reservations, loading, assignTable } = useReservations(filters);

    const occupiedTableIds = useMemo(
        () => new Set(reservations.filter((r) => r.tableId).map((r) => r.tableId as string)),
        [reservations]
    );

    const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

    const tableReservations = useMemo(
        () => reservations
            .filter((r) => r.tableId === selectedTableId)
            .sort((a, b) => a.reservationDateTime.localeCompare(b.reservationDateTime)),
        [reservations, selectedTableId]
    );

    const unassigned = useMemo(
        () => reservations.filter((r) => r.tableId === null),
        [reservations]
    );

    // Reset selection when switching rooms so the panel never shows a table from another room.
    function handleRoomChange(id: string) {
        setSelectedRoomId(id);
        setSelectedTableId(null);
        setPanelError(null);
    }

    async function seatHere(reservation: Reservation) {
        if (!selectedTable) return;
        setPanelError(null);
        try {
            await assignTable(reservation.id, selectedTable.id);
        } catch (err) {
            setPanelError(apiErrorMessage(err, "Could not seat that reservation here."));
        }
    }

    async function unassign(reservation: Reservation) {
        setPanelError(null);
        try {
            await assignTable(reservation.id, null);
        } catch (err) {
            setPanelError(apiErrorMessage(err, "Could not unassign that reservation."));
        }
    }

    return (
        <div className={style.wrapper}>
            <header className={style.header}>
                <div>
                    <h1 className={style.title}>Floor view</h1>
                    <p className={style.subtitle}>See who's seated where, and fill open tables.</p>
                </div>
                <div className={style.controls}>
                    <select
                        className={style.control}
                        value={selectedRoomId}
                        onChange={(e) => handleRoomChange(e.target.value)}
                        aria-label="Room"
                    >
                        {rooms.length === 0 && <option value="">No rooms yet</option>}
                        {rooms.map((r) => (
                            <option key={r.id} value={r.id}>{r.name} · {r.restaurantName}</option>
                        ))}
                    </select>
                    <input
                        className={style.control}
                        type="date"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        aria-label="Date"
                    />
                </div>
            </header>

            <div className={style.legend}>
                <span className={style.legendItem}><span className={`${style.swatch} ${style.free}`} /> Free</span>
                <span className={style.legendItem}><span className={`${style.swatch} ${style.occupied}`} /> Has reservations</span>
                <span className={style.legendHint}>Click a table for details</span>
            </div>

            <div className={style.body}>
                <div className={style.canvasArea}>
                    {tables.filter((t) => t.type === "rect-table" || t.type === "circle-table").length === 0 ? (
                        <div className={style.emptyCanvas}>
                            <p className={style.emptyTitle}>No tables in this room</p>
                            <p className={style.emptyBody}>Draw a floorplan for this room in the Floorplan editor first.</p>
                        </div>
                    ) : (
                        <FloorViewCanvas
                            tables={tables}
                            selectedTableId={selectedTableId}
                            occupiedTableIds={occupiedTableIds}
                            onSelectTable={(id) => { setSelectedTableId(id); setPanelError(null); }}
                        />
                    )}
                </div>

                <aside className={style.panel}>
                    {!selectedTable ? (
                        <div className={style.panelEmpty}>
                            <p className={style.panelEmptyTitle}>No table selected</p>
                            <p className={style.panelEmptyBody}>Click a table on the floor to see its reservations for {day}.</p>
                        </div>
                    ) : (
                        <>
                            <div className={style.panelHead}>
                                <h2 className={style.panelTitle}>Table #{selectedTable.tableNumber}</h2>
                                <span className={style.capacity}>{selectedTable.minSeats}–{selectedTable.maxSeats} seats</span>
                            </div>

                            <div className={style.services}>
                                {SERVICES.map((tf) => {
                                    const taken = tableReservations.some((r) => r.timeFrame === tf);
                                    return (
                                        <div key={tf} className={style.serviceRow}>
                                            <span className={style.serviceName}>{TIME_FRAME_LABELS[tf]}</span>
                                            <span className={taken ? style.takenBadge : style.freeBadge}>
                                                {taken ? "Taken" : "Free"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {panelError && <div className={style.error} role="alert">{panelError}</div>}

                            <div className={style.section}>
                                <div className={style.sectionTitle}>Reservations · {day}</div>
                                {loading ? (
                                    <p className={style.muted}>Loading…</p>
                                ) : tableReservations.length === 0 ? (
                                    <p className={style.muted}>No reservations for this table on this day.</p>
                                ) : (
                                    <ul className={style.resList}>
                                        {tableReservations.map((r) => (
                                            <li key={r.id} className={style.resItem}>
                                                <div className={style.resMain}>
                                                    <span className={style.resName}>{r.name}</span>
                                                    <span className={style.resMeta}>
                                                        {timeOf(r.reservationDateTime)} · {r.partySize}p · {TIME_FRAME_LABELS[r.timeFrame]}
                                                    </span>
                                                </div>
                                                <button className={style.linkBtn} onClick={() => unassign(r)}>Unassign</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className={style.section}>
                                <div className={style.sectionTitle}>Seat an unassigned reservation</div>
                                {unassigned.length === 0 ? (
                                    <p className={style.muted}>No unassigned reservations on this day.</p>
                                ) : (
                                    <ul className={style.resList}>
                                        {unassigned.map((r) => {
                                            const fits = r.partySize <= selectedTable.maxSeats;
                                            return (
                                                <li key={r.id} className={style.resItem}>
                                                    <div className={style.resMain}>
                                                        <span className={style.resName}>{r.name}</span>
                                                        <span className={style.resMeta}>
                                                            {timeOf(r.reservationDateTime)} · {r.partySize}p · {TIME_FRAME_LABELS[r.timeFrame]}
                                                            {!fits && <span className={style.tight}> · over capacity</span>}
                                                        </span>
                                                    </div>
                                                    <button className={style.seatBtn} onClick={() => seatHere(r)}>Seat here</button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
}
