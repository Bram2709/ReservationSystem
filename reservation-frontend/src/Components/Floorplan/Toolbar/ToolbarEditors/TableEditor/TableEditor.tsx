import { EditorBase } from '../EditorBase';
import { TableItem } from './TableItem/TableItem';

interface Props {
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddWall: () => void;
  onGroupAsRoom: () => void;
  selectedWallCount: number;
  onAddRectWithSideChair: () => void;
  onAddRectWithSideChairs: () => void;
}

export function TableEditor({ onAddRect, onAddCircle, onAddRectWithSideChair }: Props) {
    return (
        <EditorBase title="Tables" tip="Hold SHIFT to snap assets to the 24px grid while dragging.">
            <TableItem name="Round 2p" size="ø 90cm" shape="circle"  onAdd={onAddCircle}/>
            <TableItem name="Square 4p" size="110×110cm" shape="rect" onAdd={onAddRect}/>
            <TableItem name="Round 4p" size="ø 120cm" shape="circle" onAdd={onAddCircle}/>
            <TableItem name="Rect 6p" size="160×90cm" shape="rect" onAdd={onAddRectWithSideChair}/>
        </EditorBase>
    );
}