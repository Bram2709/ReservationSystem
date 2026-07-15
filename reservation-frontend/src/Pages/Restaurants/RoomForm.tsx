import { useState } from "react";
import { Modal } from "../../Components/Modal/Modal";
import type {
    CreateRoomPayload,
    Room,
    UpdateRoomPayload,
} from "../../types/restaurant";
import { apiErrorMessage } from "../../utils/apiError";
import style from "../../styles/modalForm.module.css";

interface RoomFormProps {
    /** Null when creating. */
    room: Room | null;
    /** The restaurant a new room is created under. */
    restaurantId: string;
    restaurantName: string;
    onClose: () => void;
    onCreate: (payload: CreateRoomPayload) => Promise<Room>;
    onUpdate: (payload: UpdateRoomPayload) => Promise<Room>;
}

export function RoomForm({
    room,
    restaurantId,
    restaurantName,
    onClose,
    onCreate,
    onUpdate,
}: RoomFormProps) {
    const isEdit = room !== null;

    const [name, setName] = useState(room?.name ?? "");
    const [isActive, setIsActive] = useState(room?.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (isEdit) {
                await onUpdate({ id: room.id, name, isActive });
            } else {
                await onCreate({ name, isActive, restaurantId });
            }
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not save the room. Please try again."));
            setSaving(false);
        }
    }

    return (
        <Modal title={isEdit ? "Edit room" : `New room in ${restaurantName}`} onClose={onClose}>
            <form className={style.form} onSubmit={handleSubmit}>
                {error && <div className={style.error} role="alert">{error}</div>}

                <div className={style.field}>
                    <label htmlFor="room-name">Name</label>
                    <input
                        id="room-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        minLength={2}
                        maxLength={100}
                        placeholder="Terrace, Main hall, Private dining…"
                        required
                        autoFocus
                    />
                </div>

                <label className={style.checkboxField} htmlFor="room-active">
                    <input
                        id="room-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>
                        <span className={style.checkboxLabel}>Accepting reservations</span>
                        <span className={style.hint} style={{ display: "block" }}>
                            Inactive rooms stay on the floorplan but are closed for bookings.
                        </span>
                    </span>
                </label>

                <footer className={style.footer}>
                    <button type="button" className={style.secondaryBtn} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={style.primaryBtn} disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Save changes" : "Create room"}
                    </button>
                </footer>
            </form>
        </Modal>
    );
}
