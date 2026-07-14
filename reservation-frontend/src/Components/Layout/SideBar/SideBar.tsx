import { Link } from "react-router";
import style from "./SideBar.module.css";
import { authService } from "../../../services/authService";

interface SideBarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function SideBar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SideBarProps) {
    const wrapperClass = [
        style.wrapper,
        isOpen ? style.open : "",
        isCollapsed ? style.collapsed : "",
    ].join(" ");

    return (
        <div className={wrapperClass}>
            <div className={style.header}>
                <img src="src/assets/testLogo.svg" alt="avatar" className={style.avatar} />
                <div className={style.headerText}>
                    <div className={style.brand}>Aura Reserve</div>
                    <div className={style.role}>Admin Dashboard</div>
                </div>
                <span className={style.premium}>PREMIUM TIER</span>
            </div>

            <ul className={style.list}>
                <li className={style.menuItem}><Link to="/dashboard"><img src="src/assets/icons/black/dashboard.svg" className={style.icon} alt=""/><span className={style.label}>Overview</span></Link></li>
                <li className={style.menuItem}><Link to="/reservations"><img src="src/assets/icons/black/calendar.svg" className={style.icon} alt=""/><span className={style.label}>Reservations</span></Link></li>
                <li className={style.menuItem}><Link to="/layout"><img src="src/assets/icons/black/fork.svg" className={style.icon} alt=""/><span className={style.label}>Rooms/Tables</span></Link></li>
                
                <li className={style.menuItem}><Link to="/restaurants"><img src="src/assets/icons/black/calendar.svg" className={style.icon} alt=""/><span className={style.label}>Restaurants</span></Link></li>
                <li className={style.menuItem}><Link to="/rooms"><img src="src/assets/icons/black/calendar.svg" className={style.icon} alt=""/><span className={style.label}>Rooms</span></Link></li>


                <li className={style.menuItem}><Link to="/floorplan"><img src="src/assets/icons/black/layers.svg" className={style.icon} alt=""/><span className={style.label}>Floorplan</span></Link></li>
                <li className={style.menuItem}><Link to="/customers"><img src="src/assets/icons/black/group.svg" className={style.icon} alt=""/><span className={style.label}>Customers</span></Link></li>
                <li className={style.menuItem}><Link to="/settings"><img src="src/assets/icons/black/settings.svg" className={style.icon} alt=""/><span className={style.label}>Settings</span></Link></li>
                <li className={`${style.menuItem} ${style.logout}`}><Link to="/" onClick={() => authService.logout()}><span className={style.label}>Logout</span></Link></li>
            </ul>

            {/* Collapse toggle — only visible on desktop */}
            <button className={style.collapseBtn} onClick={onToggleCollapse} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {isCollapsed
                        ? <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        : <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                </svg>
            </button>
        </div>
    );
}