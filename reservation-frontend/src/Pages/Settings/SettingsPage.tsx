import { useEffect, useState } from "react";
import { useRestaurants } from "../../hooks/useRestaurants";
import { RestaurantService } from "../../services/restaurantService";
import { TeamService, ROLE_LABELS, type StaffCreated, type TeamMember } from "../../services/teamService";
import type { Restaurant, RestaurantSettings } from "../../types/restaurant";
import { apiErrorMessage } from "../../utils/apiError";
import style from "./SettingsPage.module.css";

/** minutes-from-midnight <-> "HH:mm" for <input type="time"> */
const toTime = (minutes: number | null): string =>
    minutes === null ? "" : `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const toMinutes = (time: string): number | null => {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

const SERVICES = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
] as const;

function RestaurantSettingsCard({ restaurant }: { restaurant: Restaurant }) {
    const { refresh } = useRestaurants();
    const [form, setForm] = useState<RestaurantSettings>(restaurant.settings);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Re-sync when the cache refreshes with new server state.
    useEffect(() => setForm(restaurant.settings), [restaurant.settings]);

    const set = (patch: Partial<RestaurantSettings>) => {
        setNotice(null);
        setForm((f) => ({ ...f, ...patch }));
    };

    async function save() {
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            await RestaurantService.updateSettings(restaurant.id, form);
            await refresh();
            setNotice("Settings saved.");
        } catch (err) {
            setError(apiErrorMessage(err, "Could not save the settings."));
        } finally {
            setSaving(false);
        }
    }

    const windowFor = (key: (typeof SERVICES)[number]["key"]) =>
        key === "breakfast"
            ? [form.breakfastStart, form.breakfastEnd]
            : key === "lunch"
                ? [form.lunchStart, form.lunchEnd]
                : [form.dinnerStart, form.dinnerEnd];

    const setWindow = (key: (typeof SERVICES)[number]["key"], which: "start" | "end", value: number | null) => {
        const field = `${key}${which === "start" ? "Start" : "End"}` as keyof RestaurantSettings;
        set({ [field]: value } as Partial<RestaurantSettings>);
    };

    return (
        <section className={style.card}>
            <h2 className={style.cardTitle}>{restaurant.name}</h2>

            <div className={style.sectionTitle}>Service hours <span className={style.hintInline}>(leave empty = no restriction)</span></div>
            <div className={style.windows}>
                {SERVICES.map(({ key, label }) => {
                    const [start, end] = windowFor(key);
                    return (
                        <div key={key} className={style.windowRow}>
                            <span className={style.windowLabel}>{label}</span>
                            <input
                                type="time"
                                value={toTime(start)}
                                onChange={(e) => setWindow(key, "start", toMinutes(e.target.value))}
                                aria-label={`${label} opens`}
                            />
                            <span className={style.windowDash}>–</span>
                            <input
                                type="time"
                                value={toTime(end)}
                                onChange={(e) => setWindow(key, "end", toMinutes(e.target.value))}
                                aria-label={`${label} closes`}
                            />
                        </div>
                    );
                })}
            </div>

            <div className={style.row}>
                <div className={style.field}>
                    <label htmlFor={`dur-${restaurant.id}`}>Table hold (minutes)</label>
                    <input
                        id={`dur-${restaurant.id}`}
                        type="number"
                        min={15}
                        max={720}
                        step={15}
                        value={form.defaultDurationMinutes}
                        onChange={(e) => set({ defaultDurationMinutes: Math.max(15, parseInt(e.target.value, 10) || 120) })}
                    />
                    <span className={style.hint}>How long a reservation blocks its table.</span>
                </div>
                <div className={style.field}>
                    <label htmlFor={`cap-${restaurant.id}`}>Max guests per service</label>
                    <input
                        id={`cap-${restaurant.id}`}
                        type="number"
                        min={1}
                        placeholder="No limit"
                        value={form.maxCoversPerService ?? ""}
                        onChange={(e) => set({ maxCoversPerService: e.target.value === "" ? null : Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    />
                    <span className={style.hint}>Kitchen capacity guard. Empty = unlimited.</span>
                </div>
            </div>

            {notice && <div className={style.notice} role="status">{notice}</div>}
            {error && <div className={style.error} role="alert">{error}</div>}

            <button className={style.saveBtn} onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save settings"}
            </button>
        </section>
    );
}

function TeamSection() {
    const [team, setTeam] = useState<TeamMember[] | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [invited, setInvited] = useState<StaffCreated | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    const load = () =>
        TeamService.getTeam()
            .then(setTeam)
            .catch((err) => {
                // Staff accounts get 403 here — team management is owner-only.
                if (err?.response?.status === 403) setForbidden(true);
                else setError("Could not load the team.");
            });

    useEffect(() => { void load(); }, []);

    async function invite(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setInvited(null);
        try {
            const created = await TeamService.inviteStaff(inviteEmail);
            setInvited(created);
            setInviteEmail("");
            await load();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not create the staff account."));
        } finally {
            setBusy(false);
        }
    }

    async function remove(id: string) {
        setError(null);
        try {
            await TeamService.removeStaff(id);
            await load();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not remove that member."));
        }
    }

    if (forbidden) return null;

    return (
        <section className={style.card}>
            <h2 className={style.cardTitle}>Team</h2>
            <p className={style.hint}>
                Staff accounts can manage reservations and the floor, but not the team or settings.
            </p>

            <form className={style.inviteRow} onSubmit={invite}>
                <input
                    type="email"
                    placeholder="colleague@restaurant.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                />
                <button className={style.saveBtn} type="submit" disabled={busy}>
                    {busy ? "Adding…" : "Add staff member"}
                </button>
            </form>

            {invited && (
                <div className={style.notice} role="status">
                    Account created for <strong>{invited.email}</strong>. Temporary password:{" "}
                    <code className={style.tempPw}>{invited.tempPassword}</code> — also emailed to them.
                    This is shown only once.
                </div>
            )}
            {error && <div className={style.error} role="alert">{error}</div>}

            {team === null ? (
                <p className={style.hint}>Loading…</p>
            ) : (
                <ul className={style.teamList}>
                    {team.map((m) => (
                        <li key={m.id} className={style.teamRow}>
                            <div className={style.teamMain}>
                                <span className={style.teamEmail}>{m.email}</span>
                                <span className={style.teamMeta}>
                                    {ROLE_LABELS[m.role] ?? "Member"}{!m.isActive && " · deactivated"}
                                </span>
                            </div>
                            {m.role !== 0 && m.isActive && (
                                <button className={style.removeBtn} onClick={() => remove(m.id)}>
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function SettingsPage() {
    const { restaurants, loading } = useRestaurants();

    return (
        <div className={style.wrapper}>
            <header>
                <h1 className={style.title}>Settings</h1>
                <p className={style.subtitle}>Opening hours, capacity, and your team.</p>
            </header>

            {loading ? (
                <p className={style.hint}>Loading…</p>
            ) : restaurants.length === 0 ? (
                <p className={style.hint}>Create a restaurant first — its settings will appear here.</p>
            ) : (
                restaurants.map((r) => <RestaurantSettingsCard key={r.id} restaurant={r} />)
            )}

            <TeamSection />
        </div>
    );
}
