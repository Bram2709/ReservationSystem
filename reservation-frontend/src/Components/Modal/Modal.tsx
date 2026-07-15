import { useEffect } from "react";
import style from "./Modal.module.css";

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className={style.backdrop} onClick={onClose}>
            <div
                className={style.modal}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <header className={style.header}>
                    <h2 className={style.title}>{title}</h2>
                    <button className={style.closeBtn} onClick={onClose} aria-label="Close">×</button>
                </header>
                {children}
            </div>
        </div>
    );
}
