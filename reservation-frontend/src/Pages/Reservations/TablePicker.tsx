import { useEffect, useState } from "react";
import { Modal } from "../../Components/Modal/Modal";
import { ReservationService } from "../../services/reservationService";
import type { Reservation, TableAvailability } from "../../types/reservation";
import { apiErrorMessage } from "../../utils/apiError";
import style from "./TablePicker.module.css";

interface TablePickerProps {
    reservation: Reservation;
    onClose: () => void;
    onAssign: (reservationId: string, tableId: string | null) => Promise<Reservation>;
}

export function TablePicker({ reservation, onClose, onAssign }: TablePickerProps) {
    const [tables, setTables] = useState<TableAvailability[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        ReservationService.getAvailableTables(reservation.id)
            .then((t) => { if (active) setTables(t); })
            .catch(() => { if (active) setLoadError("Could not load tables for this restaurant."); });
        return () => { active = false; };
    }, [reservation.id]);

    async function choose(tableId: string | null) {
        setSaving(true);
        setActionError(null);
        try {
            await onAssign(reservation.id, tableId);
            onClose();
        } catch (err) {
            setActionError(apiErrorMessage(err, "Could not assign that table. It may have just been taken."));
            setSaving(false);
        }
    }

    return (
        <Modal title={`Assign a table · ${reservation.name}`} onClose={onClose}>
            <div className={style.body}>
                <p className={style.meta}>
                    Party of {reservation.partySize} ·{" "}
                    {new Date(reservation.reservationDateTime).toLocaleString(undefined, {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                </p>

                {actionError && <div className={style.error} role="alert">{actionError}</div>}

                {loadError ? (
                    <div className={style.error}>{loadError}</div>
                ) : tables === null ? (
                    <p className={style.state}>Loading tables…</p>
                ) : tables.length === 0 ? (
                    <p className={style.state}>
                        This restaurant has no tables yet. Draw a floorplan for one of its rooms first.
                    </p>
                ) : (
                    <ul className={style.list}>
                        {tables.map((t) => {
                            // Occupied tables (other than the one already on this reservation) can't be picked.
                            const disabled = saving || (t.isOccupied && !t.isCurrent);
                            return (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        className={`${style.tableBtn} ${t.isCurrent ? style.current : ""}`}
                                        disabled={disabled}
                                        onClick={() => choose(t.id)}
                                    >
                                        <span className={style.tableName}>Table #{t.tableNumber}</span>
                                        <span className={style.tableSeats}>
                                            {t.minSeats}–{t.maxSeats} seats{t.roomName ? ` · ${t.roomName}` : ""}
                                        </span>
                                        <span className={style.tags}>
                                            {t.isCurrent && <span className={style.currentTag}>Current</span>}
                                            {t.isOccupied && !t.isCurrent && (
                                                <span className={style.takenTag}>
                                                    Taken{t.occupiedByName ? ` · ${t.occupiedByName}` : ""}
                                                </span>
                                            )}
                                            {!t.isOccupied && !t.fitsParty && (
                                                <span className={style.tightTag}>Too small</span>
                                            )}
                                            {!t.isOccupied && t.fitsParty && !t.isCurrent && (
                                                <span className={style.freeTag}>Free</span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <footer className={style.footer}>
                {reservation.tableId && (
                    <button
                        type="button"
                        className={style.unassignBtn}
                        disabled={saving}
                        onClick={() => choose(null)}
                    >
                        Unassign table
                    </button>
                )}
                <button type="button" className={style.secondaryBtn} onClick={onClose}>
                    Close
                </button>
            </footer>
        </Modal>
    );
}
