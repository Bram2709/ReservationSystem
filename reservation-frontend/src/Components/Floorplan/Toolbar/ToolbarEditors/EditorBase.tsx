import style from './EditorBase.module.css';

interface EditorBaseProps {
    title: string;
    tip?: string;
    children?: React.ReactNode;
}

export function EditorBase({ title, tip, children }: EditorBaseProps) {
    return (
        <div className={style.popout}>
            <div className={style.header}>
                <span>{title}</span>
                {/* filter icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>
            <div className={style.body}>{children}</div>
            {/* {tip && (
                <div className={style.tip}>
                    <span className={style.tipLabel}>PRO TIP</span>
                    <p>{tip}</p>
                </div>
            )} */}
        </div>
    );
}