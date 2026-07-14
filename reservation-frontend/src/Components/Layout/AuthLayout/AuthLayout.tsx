import { Outlet } from "react-router-dom";
import style from "./AuthLayout.module.css";

export function AuthLayout() {
    return (
        <div className={style.wrapper}>
            <Outlet />
        </div>
    );
}