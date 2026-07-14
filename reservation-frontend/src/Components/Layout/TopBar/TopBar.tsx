import style from "./TopBar.module.css";

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    return (
        <div className={style.wrapper}>
            <div className={style.leftSideWrapper}>
                <button className={style.menuButton} onClick={onMenuClick} aria-label="Open menu">
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect y="1" width="20" height="2" rx="1" fill="currentColor"/><rect y="6" width="20" height="2" rx="1" fill="currentColor"/><rect y="11" width="20" height="2" rx="1" fill="currentColor"/></svg>
                </button>
                <div className={style.brandMobile}></div>
            </div>

            <div className={style.centerWrapper}>
                <div className={style.searchDesktop}>
                    <input className={style.searchInput} placeholder="Search guests, tables, or events..." />
                </div>
            </div>

            <div className={style.rightSideWrapper}>
                <button className={style.iconButton} aria-label="Search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>

                <div className={style.userWrap}>
                    <img className={style.profileImg} src="/profile.png" alt="Profile" />
                </div>
            </div>
        </div>
    );
}