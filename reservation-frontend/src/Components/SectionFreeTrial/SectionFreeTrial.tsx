import style from './SectionFreeTrial.module.css';
import { Button } from '../Button/Button';

export function SectionFreeTrial() {
    return (
        <section className={style.section}>
            <div className={style.contentWrapper}>
                <div className={style.content}>
                    <h2 className={style.heading}>Start your free trial today</h2>
                    <p className={style.text}>
                        Sign up for our reservation system today and experience the benefits of efficient reservation management. With our user-friendly interface and powerful tools, you can easily manage your reservations and provide an excellent experience for your customers.
                    </p>
                    <Button text='Start Free Trial' onClick={() => {}}/>
                </div>
            </div>
        </section>
    );
}