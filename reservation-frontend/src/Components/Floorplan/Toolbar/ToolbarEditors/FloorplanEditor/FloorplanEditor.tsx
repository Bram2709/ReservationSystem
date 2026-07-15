import { EditorBase } from '../EditorBase';
import style from './FloorplanEditor.module.css';
import { ShapeProperties } from './ShapeProperties';
import type { FloorShape } from '../../../../../types/shapes';

interface Props {
    selectedShape?: FloorShape;
    onSetTableNumber: (id: string, tableNumber: number) => void;
    onUpdateShape: (id: string, updates: Partial<FloorShape>) => void;
    onDeleteShape: (id: string) => void;
}

export function FloorplanEditor({ selectedShape, onSetTableNumber, onUpdateShape, onDeleteShape }: Props) {
    return (
        <EditorBase title="Properties">
            <div className={style.wrapper}>
                {selectedShape ? (
                    <ShapeProperties
                        shape={selectedShape}
                        onSetTableNumber={onSetTableNumber}
                        onUpdateShape={onUpdateShape}
                        onDelete={onDeleteShape}
                    />
                ) : (
                    <p className={style.empty}>Select a shape on the canvas to edit its properties.</p>
                )}
            </div>
        </EditorBase>
    );
}