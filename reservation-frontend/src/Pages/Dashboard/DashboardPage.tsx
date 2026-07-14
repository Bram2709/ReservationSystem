import style from './DashboardPage.module.css';
import { DashboardCard } from '../../Components/DashboardCard/DashboardCard';

export function DashboardPage() {
    return (
        <div className={style.wrapper}>
            <div className={style.row1}>
                {/* amount of reservations today? */}
                <div className={style.card}>
                    <DashboardCard title='Reservations today' value={23} />
                </div>
                {/* amount of free tables in the next hour/s?*/}
                <div className={style.card}>
                    <DashboardCard title='Free tables' value={12} />
                </div>
                <div className={style.card}>
                    <DashboardCard title='Occupied tables' value={34} />
                </div>
                <div className={style.card}>
                    <DashboardCard title='Total reservations' value={150} />
                </div>
            </div>

            {/* list of reservations with time user room | maybe multiple vies of dayly/weekly/monthly | search filters*/}
            <div className={style.reservationsRow}>
                <div className={style.table}>
                </div>
            </div>

            <div className={style.row2}>
                {/* bookings over time(linechart) */}
                <div className={style.graph}>
                </div>

                <div className={style.data}>
                </div>
            </div>

            {/* most recent booking changes */}
            {/* announcement banner? */}
            
        </div>
    );
}