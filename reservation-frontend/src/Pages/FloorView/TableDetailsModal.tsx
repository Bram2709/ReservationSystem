import { useState } from "react";
import { Modal } from "../../Components/Modal/Modal";
import { ACTIVE_STATUSES, ReservationStatus, STATUS_LABELS, TIME_FRAME_LABELS, TimeFrame } from "../../types/reservation";
import type { Reservation } from "../../types/reservation";
import type { FloorplanTable } from "../../types/restaurant";
import { apiErrorMessage } from "../../utils/apiError";
import style from "./TableDetailsModal.module.css";

const SERVICES: TimeFrame[] = [TimeFrame.Breakfast, TimeFrame.Lunch, TimeFrame.Dinner];

interface Props {
    table: FloorplanTable;
    day: string;
    /** All of the selected day's reservations (every service). */
    dayReservations: Reservation[];
    onAssign: (reservationId: string, tableId: string | null) => Promise<Reservation>;
    onUpdateStatus: (reservationId: string, status: ReservationStatus) => Promise<Reservation>;
    onClose: () => void;
}

function timeOf(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Per-table popup for the Floor View: capacity, per-service occupancy for the day,
 * this table's reservations with status controls, and seating controls. Rendered in
 * the shared Modal, which closes on outside-click / Escape.
 */
export function TableDetailsModal({ table, day, dayReservations, onAssign, onUpdateStatus, onClose }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const tableReservations = dayReservations
        .filter((r) => r.tableId === table.id)
        .sort((a, b) => a.reservationDateTime.localeCompare(b.reservationDateTime));

    const unassigned = dayReservations.filter(
        (r) => r.tableId === null && r.status !== ReservationStatus.Cancelled
    );

    async function run(action: () => Promise<Reservation>) {
        setBusy(true);
        setError(null);
        try {
            await action();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not update that reservation."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal title={`Table #${table.tableNumber}`} onClose={onClose}>
            <div className={style.body}>
                <div className={style.topRow}>
                    <span className={style.capacity}>{table.minSeats}–{table.maxSeats} seats</span>
                    <div className={style.services}>
                        {SERVICES.map((tf) => {
                            const taken = tableReservations.some(
                                (r) => r.timeFrame === tf && ACTIVE_STATUSES.includes(r.status)
                            );
                            return (
                                <span key={tf} className={taken ? style.takenBadge : style.freeBadge}>
                                    {TIME_FRAME_LABELS[tf]}: {taken ? "taken" : "free"}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {error && <div className={style.error} role="alert">{error}</div>}

                <div className={style.sectionTitle}>Reservations · {day}</div>
                {tableReservations.length === 0 ? (
                    <p className={style.muted}>No reservations at this table on this day.</p>
                ) : (
                    <ul className={style.list}>
                        {tableReservations.map((r) => (
                            <li key={r.id} className={style.item}>
                                <div className={style.itemMain}>
                                    <span className={style.itemName}>{r.name}</span>
                                    <span className={style.itemMeta}>
                                        {timeOf(r.reservationDateTime)} · {r.partySize}p · {TIME_FRAME_LABELS[r.timeFrame]}
                                        {" · "}{STATUS_LABELS[r.status]}
                                    </span>
                                </div>
                                <div className={style.itemActions}>
                                    {r.status === ReservationStatus.Confirmed && (
                                        <>
                                            <button className={style.seatBtn} disabled={busy}
                                                onClick={() => run(() => onUpdateStatus(r.id, ReservationStatus.Seated))}>
                                                Seat now
                                            </button>
                                            <button className={style.subtleBtn} disabled={busy}
                                                onClick={() => run(() => onUpdateStatus(r.id, ReservationStatus.NoShow))}>
                                                No-show
                                            </button>
                                        </>
                                    )}
                                    {r.status === ReservationStatus.Seated && (
                                        <button className={style.seatBtn} disabled={busy}
                                            onClick={() => run(() => onUpdateStatus(r.id, ReservationStatus.Finished))}>
                                            Finish
                                        </button>
                                    )}
                                    <button className={style.unassignBtn} disabled={busy}
                                        onClick={() => run(() => onAssign(r.id, null))}>
                                        Unassign
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className={style.sectionTitle}>Seat an unassigned reservation</div>
                {unassigned.length === 0 ? (
                    <p className={style.muted}>Everyone on this day has a table.</p>
                ) : (
                    <ul className={style.list}>
                        {unassigned.map((r) => {
                            const fits = r.partySize <= table.maxSeats;
                            return (
                                <li key={r.id} className={style.item}>
                                    <div className={style.itemMain}>
                                        <span className={style.itemName}>{r.name}</span>
                                        <span className={style.itemMeta}>
                                            {timeOf(r.reservationDateTime)} · {r.partySize}p · {TIME_FRAME_LABELS[r.timeFrame]}
                                            {r.status === ReservationStatus.Waitlisted && <> · {STATUS_LABELS[r.status]}</>}
                                            {!fits && <span className={style.tight}> · over capacity</span>}
                                        </span>
                                    </div>
                                    <button
                                        className={style.seatBtn}
                                        disabled={busy}
                                        onClick={() => run(() => onAssign(r.id, table.id))}
                                    >
                                        Seat here
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
