import { useEffect, useState } from "react";
import { TIME_FRAME_LABELS, TimeFrame } from "../../types/reservation";
import type {
    CreateReservationPayload,
    Reservation,
    UpdateReservationPayload,
} from "../../types/reservation";
import type { Restaurant } from "../../types/restaurant";
import { Modal } from "../../Components/Modal/Modal";
import { apiErrorMessage } from "../../utils/apiError";
import style from "../../styles/modalForm.module.css";

interface ReservationFormProps {
    /** Null when creating a new reservation. */
    reservation: Reservation | null;
    restaurants: Restaurant[];
    onClose: () => void;
    onCreate: (payload: CreateReservationPayload) => Promise<Reservation>;
    onUpdate: (payload: UpdateReservationPayload) => Promise<Reservation>;
}

/** `<input type="datetime-local">` wants `yyyy-MM-ddTHH:mm` in local time. */
function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function defaultDateTime(): string {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    const offset = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function ReservationForm({
    reservation,
    restaurants,
    onClose,
    onCreate,
    onUpdate,
}: ReservationFormProps) {
    const isEdit = reservation !== null;

    const [name, setName] = useState(reservation?.name ?? "");
    const [email, setEmail] = useState(reservation?.email ?? "");
    const [phoneNumber, setPhoneNumber] = useState(reservation?.phoneNumber ?? "");
    const [description, setDescription] = useState(reservation?.description ?? "");
    const [partySize, setPartySize] = useState(reservation?.partySize ?? 2);
    const [timeFrame, setTimeFrame] = useState<TimeFrame>(reservation?.timeFrame ?? TimeFrame.Dinner);
    const [dateTime, setDateTime] = useState(
        reservation ? toLocalInputValue(reservation.reservationDateTime) : defaultDateTime()
    );
    const [restaurantId, setRestaurantId] = useState(
        reservation?.restaurantId ?? restaurants[0]?.id ?? ""
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Restaurants load asynchronously; select the first one once it arrives.
    useEffect(() => {
        if (!isEdit && !restaurantId && restaurants.length > 0) {
            setRestaurantId(restaurants[0].id);
        }
    }, [isEdit, restaurantId, restaurants]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // datetime-local has no timezone; treat it as local and send an absolute instant.
        const reservationDateTime = new Date(dateTime).toISOString();

        try {
            if (isEdit) {
                await onUpdate({
                    id: reservation.id,
                    name,
                    email,
                    phoneNumber,
                    description,
                    partySize,
                    timeFrame,
                    reservationDateTime,
                    tableId: reservation.tableId,
                });
            } else {
                await onCreate({
                    name,
                    email,
                    phoneNumber,
                    description,
                    partySize,
                    timeFrame,
                    reservationDateTime,
                    restaurantId,
                });
            }
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not save the reservation. Please check the fields and try again."));
            setSaving(false);
        }
    }

    return (
        <Modal title={isEdit ? "Edit reservation" : "New reservation"} onClose={onClose}>
            <form className={style.form} onSubmit={handleSubmit}>
                    {error && <div className={style.error} role="alert">{error}</div>}

                    <div className={style.field}>
                        <label htmlFor="res-name">Guest name</label>
                        <input
                            id="res-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            minLength={2}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className={style.row}>
                        <div className={style.field}>
                            <label htmlFor="res-email">Email</label>
                            <input
                                id="res-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className={style.field}>
                            <label htmlFor="res-phone">Phone</label>
                            <input
                                id="res-phone"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={style.row}>
                        <div className={style.field}>
                            <label htmlFor="res-datetime">Date &amp; time</label>
                            <input
                                id="res-datetime"
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className={style.field}>
                            <label htmlFor="res-party">Party size</label>
                            <input
                                id="res-party"
                                type="number"
                                min={1}
                                max={50}
                                value={partySize}
                                onChange={(e) => setPartySize(Number(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    <div className={style.row}>
                        <div className={style.field}>
                            <label htmlFor="res-timeframe">Service</label>
                            <select
                                id="res-timeframe"
                                value={timeFrame}
                                onChange={(e) => setTimeFrame(Number(e.target.value) as TimeFrame)}
                            >
                                {Object.values(TimeFrame).map((tf) => (
                                    <option key={tf} value={tf}>{TIME_FRAME_LABELS[tf]}</option>
                                ))}
                            </select>
                        </div>
                        <div className={style.field}>
                            <label htmlFor="res-restaurant">Restaurant</label>
                            <select
                                id="res-restaurant"
                                value={restaurantId}
                                onChange={(e) => setRestaurantId(e.target.value)}
                                // The API ties a reservation to its restaurant at creation time.
                                disabled={isEdit}
                                required
                            >
                                {restaurants.length === 0 && <option value="">No restaurants yet</option>}
                                {restaurants.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={style.field}>
                        <label htmlFor="res-notes">Notes</label>
                        <textarea
                            id="res-notes"
                            rows={3}
                            maxLength={500}
                            placeholder="Allergies, seating preferences, occasion…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <footer className={style.footer}>
                        <button type="button" className={style.secondaryBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={style.primaryBtn}
                            disabled={saving || (!isEdit && !restaurantId)}
                        >
                            {saving ? "Saving…" : isEdit ? "Save changes" : "Create reservation"}
                        </button>
                    </footer>
            </form>
        </Modal>
    );
}
