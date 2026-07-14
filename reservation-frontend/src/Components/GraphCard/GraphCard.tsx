import style from './GraphCard.module.css';

export function GraphCard() {
    return (
        <div className={style.wrapper}>
            <div className={style.wrapperContent}>
                <div className={style.upperRow}>
                    <div className={style.title}>Weekly Reservation Trends</div>
                    <img src="src\assets\bar_chart.svg" alt="Graph Placeholder" className={style.graphImage} />
                </div>
                <div className={style.graphdata}>Growth of 12% vs last week</div>
            </div>
        </div>

    );
}
