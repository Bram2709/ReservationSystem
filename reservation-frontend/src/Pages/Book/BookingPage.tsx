import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    PublicBookingService,
    type PublicAvailability,
    type PublicBookingResult,
    type PublicRestaurant,
} from "../../services/publicBookingService";
import { TIME_FRAME_LABELS, type TimeFrame } from "../../types/reservation";
import { apiErrorMessage } from "../../utils/apiError";
import style from "./BookingPage.module.css";

function todayIso(): string {
    return new Date().toLocaleDateString("en-CA");
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function BookingPage() {
    const { restaurantId } = useParams<{ restaurantId: string }>();

    const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null);
    const [notFound, setNotFound] = useState(false);

    const [date, setDate] = useState(todayIso());
    const [partySize, setPartySize] = useState(2);
    const [availability, setAvailability] = useState<PublicAvailability[] | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [selected, setSelected] = useState<{ timeFrame: TimeFrame; slot: string } | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<PublicBookingResult | null>(null);

    useEffect(() => {
        if (!restaurantId) return;
        PublicBookingService.getRestaurant(restaurantId)
            .then(setRestaurant)
            .catch(() => setNotFound(true));
    }, [restaurantId]);

    const loadAvailability = useCallback(() => {
        if (!restaurantId) return;
        setLoadingSlots(true);
        setSelected(null);
        PublicBookingService.getAvailability(restaurantId, date, partySize)
            .then(setAvailability)
            .catch(() => setAvailability([]))
            .finally(() => setLoadingSlots(false));
    }, [restaurantId, date, partySize]);

    useEffect(() => {
        void loadAvailability();
    }, [loadAvailability]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!restaurantId || !selected) return;
        setSubmitting(true);
        setError(null);
        try {
            const result = await PublicBookingService.book(restaurantId, {
                name,
                email,
                phoneNumber: phone,
                description: notes,
                partySize,
                timeFrame: selected.timeFrame,
                // Slot times are local wall-clock; send the absolute instant.
                reservationDateTime: new Date(`${date}T${selected.slot}:00`).toISOString(),
            });
            setConfirmation(result);
        } catch (err) {
            setError(apiErrorMessage(err, "Something went wrong — please try again."));
            // The slot may have just been taken; show the guest what's still open.
            loadAvailability();
        } finally {
            setSubmitting(false);
        }
    }

    if (notFound) {
        return (
            <div className={style.page}>
                <div className={style.card}>
                    <h1 className={style.title}>Restaurant not found</h1>
                    <p className={style.muted}>This booking link doesn't seem to be valid.</p>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className={style.page}>
                <div className={style.card}><p className={style.muted}>Loading…</p></div>
            </div>
        );
    }

    if (confirmation) {
        const when = new Date(confirmation.reservationDateTime);
        return (
            <div className={style.page}>
                <div className={style.card}>
                    <div className={style.checkmark}>✓</div>
                    <h1 className={style.title}>You're booked!</h1>
                    <p className={style.summary}>
                        <strong>{confirmation.restaurantName}</strong><br />
                        {when.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}{" "}
                        at {when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}<br />
                        {confirmation.partySize} guest{confirmation.partySize === 1 ? "" : "s"}
                    </p>
                    <p className={style.muted}>A confirmation email is on its way to {email}.</p>
                    <button
                        className={style.linkBtn}
                        onClick={() => { setConfirmation(null); setSelected(null); loadAvailability(); }}
                    >
                        Make another booking
                    </button>
                </div>
            </div>
        );
    }

    const bookableServices = availability?.filter((a) => a.slots.length > 0) ?? [];

    return (
        <div className={style.page}>
            <div className={style.card}>
                <header className={style.head}>
                    <h1 className={style.title}>{restaurant.name}</h1>
                    {restaurant.address && <p className={style.muted}>{restaurant.address}</p>}
                    <p className={style.subtitle}>Book a table</p>
                </header>

                {restaurant.services.length === 0 ? (
                    <p className={style.muted}>
                        Online booking isn't available for this restaurant yet — please contact them directly.
                    </p>
                ) : (
                    <>
                        <div className={style.controls}>
                            <label className={style.control}>
                                <span>Date</span>
                                <input
                                    type="date"
                                    value={date}
                                    min={todayIso()}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </label>
                            <label className={style.control}>
                                <span>Guests</span>
                                <select value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
                                    {PARTY_SIZES.map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {loadingSlots ? (
                            <p className={style.muted}>Checking availability…</p>
                        ) : bookableServices.length === 0 ? (
                            <p className={style.noSlots}>
                                No tables available for {partySize} guest{partySize === 1 ? "" : "s"} on this day —
                                try another date or party size.
                            </p>
                        ) : (
                            bookableServices.map((service) => (
                                <div key={service.timeFrame} className={style.serviceBlock}>
                                    <div className={style.serviceName}>{TIME_FRAME_LABELS[service.timeFrame]}</div>
                                    <div className={style.slots}>
                                        {service.slots.map((slot) => {
                                            const isSelected =
                                                selected?.timeFrame === service.timeFrame && selected.slot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    className={isSelected ? style.slotSelected : style.slot}
                                                    onClick={() => setSelected({ timeFrame: service.timeFrame, slot })}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}

                        {selected && (
                            <form className={style.form} onSubmit={handleSubmit}>
                                <div className={style.formTitle}>
                                    Booking for {selected.slot} · {partySize} guest{partySize === 1 ? "" : "s"}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    minLength={2}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                                <textarea
                                    rows={2}
                                    placeholder="Allergies, wishes, occasion… (optional)"
                                    value={notes}
                                    maxLength={500}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                {error && <div className={style.error} role="alert">{error}</div>}
                                <button className={style.bookBtn} type="submit" disabled={submitting}>
                                    {submitting ? "Booking…" : `Confirm booking`}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
