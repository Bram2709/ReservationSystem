import { EditorBase } from '../EditorBase';
import style from './FloorplanEditor.module.css';
import { ShapeProperties } from './ShapeProperties';
import type { FloorShape } from '../../../../../types/shapes';

interface Props {
    selectedShape?: FloorShape;
    onSetTableNumber: (id: string, tableNumber: number) => void;
    onUpdateShape: (id: string, updates: Partial<FloorShape>) => void;
}

export function FloorplanEditor({ selectedShape, onSetTableNumber, onUpdateShape }: Props) {
    return (
        <EditorBase title="Properties">
            <div className={style.wrapper}>
                {selectedShape ? (
                    <ShapeProperties
                        shape={selectedShape}
                        onSetTableNumber={onSetTableNumber}
                        onUpdateShape={onUpdateShape}
                    />
                ) : (
                    <p className={style.empty}>Select a shape on the canvas to edit its properties.</p>
                )}
            </div>
        </EditorBase>
    );
}