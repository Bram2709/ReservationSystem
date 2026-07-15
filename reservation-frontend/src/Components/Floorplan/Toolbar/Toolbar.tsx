import { useState } from 'react';
import style from './Toolbar.module.css';
import { TableEditor } from './ToolbarEditors/TableEditor/TableEditor';
import { Editor2 } from './ToolbarEditors/Editor2/Editor2';
import { FloorplanEditor } from './ToolbarEditors/FloorplanEditor/FloorplanEditor';
import type { FloorShape } from '../../../types/shapes';

interface Props {
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddWall: () => void;
  onGroupAsRoom: () => void;
  selectedWallCount: number;
  onAddRectWithSideChair: () => void;
  onAddRectWithSideChairs: () => void;
  onSaveFloorplan: () => void;
  selectedShape?: FloorShape;
  onSetTableNumber: (id: string, tableNumber: number) => void;
  onUpdateShape: (id: string, updates: Partial<FloorShape>) => void;
  onDeleteShape: (id: string) => void;
}

export function Toolbar({ onAddRect, onAddCircle, onAddWall, onGroupAsRoom, selectedWallCount, onAddRectWithSideChair, onAddRectWithSideChairs, onSaveFloorplan, selectedShape, onSetTableNumber, onUpdateShape, onDeleteShape }: Props) {
    const [open, setOpen] = useState(false);

    const [activeEditor, setActiveEditor] = useState<string | null>(null);

    function toggleEditor(name: string) {
        setActiveEditor(current => current === name ? null : name);
    }

    return (
        <div className={`${style.wrapper} ${open ? style.open : ''}`}>
            <button
                className={style.toggleBtn}
                onClick={() => setOpen(o => !o)}
                aria-label={open ? 'Close toolbar' : 'Open toolbar'}
            >
                {open ? '›' : '‹'}
            </button>

            <div className={style.editorPopout}>
                { activeEditor === 'table' ? <TableEditor onAddRect={onAddRect} onAddCircle={onAddCircle} onAddWall={onAddWall} onGroupAsRoom={onGroupAsRoom} selectedWallCount={selectedWallCount} onAddRectWithSideChair={onAddRectWithSideChair} onAddRectWithSideChairs={onAddRectWithSideChairs} /> : null }
                { activeEditor === 'editor2' ? <Editor2 /> : null }
                { activeEditor === 'floorplanEditor' ? <FloorplanEditor selectedShape={selectedShape} onSetTableNumber={onSetTableNumber} onUpdateShape={onUpdateShape} onDeleteShape={onDeleteShape} /> : null }
            </div>

            <div className={style.wrappercontent}>
                <ul className={style.editoroptions}>
                    <li className={activeEditor === 'table' ? style.active : ''} onClick={() => toggleEditor('table')}>
                        <img className={style.tableType} src="src\assets\Icons\black\table_restaurant.svg" alt="Tables"/>
                    </li>
                    <li className={activeEditor === 'editor2' ? style.active : ''} onClick={() => toggleEditor('editor2')}>
                        <img className={style.tableType} src="src\assets\Icons\black\highlighter.svg" alt="Editor 2"/>
                    </li>
                    <li className={activeEditor === 'floorplans' ? style.active : ""} onClick={() => toggleEditor('floorplanEditor')}>
                        <img className={style.tableType} src="src\assets\Icons\black\layers.svg" alt="Floorplan Editor"/>
                    </li>
                    <li onClick={onSaveFloorplan}>
                        <img className={style.tableType} src="src\assets\Icons\black\save.svg" alt="Save"/>
                    </li>
                </ul>

                <button className={style.infoBtn} aria-label="Info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                </button>
            </div>


            {/* <div className={style.content}>
                <ul className={style.tableTypeList}>
                    <li><img className={style.tableType} src="/table4.png" alt="Logo" onClick={onAddRect}/></li>
                    <li><img className={style.tableType} src="/table5.png" alt="Logo" onClick={onAddRectWithSideChair}/></li>
                </ul>

                <button className={style.button} onClick={onAddRect}>Add Rectangle Table</button>
                <button className={style.button} onClick={onAddRectWithSideChair}>Add Rectangle Table with Side Chair</button>
                <button className={style.button} onClick={onAddRectWithSideChairs}>Add Rectangle Table with Side Chairs</button>

                <button className={style.button} onClick={onAddCircle}>Add Round Table</button>
                <button className={style.button} onClick={onAddWall}>Add Wall</button>
                <button
                    className={style.button}
                    onClick={onGroupAsRoom}
                    disabled={selectedWallCount < 2}
                    title={selectedWallCount < 2 ? 'Shift-click 2+ walls to group' : `Group ${selectedWallCount} walls into a room`}
                    style={{ opacity: selectedWallCount < 2 ? 0.5 : 1 }}
                >
                    Group as Room {selectedWallCount > 0 ? `(${selectedWallCount})` : ''}
                </button>
                <button className={style.button} onClick={saveFloorPlan}>Save Floorplan</button>

                <select></select>
            </div> */}
        </div>
    );
}