import { useEffect, useMemo, useState } from "react";
import { useRestaurants } from "../../hooks/useRestaurants";
import { useReservations } from "../../hooks/useReservations";
import { ACTIVE_STATUSES, ReservationStatus, STATUS_LABELS, TIME_FRAME_LABELS, TimeFrame } from "../../types/reservation";
import type { ReservationFilters } from "../../types/reservation";
import type { FloorplanTable } from "../../types/restaurant";
import { FloorViewCanvas } from "../../Components/Floorplan/FloorViewCanvas/FloorViewCanvas";
import { TableDetailsModal } from "./TableDetailsModal";
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

type ServiceFilter = TimeFrame | "all";

const SERVICE_TABS: { value: ServiceFilter; label: string }[] = [
    { value: "all", label: "All day" },
    { value: TimeFrame.Breakfast, label: TIME_FRAME_LABELS[TimeFrame.Breakfast] },
    { value: TimeFrame.Lunch, label: TIME_FRAME_LABELS[TimeFrame.Lunch] },
    { value: TimeFrame.Dinner, label: TIME_FRAME_LABELS[TimeFrame.Dinner] },
];

export function FloorViewPage() {
    const { restaurants } = useRestaurants();

    const rooms = useMemo(
        () => restaurants.flatMap((r) =>
            r.rooms.map((room) => ({ ...room, restaurantName: r.name, restaurantId: r.id }))),
        [restaurants]
    );

    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [day, setDay] = useState(todayIso());
    const [service, setService] = useState<ServiceFilter>("all");
    const [popupTableId, setPopupTableId] = useState<string | null>(null);
    const [highlightTableId, setHighlightTableId] = useState<string | null>(null);

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
    const { reservations, loading, assignTable, updateStatus } = useReservations(filters);

    // The right-hand list and the table colors both follow the selected service.
    const slotReservations = useMemo(
        () =>
            reservations
                .filter((r) => service === "all" || r.timeFrame === service)
                .sort((a, b) => a.reservationDateTime.localeCompare(b.reservationDateTime)),
        [reservations, service]
    );

    // Only Confirmed/Seated hold a table — finished or cancelled parties free it up.
    const occupiedTableIds = useMemo(
        () => new Set(
            slotReservations
                .filter((r) => r.tableId && ACTIVE_STATUSES.includes(r.status))
                .map((r) => r.tableId as string)
        ),
        [slotReservations]
    );

    const slotGuests = slotReservations.reduce((sum, r) => sum + r.partySize, 0);
    const popupTable = tables.find((t) => t.id === popupTableId) ?? null;

    function handleRoomChange(id: string) {
        setSelectedRoomId(id);
        setPopupTableId(null);
        setHighlightTableId(null);
    }

    return (
        <div className={style.wrapper}>
            <header className={style.header}>
                <div>
                    <h1 className={style.title}>Floor view</h1>
                    <p className={style.subtitle}>Who's booked, when, and at which table.</p>
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

            {/* Service slot selector — drives both the list and the table colors */}
            <div className={style.serviceTabs} role="tablist" aria-label="Service">
                {SERVICE_TABS.map((tab) => (
                    <button
                        key={String(tab.value)}
                        role="tab"
                        aria-selected={service === tab.value}
                        className={service === tab.value ? style.serviceTabActive : style.serviceTab}
                        onClick={() => setService(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
                <span className={style.legend}>
                    <span className={`${style.swatch} ${style.freeSwatch}`} /> Free
                    <span className={`${style.swatch} ${style.occupiedSwatch}`} /> Reserved
                    <span className={style.legendHint}>Click a table for details</span>
                </span>
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
                            selectedTableId={highlightTableId}
                            occupiedTableIds={occupiedTableIds}
                            onSelectTable={(id) => setPopupTableId(id)}
                        />
                    )}
                </div>

                <aside className={style.listPanel}>
                    <div className={style.listHead}>
                        <h2 className={style.listTitle}>
                            {service === "all" ? "All reservations" : TIME_FRAME_LABELS[service]}
                        </h2>
                        <span className={style.listMeta}>
                            {loading ? "…" : `${slotReservations.length} · ${slotGuests} guests`}
                        </span>
                    </div>

                    {loading ? (
                        <p className={style.muted}>Loading…</p>
                    ) : slotReservations.length === 0 ? (
                        <p className={style.muted}>
                            No {service === "all" ? "" : TIME_FRAME_LABELS[service].toLowerCase() + " "}
                            reservations on {day}.
                        </p>
                    ) : (
                        <ul className={style.resList}>
                            {slotReservations.map((r) => {
                                const highlighted = r.tableId !== null && r.tableId === highlightTableId;
                                return (
                                    <li key={r.id}>
                                        <button
                                            type="button"
                                            className={`${style.resRow} ${highlighted ? style.resRowActive : ""}`}
                                            onClick={() =>
                                                setHighlightTableId(r.tableId && r.tableId !== highlightTableId ? r.tableId : null)
                                            }
                                            title={r.tableId ? "Highlight this table on the floor" : "This reservation has no table yet"}
                                        >
                                            <span className={style.resTime}>{timeOf(r.reservationDateTime)}</span>
                                            <span className={style.resMain}>
                                                <span className={style.resName}>{r.name}</span>
                                                <span className={style.resMeta}>
                                                    {r.partySize} guest{r.partySize === 1 ? "" : "s"}
                                                    {service === "all" && <> · {TIME_FRAME_LABELS[r.timeFrame]}</>}
                                                    {r.status !== ReservationStatus.Confirmed && (
                                                        <> · {STATUS_LABELS[r.status]}</>
                                                    )}
                                                </span>
                                            </span>
                                            {r.tableNumber != null
                                                ? <span className={style.tableBadge}>#{r.tableNumber}</span>
                                                : <span className={style.unassigned}>Unassigned</span>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>
            </div>

            {popupTable && (
                <TableDetailsModal
                    table={popupTable}
                    day={day}
                    dayReservations={reservations}
                    onAssign={assignTable}
                    onUpdateStatus={updateStatus}
                    onClose={() => setPopupTableId(null)}
                />
            )}
        </div>
    );
}
