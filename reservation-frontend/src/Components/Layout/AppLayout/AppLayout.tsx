import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SideBar } from "../SideBar/SideBar";
import { TopBar } from "../TopBar/TopBar";
import { RestaurantsProvider } from "../../../context/RestaurantsContext";
import style from "./AppLayout.module.css";

export interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Mounted here (above the page Outlet) so the restaurants cache loads once and survives
    // navigation between pages, instead of re-fetching on every page mount.
    return (
        <RestaurantsProvider>
        <div className={style.wrapper}>
            <SideBar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(c => !c)}
            />
            {sidebarOpen && (
                <div className={style.backdrop} onClick={() => setSidebarOpen(false)} />
            )}
            <div className={style.content}>
                <TopBar onMenuClick={() => setSidebarOpen(true)} />
                <div className={style.contentContainer}>
                    <Outlet />
                </div>
            </div>
        </div>
        </RestaurantsProvider>
    );
}