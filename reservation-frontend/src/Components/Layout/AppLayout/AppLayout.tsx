import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SideBar } from "../SideBar/SideBar";
import { TopBar } from "../TopBar/TopBar";
import style from "./AppLayout.module.css";

export interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
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
    );
}