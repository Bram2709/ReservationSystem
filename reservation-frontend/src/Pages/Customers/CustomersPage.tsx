import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ReservationService } from "../../services/reservationService";
import type { Customer } from "../../types/reservation";
import style from "./CustomersPage.module.css";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        ReservationService.getCustomers()
            .then(setCustomers)
            .catch(() => setError("Could not load customers."));
    }, []);

    const visible = useMemo(() => {
        if (!customers) return [];
        const term = search.trim().toLowerCase();
        if (!term) return customers;
        return customers.filter((c) =>
            c.name.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            c.phoneNumber.toLowerCase().includes(term)
        );
    }, [customers, search]);

    return (
        <div className={style.wrapper}>
            <header className={style.header}>
                <div>
                    <h1 className={style.title}>Customers</h1>
                    <p className={style.subtitle}>
                        Every guest who has ever booked, built from your reservation history.
                    </p>
                </div>
                <input
                    className={style.search}
                    type="search"
                    placeholder="Search name, email or phone…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search customers"
                />
            </header>

            {error && <div className={style.error} role="alert">{error}</div>}

            {customers === null ? (
                <div className={style.stateCard}>Loading customers…</div>
            ) : visible.length === 0 ? (
                <div className={style.stateCard}>
                    {customers.length === 0
                        ? "No guests yet — they appear here after their first reservation."
                        : "No customers match your search."}
                </div>
            ) : (
                <div className={style.tableScroll}>
                    <table className={style.table}>
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Visits</th>
                                <th>Guests total</th>
                                <th>No-shows</th>
                                <th>Last visit</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((c) => (
                                <tr key={c.email}>
                                    <td>
                                        <div className={style.guestName}>{c.name}</div>
                                        <div className={style.guestMeta}>{c.email}</div>
                                        <div className={style.guestMeta}>{c.phoneNumber}</div>
                                    </td>
                                    <td>{c.totalReservations}</td>
                                    <td>{c.totalGuests}</td>
                                    <td>
                                        {c.noShows > 0
                                            ? <span className={style.noShowBadge}>{c.noShows}</span>
                                            : <span className={style.zero}>0</span>}
                                    </td>
                                    <td>{formatDate(c.lastVisit)}</td>
                                    <td className={style.actions}>
                                        <Link className={style.ghostBtn} to="/reservations">
                                            Reservations
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
