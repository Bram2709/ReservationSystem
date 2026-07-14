import style from './DashbaordCard.module.css';

interface DashboardCardProps {
    title?: string;
    value?: string | number;
    imageUrl?: string;
}

export function DashboardCard({ title = 'Title', value = '—', imageUrl }: Readonly<DashboardCardProps>) {
    return (
        <div className={style.wrapper}>
            {imageUrl && <img src={imageUrl} alt={title} className={style.image} />}
            <div className={style.title}>{title}</div>
            <div className={style.value}>{value}</div>
        </div>
    );
}