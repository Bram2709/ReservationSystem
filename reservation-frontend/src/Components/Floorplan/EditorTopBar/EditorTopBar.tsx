import style from "./EditorTopBar.module.css";

export interface EditorRoomOption {
    id: string;
    name: string;
    restaurantName: string;
}

interface Props {
    rooms: EditorRoomOption[];
    selectedRoomId: string;
    onRoomChange: (id: string) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
    onZoomReset: () => void;
    dirty: boolean;
    saving: boolean;
    onSave: () => void;
}

export function EditorTopBar({
    rooms,
    selectedRoomId,
    onRoomChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomFit,
    onZoomReset,
    dirty,
    saving,
    onSave,
}: Props) {
    return (
        <div className={style.bar}>
            <div className={style.group}>
                <label className={style.label} htmlFor="editor-room">Room</label>
                <select
                    id="editor-room"
                    className={style.roomSelect}
                    value={selectedRoomId}
                    onChange={(e) => onRoomChange(e.target.value)}
                >
                    {rooms.length === 0 && <option value="">No rooms yet</option>}
                    {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} · {r.restaurantName}</option>
                    ))}
                </select>
            </div>

            <div className={style.group}>
                <button className={style.iconBtn} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</button>
                <button className={style.iconBtn} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">↪</button>
            </div>

            <div className={style.group}>
                <button className={style.iconBtn} onClick={onZoomOut} title="Zoom out">−</button>
                <button className={style.zoomLabel} onClick={onZoomReset} title="Reset zoom">
                    {Math.round(zoom * 100)}%
                </button>
                <button className={style.iconBtn} onClick={onZoomIn} title="Zoom in">+</button>
                <button className={style.textBtn} onClick={onZoomFit} title="Fit the whole plan in view">Fit</button>
            </div>

            <div className={style.spacer} />

            {dirty && <span className={style.dirtyPill}>Unsaved changes</span>}

            <button className={style.saveBtn} onClick={onSave} disabled={saving || !selectedRoomId}>
                {saving ? "Saving…" : "Save floorplan"}
            </button>
        </div>
    );
}
