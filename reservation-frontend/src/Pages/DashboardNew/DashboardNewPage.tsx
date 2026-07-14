import { DashboardCard } from '../../Components/DashboardCard/DashboardCard';
import { GraphCard } from '../../Components/GraphCard/GraphCard';
import { NextArrivalsCard } from '../../Components/NextArrivalsCard/NextArrivalsCard';
import style from './DashboardNewPage.module.css';

export function DashboardNewPage() {
    return (
        <div className={style.wrapper}>
            <section className={style.cardsRow}>
                <div className={style.title}>Overview</div>
                <div className={style.cards}>
                    <DashboardCard imageUrl="src\assets\event_available.svg" title="Reservations" value="36"/>
                    <DashboardCard imageUrl="src\assets\layers.svg" title="Occupied tables" value="14/25"/>
                    <DashboardCard imageUrl="src\assets\calendar_today.svg" title="Upcoming" value="8"/>
                </div>
            </section>

            <div className={style.graph}>
                <GraphCard />
            </div>

            <aside className={style.nextColumn}>
                <div className={style.nextarrivalstop}>
                    <div className={style.title}>Next Arrivals</div>
                    <div className={style.viewall}>VIEW ALL</div>
                </div>
                <div className={style.nextarrivals}>                
                    <NextArrivalsCard name="John Doe" guests={4} time="19:00 PM" table={12} imageUrl="src\assets\profile.png"/>
                    <NextArrivalsCard name="Jane Smith" guests={2} time="19:30 PM" table={5} imageUrl="src\assets\profile2.png"/>
                    <NextArrivalsCard name="Bob Johnson" guests={6} time="20:00 PM" table={18} imageUrl="src\assets\profile3.png"/>
                </div>
            </aside>

            {/* Row 3 - Table placeholder (spans all 3 columns) */}
            <section className={style.tableRow}>
                <div className={style.title}>Floor Management</div>
                <div className={style.tablePlaceholder}>
                    {/* TODO: replace with real table component */}
                    <p>Table component will go here (spans full width on desktop).</p>
                </div>
            </section>
        </div>
    );
}