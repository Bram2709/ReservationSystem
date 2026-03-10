import { Button } from '../Button/Button';
import style from './SectionOne.module.css';

export function SectionOne() {
    return (
        <section className={style.sectionOne}>
            <div className={style.contentWrapper}>
               <div className={style.textContent}>
                    <h1 className={style.heading}>Welcome to Our <br />Reservation System</h1>
                    <p className={style.paragraph}>Easily manage your reservations with our user-friendly platform. Book, modify, and cancel reservations with just a few clicks. This is just a placeholder</p>
                    <div className={style.buttonGroup}>
                        <Button text='Get Started' onClick={() => {}} />
                        <Button text='Learn More' onClick={() => {}} />
                    </div>
                </div>
                <div className={style.imageContent}>
                    <img className={style.image} src="/hero.png" alt="Reservation" />
                </div>
            </div>
        </section>
    );
}