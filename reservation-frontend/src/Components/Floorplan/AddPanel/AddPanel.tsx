import { TABLE_PRESETS, type TablePreset } from "../presets";
import style from "./AddPanel.module.css";

interface Props {
    onAddTable: (preset: TablePreset) => void;
    onAddRoomOutline: () => void;
    onAddWall: () => void;
    onAddDoor: () => void;
    onAddWindow: () => void;
    hasOutline: boolean;
}

/** Miniature CSS preview of a preset's footprint for its card. */
function PresetThumb({ preset }: { preset: TablePreset }) {
    if (preset.kind === "circle") {
        const d = Math.min(44, (preset.radius ?? 45) * 0.6);
        return <span className={style.thumbCircle} style={{ width: d, height: d }} />;
    }
    const w = Math.min(56, (preset.width ?? 150) * 0.3);
    const h = Math.min(40, (preset.height ?? 100) * 0.3);
    return <span className={style.thumbRect} style={{ width: w, height: h }} />;
}

export function AddPanel({ onAddTable, onAddRoomOutline, onAddWall, onAddDoor, onAddWindow, hasOutline }: Props) {
    return (
        <aside className={style.panel}>
            <div className={style.sectionTitle}>Tables</div>
            <div className={style.presetGrid}>
                {TABLE_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        className={style.presetCard}
                        onClick={() => onAddTable(preset)}
                        title={`Add a ${preset.label.toLowerCase()} table (${preset.seatsLabel})`}
                    >
                        <PresetThumb preset={preset} />
                        <span className={style.presetLabel}>{preset.label}</span>
                        <span className={style.presetSeats}>{preset.seatsLabel}</span>
                    </button>
                ))}
            </div>

            <div className={style.sectionTitle}>Structure</div>
            <div className={style.structureList}>
                <button type="button" className={style.structureBtn} onClick={onAddRoomOutline}>
                    <span className={style.structIconOutline} />
                    {hasOutline ? "Select room outline" : "Room outline"}
                </button>
                <button type="button" className={style.structureBtn} onClick={onAddWall}>
                    <span className={style.structIconWall} />
                    Wall
                </button>
                <button type="button" className={style.structureBtn} onClick={onAddDoor}>
                    <span className={style.structIconDoor} />
                    Door
                </button>
                <button type="button" className={style.structureBtn} onClick={onAddWindow}>
                    <span className={style.structIconWindow} />
                    Window
                </button>
            </div>

            <p className={style.hint}>
                Click a table to select it, Shift-click for multiple, or drag on empty canvas to
                marquee-select. Hold Space and drag to pan.
            </p>
        </aside>
    );
}
