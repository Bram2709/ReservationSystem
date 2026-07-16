import type { FloorShape, RectTableShape } from "../../../types/shapes";
import { isTableShape } from "../../../types/shapes";
import style from "./PropertiesPanel.module.css";

interface Props {
    shapes: FloorShape[];
    selectedIds: string[];
    onUpdateShape: (id: string, updates: Partial<FloorShape>) => void;
    onBatchUpdate: (updates: { id: string; updates: Partial<FloorShape> }[]) => void;
    onDuplicateSelected: () => void;
    onDeleteSelected: () => void;
}

const TYPE_LABEL: Record<FloorShape["type"], string> = {
    "rect-table": "Rectangle table",
    "circle-table": "Round table",
    "wall": "Wall",
    "room-outline": "Room outline",
    "door": "Door",
    "window": "Window",
};

const num = (v: string, fallback = 0) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
};

export function PropertiesPanel({
    shapes,
    selectedIds,
    onUpdateShape,
    onBatchUpdate,
    onDuplicateSelected,
    onDeleteSelected,
}: Props) {
    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    const tables = shapes.filter(isTableShape);
    const totalSeats = tables.reduce((sum, t) => sum + t.maxSeats, 0);

    // --- Nothing selected: live capacity summary ---
    if (selected.length === 0) {
        return (
            <aside className={style.panel}>
                <div className={style.sectionTitle}>Room capacity</div>
                <div className={style.stats}>
                    <div className={style.stat}>
                        <span className={style.statValue}>{tables.length}</span>
                        <span className={style.statLabel}>tables</span>
                    </div>
                    <div className={style.stat}>
                        <span className={style.statValue}>{totalSeats}</span>
                        <span className={style.statLabel}>seats</span>
                    </div>
                </div>
                <p className={style.muted}>Select a shape to edit its properties.</p>

                <div className={style.sectionTitle}>Shortcuts</div>
                <ul className={style.shortcuts}>
                    <li><kbd>Del</kbd> delete selection</li>
                    <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> redo</li>
                    <li><kbd>Ctrl</kbd>+<kbd>D</kbd> duplicate</li>
                    <li><kbd>↑↓←→</kbd> nudge (<kbd>Shift</kbd> = larger)</li>
                    <li><kbd>Space</kbd>+drag pan · scroll zoom</li>
                </ul>
            </aside>
        );
    }

    // --- Multi-select: bulk actions ---
    if (selected.length > 1) {
        const rotate90 = () =>
            onBatchUpdate(
                selected
                    .filter((s) => s.type !== "room-outline")
                    .map((s) => ({ id: s.id, updates: { rotation: (s.rotation + 90) % 360 } }))
            );

        return (
            <aside className={style.panel}>
                <div className={style.sectionTitle}>{selected.length} shapes selected</div>
                <div className={style.actions}>
                    <button className={style.actionBtn} onClick={rotate90}>Rotate 90°</button>
                    <button className={style.actionBtn} onClick={onDuplicateSelected}>Duplicate</button>
                    <button className={style.deleteBtn} onClick={onDeleteSelected}>Delete selected</button>
                </div>
                <p className={style.muted}>Drag any selected shape to move the whole group.</p>
            </aside>
        );
    }

    // --- Single selection ---
    const shape = selected[0];

    return (
        <aside className={style.panel}>
            <span className={style.typeBadge}>{TYPE_LABEL[shape.type]}</span>

            {isTableShape(shape) && (
                <>
                    <div className={style.field}>
                        <label htmlFor="prop-number">Table number</label>
                        <input
                            id="prop-number"
                            type="number"
                            min={0}
                            value={shape.tableNumber || ""}
                            placeholder="auto on save"
                            onChange={(e) => onUpdateShape(shape.id, { tableNumber: num(e.target.value) })}
                        />
                    </div>

                    <div className={style.row}>
                        <div className={style.field}>
                            <label htmlFor="prop-min">Min seats</label>
                            <input
                                id="prop-min"
                                type="number"
                                min={1}
                                max={shape.maxSeats}
                                value={shape.minSeats}
                                onChange={(e) =>
                                    onUpdateShape(shape.id, {
                                        minSeats: Math.max(1, Math.min(num(e.target.value, 1), shape.maxSeats)),
                                    })
                                }
                            />
                        </div>
                        <div className={style.field}>
                            <label htmlFor="prop-max">Max seats</label>
                            <input
                                id="prop-max"
                                type="number"
                                min={shape.minSeats}
                                value={shape.maxSeats}
                                onChange={(e) =>
                                    onUpdateShape(shape.id, {
                                        maxSeats: Math.max(shape.minSeats, num(e.target.value, shape.minSeats)),
                                    })
                                }
                            />
                        </div>
                    </div>

                    {shape.type === "circle-table" && (
                        <div className={style.field}>
                            <label htmlFor="prop-chairs">Chairs shown</label>
                            <input
                                id="prop-chairs"
                                type="number"
                                min={0}
                                max={16}
                                value={shape.chairs}
                                onChange={(e) => onUpdateShape(shape.id, { chairs: Math.max(0, Math.min(16, num(e.target.value))) })}
                            />
                        </div>
                    )}

                    {shape.type === "rect-table" && (
                        <div className={style.field}>
                            <label>Chairs per side (top / right / bottom / left)</label>
                            <div className={style.chairRow}>
                                {(["top", "right", "bottom", "left"] as const).map((side, i) => (
                                    <input
                                        key={side}
                                        type="number"
                                        min={0}
                                        max={8}
                                        aria-label={`Chairs ${side}`}
                                        value={(shape as RectTableShape).chairsLayout[i]}
                                        onChange={(e) => {
                                            const layout = [...(shape as RectTableShape).chairsLayout] as [number, number, number, number];
                                            layout[i] = Math.max(0, Math.min(8, num(e.target.value)));
                                            onUpdateShape(shape.id, {
                                                chairsLayout: layout,
                                                chairs: layout.reduce((a, b) => a + b, 0),
                                            });
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {(shape.type === "wall" || shape.type === "door" || shape.type === "window") && (
                <div className={style.field}>
                    <label htmlFor="prop-length">Length</label>
                    <input
                        id="prop-length"
                        type="number"
                        min={10}
                        step={10}
                        value={shape.width}
                        onChange={(e) => onUpdateShape(shape.id, { width: Math.max(10, num(e.target.value, 10)) })}
                    />
                </div>
            )}

            {shape.type === "room-outline" ? (
                <p className={style.muted}>
                    Drag the corner handles on the canvas to reshape the room boundary
                    ({shape.points.length / 2} corners).
                </p>
            ) : (
                <div className={style.field}>
                    <label htmlFor="prop-rotation">Rotation (°)</label>
                    <input
                        id="prop-rotation"
                        type="number"
                        step={15}
                        value={Math.round(shape.rotation)}
                        onChange={(e) => onUpdateShape(shape.id, { rotation: num(e.target.value) })}
                    />
                </div>
            )}

            <div className={style.actions}>
                {shape.type !== "room-outline" && (
                    <button className={style.actionBtn} onClick={onDuplicateSelected}>Duplicate</button>
                )}
                <button className={style.deleteBtn} onClick={onDeleteSelected}>
                    Delete {TYPE_LABEL[shape.type].toLowerCase()}
                </button>
            </div>

            {isTableShape(shape) && (
                <p className={style.muted}>
                    Deleting a table unassigns its reservations (they are kept). Changes apply on save.
                </p>
            )}
        </aside>
    );
}
