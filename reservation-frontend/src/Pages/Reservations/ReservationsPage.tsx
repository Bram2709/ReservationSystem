import { useMemo, useState } from "react";
import { useReservations } from "../../hooks/useReservations";
import { useRestaurants } from "../../hooks/useRestaurants";
import { TIME_FRAME_LABELS, TimeFrame } from "../../types/reservation";
import type { CreateReservationPayload, Reservation, ReservationFilters } from "../../types/reservation";
import { ReservationForm } from "./ReservationForm";
import { TablePicker } from "./TablePicker";
import style from "./ReservationPage.module.css";

interface Notice {
    kind: "success" | "warning";
    text: string;
}

/** Turns a yyyy-mm-dd day into the [from, to) range the API expects. */
function dayRange(day: string): { from?: string; to?: string } {
    if (!day) return {};
    const start = new Date(`${day}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ReservationsPage() {
    const [day, setDay] = useState("");
    const [restaurantId, setRestaurantId] = useState("");
    const [timeFrame, setTimeFrame] = useState<TimeFrame | "">("");
    const [search, setSearch] = useState("");

    const [editing, setEditing] = useState<Reservation | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [tablePickerFor, setTablePickerFor] = useState<Reservation | null>(null);

    const filters: ReservationFilters = useMemo(() => ({
        ...dayRange(day),
        restaurantId: restaurantId || undefined,
        timeFrame: timeFrame === "" ? undefined : timeFrame,
    }), [day, restaurantId, timeFrame]);

    const {
        reservations,
        loading,
        error,
        createReservation,
        updateReservation,
        deleteReservation,
        assignTable,
    } = useReservations(filters);

    const { restaurants } = useRestaurants();

    // Wraps create so we can tell the user whether a table was auto-assigned. The API tries to
    // seat the party; a null tableId on the result means nothing was free for that slot.
    async function handleCreate(payload: CreateReservationPayload): Promise<Reservation> {
        const created = await createReservation(payload);
        setNotice(
            created.tableNumber != null
                ? { kind: "success", text: `Reservation added and seated at table #${created.tableNumber}.` }
                : { kind: "warning", text: "Reservation added, but no table was free for that slot — it's unassigned. You can assign one below." }
        );
        return created;
    }

    // Name/email search stays client-side: the API has no text filter, and the result
    // set is already narrowed by day/restaurant/timeframe.
    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return reservations;
        return reservations.filter((r) =>
            r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)
        );
    }, [reservations, search]);

    const totalGuests = useMemo(
        () => visible.reduce((sum, r) => sum + r.partySize, 0),
        [visible]
    );

    function openCreate() {
        setEditing(null);
        setActionError(null);
        setNotice(null);
        setIsFormOpen(true);
    }

    function openEdit(reservation: Reservation) {
        setEditing(reservation);
        setActionError(null);
        setIsFormOpen(true);
    }

    async function handleDelete(id: string) {
        setActionError(null);
        try {
            await deleteReservation(id);
            setPendingDeleteId(null);
        } catch {
            setActionError("Could not cancel that reservation. Please try again.");
        }
    }

    return (
        <div className={style.wrapper}>
            <header className={style.header}>
                <div>
                    <h1 className={style.title}>Reservations</h1>
                    <p className={style.subtitle}>
                        {loading
                            ? "Loading…"
                            : `${visible.length} reservation${visible.length === 1 ? "" : "s"} · ${totalGuests} guest${totalGuests === 1 ? "" : "s"}`}
                    </p>
                </div>
                <button className={style.primaryBtn} onClick={openCreate}>
                    + New reservation
                </button>
            </header>

            <section className={style.filters} aria-label="Filter reservations">
                <input
                    className={style.search}
                    type="search"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search reservations"
                />
                <input
                    className={style.filterField}
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    aria-label="Filter by date"
                />
                <select
                    className={style.filterField}
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value)}
                    aria-label="Filter by restaurant"
                >
                    <option value="">All restaurants</option>
                    {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                <select
                    className={style.filterField}
                    value={timeFrame}
                    onChange={(e) =>
                        setTimeFrame(e.target.value === "" ? "" : (Number(e.target.value) as TimeFrame))
                    }
                    aria-label="Filter by service"
                >
                    <option value="">All services</option>
                    {Object.values(TimeFrame).map((tf) => (
                        <option key={tf} value={tf}>{TIME_FRAME_LABELS[tf]}</option>
                    ))}
                </select>
                {(day || restaurantId || timeFrame !== "" || search) && (
                    <button
                        className={style.ghostBtn}
                        onClick={() => {
                            setDay("");
                            setRestaurantId("");
                            setTimeFrame("");
                            setSearch("");
                        }}
                    >
                        Clear
                    </button>
                )}
            </section>

            {notice && (
                <div
                    className={notice.kind === "success" ? style.successBanner : style.warningBanner}
                    role="status"
                >
                    <span>{notice.text}</span>
                    <button className={style.bannerClose} onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
                </div>
            )}
            {actionError && <div className={style.errorBanner} role="alert">{actionError}</div>}
            {error && <div className={style.errorBanner} role="alert">{error}</div>}

            {loading ? (
                <div className={style.stateCard}>Loading reservations…</div>
            ) : visible.length === 0 ? (
                <div className={style.stateCard}>
                    <p className={style.emptyTitle}>No reservations found</p>
                    <p className={style.emptyBody}>
                        {reservations.length === 0
                            ? "Create your first reservation to see it here."
                            : "No reservations match your search."}
                    </p>
                </div>
            ) : (
                <div className={style.tableScroll}>
                    <table className={style.table}>
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>When</th>
                                <th>Service</th>
                                <th>Party</th>
                                <th>Restaurant</th>
                                <th>Table</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <div className={style.guestName}>{r.name}</div>
                                        <div className={style.guestMeta}>{r.email}</div>
                                        <div className={style.guestMeta}>{r.phoneNumber}</div>
                                    </td>
                                    <td>{formatDateTime(r.reservationDateTime)}</td>
                                    <td>
                                        <span className={style.badge}>{TIME_FRAME_LABELS[r.timeFrame]}</span>
                                    </td>
                                    <td>{r.partySize}</td>
                                    <td>{r.restaurantName ?? "—"}</td>
                                    <td>
                                        <div className={style.tableCell}>
                                            {r.tableNumber != null
                                                ? <span className={style.tableBadge}>#{r.tableNumber}</span>
                                                : <span className={style.unassigned}>Unassigned</span>}
                                            <button
                                                className={style.linkBtn}
                                                onClick={() => { setActionError(null); setTablePickerFor(r); }}
                                            >
                                                {r.tableNumber != null ? "Change" : "Assign"}
                                            </button>
                                        </div>
                                    </td>
                                    <td className={style.actions}>
                                        {pendingDeleteId === r.id ? (
                                            <>
                                                <button
                                                    className={style.dangerBtn}
                                                    onClick={() => handleDelete(r.id)}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    className={style.ghostBtn}
                                                    onClick={() => setPendingDeleteId(null)}
                                                >
                                                    Keep
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className={style.ghostBtn}
                                                    onClick={() => openEdit(r)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className={style.dangerGhostBtn}
                                                    onClick={() => setPendingDeleteId(r.id)}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormOpen && (
                <ReservationForm
                    reservation={editing}
                    restaurants={restaurants}
                    onClose={() => setIsFormOpen(false)}
                    onCreate={handleCreate}
                    onUpdate={updateReservation}
                />
            )}

            {tablePickerFor && (
                <TablePicker
                    reservation={tablePickerFor}
                    onClose={() => setTablePickerFor(null)}
                    onAssign={assignTable}
                />
            )}
        </div>
    );
}
