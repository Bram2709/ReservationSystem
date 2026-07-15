import { useState } from "react";
import { Modal } from "../../Components/Modal/Modal";
import type {
    CreateRestaurantPayload,
    Restaurant,
    UpdateRestaurantPayload,
} from "../../types/restaurant";
import { apiErrorMessage } from "../../utils/apiError";
import style from "../../styles/modalForm.module.css";

interface RestaurantFormProps {
    /** Null when creating. */
    restaurant: Restaurant | null;
    onClose: () => void;
    onCreate: (payload: CreateRestaurantPayload) => Promise<Restaurant>;
    onUpdate: (payload: UpdateRestaurantPayload) => Promise<Restaurant>;
}

export function RestaurantForm({ restaurant, onClose, onCreate, onUpdate }: RestaurantFormProps) {
    const isEdit = restaurant !== null;

    const [name, setName] = useState(restaurant?.name ?? "");
    const [address, setAddress] = useState(restaurant?.address ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = { name, address: address.trim() || null };

        try {
            if (isEdit) {
                await onUpdate({ ...payload, id: restaurant.id });
            } else {
                await onCreate(payload);
            }
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not save the restaurant. Please try again."));
            setSaving(false);
        }
    }

    return (
        <Modal title={isEdit ? "Edit restaurant" : "New restaurant"} onClose={onClose}>
            <form className={style.form} onSubmit={handleSubmit}>
                {error && <div className={style.error} role="alert">{error}</div>}

                <div className={style.field}>
                    <label htmlFor="restaurant-name">Name</label>
                    <input
                        id="restaurant-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        minLength={2}
                        maxLength={100}
                        required
                        autoFocus
                    />
                </div>

                <div className={style.field}>
                    <label htmlFor="restaurant-address">Address</label>
                    <input
                        id="restaurant-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        maxLength={200}
                        placeholder="Optional"
                    />
                </div>

                <footer className={style.footer}>
                    <button type="button" className={style.secondaryBtn} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={style.primaryBtn} disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Save changes" : "Create restaurant"}
                    </button>
                </footer>
            </form>
        </Modal>
    );
}
