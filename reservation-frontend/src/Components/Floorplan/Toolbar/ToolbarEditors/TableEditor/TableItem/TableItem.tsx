import style from './TableItem.module.css';

interface TableItemProps {
    name: string;
    size: string;
    shape: 'circle' | 'rect';
    onAdd?: () => void;
}

export function TableItem({ name, size, shape, onAdd }: TableItemProps) {
    return (
        <div className={style.card} onClick={onAdd}>
            <div className={style.preview}>
                {shape === 'circle'
                    ? <div className={style.circle} />
                    : <div className={style.rect} />}
            </div>
            <div className={style.footer}>
                <span className={style.name}>{name}</span>
                <span className={style.size}>{size}</span>
            </div>
        </div>
    );
}
