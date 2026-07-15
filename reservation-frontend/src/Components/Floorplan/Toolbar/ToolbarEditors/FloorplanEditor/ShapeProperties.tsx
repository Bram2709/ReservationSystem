import type { FloorShape } from '../../../../../types/shapes';
import style from './ShapeProperties.module.css';

interface Props {
    shape: FloorShape;
    onSetTableNumber: (id: string, tableNumber: number) => void;
    onUpdateShape: (id: string, updates: Partial<FloorShape>) => void;
    onDelete: (id: string) => void;
}

const LABEL: Record<string, string> = {
    'rect-table': 'Rectangle Table',
    'circle-table': 'Round Table',
    'wall': 'Wall',
    'room': 'Room',
};

export function ShapeProperties({ shape, onSetTableNumber, onUpdateShape, onDelete }: Props) {
    const isTable = shape.type === 'rect-table' || shape.type === 'circle-table';

    return (
        <div className={style.wrapper}>
            <span className={style.badge}>{LABEL[shape.type] ?? shape.type}</span>

            {isTable && (
                <div className={style.field}>
                    <label htmlFor="table-number">Table number</label>
                    <input
                        id="table-number"
                        type="number"
                        min={1}
                        value={shape.tableNumber ?? ''}
                        placeholder="e.g. 12"
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) onSetTableNumber(shape.id, val);
                        }}
                    />
                </div>
            )}

            {shape.type === 'room' && (
                <div className={style.field}>
                    <label htmlFor="room-label">Label</label>
                    <input
                        id="room-label"
                        type="text"
                        value={shape.label ?? ''}
                        placeholder="Room name"
                        onChange={(e) => onUpdateShape(shape.id, { label: e.target.value } as Partial<FloorShape>)}
                    />
                </div>
            )}

            {shape.type === 'rect-table' && (
                <div className={style.field}>
                    <label>Chairs (top / right / bottom / left)</label>
                    <input
                        type="text"
                        readOnly
                        value={shape.chairsLayout.join(' / ')}
                    />
                </div>
            )}

            {shape.type === 'circle-table' && (
                <div className={style.field}>
                    <label>Chairs</label>
                    <input
                        type="number"
                        min={1}
                        value={shape.chairs}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) onUpdateShape(shape.id, { chairs: val } as Partial<FloorShape>);
                        }}
                    />
                </div>
            )}

            <button
                type="button"
                className={style.deleteBtn}
                onClick={() => onDelete(shape.id)}
            >
                Delete {LABEL[shape.type]?.toLowerCase() ?? 'shape'}
            </button>
            {isTable && (
                <p className={style.deleteHint}>
                    Removing a table unassigns any reservations on it. Save to apply.
                </p>
            )}
        </div>
    );
}
