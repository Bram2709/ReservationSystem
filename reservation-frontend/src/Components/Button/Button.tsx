import style from './Button.module.css';

export function Button({ text, onClick }: { text: string, onClick: () => void }) {
    return (
        <button className={style.button} onClick={onClick}>
            {text}
        </button>
    );
}