import style from './DropdownMenu.module.css';

interface DropdownMenuProps {
    onMenuClick: () => void;
}

export function DropdownMenu({ onMenuClick }: Readonly<DropdownMenuProps>) {
    return (
        <div className={style.wrapper}>
            <input type='image' className={style.menuButtonImg} src="/menu.png" alt="Menu" onClick={onMenuClick} />
        </div>
    )
}