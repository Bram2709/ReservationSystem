import style from './NextArrivalsCard.module.css';

interface ArrivalProps {
    name: string;
    guests: number;
    time: string;
    table: number;
    imageUrl?: string;
}

export function NextArrivalsCard({ name, guests, time, table, imageUrl }: Readonly<ArrivalProps>) {
    return (
        <div className={style.wrapper}>
            <img src={imageUrl} className={style.image} />
            <div className={style.info}>
                <div className={style.nameandtimerow}>
                    <div className={style.name}>{name}</div>
                    <div className={style.arrivalTime}>{time}</div>
                </div>

                <div className={style.details}>
                    <img src="src\assets\group_black_80.svg" alt="Guests Icon" className={style.icon} />
                    <span className={style.guests}>{guests} guests</span>
                    <div className={style.dot}></div>
                    <img src="src\assets\table_restaurant_80.svg" alt="Table icon" className={style.icon} />
                    <span className={style.table}>Table {table}</span>
                </div>
                
            </div>
            {/* <div className={style.arrivalTime}>{time}</div> */}
        </div>
    );
}