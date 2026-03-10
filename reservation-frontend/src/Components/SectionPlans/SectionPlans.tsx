import style from './SectionPlans.module.css';
import { Button } from '../Button/Button';

export function SectionPlans() {

    const svgChekcmark = <svg className={`flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400 ${style.featureIcon}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>

    return (
        <section className={style.section}>
            <div className={style.contentWrapper}>
                <div className={style.textContent}>
                    <h2 className={style.heading}>Designed for business teams like yours</h2>
                    <p className={style.paragraph}>Our reservation system is designed to meet the needs of businesses of all sizes. Whether you're a small startup or a large enterprise, our platform can help you manage your reservations efficiently and effectively.</p>
                </div>
                <div className={style.plansWrapper}>
                    <div className={style.plan}>
                        <h3 className={style.planHeading}>Starter</h3>
                        <p className={style.paragraph}>Best option for personal use & for your next project.</p>
                        <div className={style.pricingWrapper}>
                            <span className={style.price}>€39</span>
                            <span className={style.pricePeriod}>/month</span>
                        </div>
                        <ul className={style.featuresList}>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Individual configuration</span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>No setup, or hidden fees</span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Team size: <b>1 developer</b></span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Premium support: <b>6 months</b></span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Free updates: <b>6 months</b></span></li>
                        </ul>
                        <Button text='Get Started' onClick={() => {}} />    

                    </div>
                    <div className={style.plan}>
                        <h3 className={style.planHeading}>Company</h3>
                        <p className={style.paragraph}>Relevant for multiple users, extended & premium support.</p>
                        <div className={style.pricingWrapper}>
                            <span className={style.price}>€99</span>
                            <span className={style.pricePeriod}>/month</span>
                        </div>
                        <ul className={style.featuresList}>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Individual configuration</span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>No setup, or hidden fees</span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Team size: <b>10 developer</b></span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Premium support: <b>24 months</b></span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Free updates: <b>24 months</b></span></li>
                        </ul>
                        <Button text='Get Started' onClick={() => {}} />    
                    </div>
                    <div className={style.plan}>
                        <h3 className={style.planHeading}>Enterprise</h3>
                        <p className={style.paragraph}>Best for large scale uses and extended redistribution rights.</p>
                        <div className={style.pricingWrapper}>
                            <span className={style.price}>€399</span>
                            <span className={style.pricePeriod}>/month</span>
                        </div>
                        <ul className={style.featuresList}>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Individual configuration</span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>No setup, or hidden fees</span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Team size: <b>100+ developer</b></span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Premium support: <b>36 months</b></span></li>
                            <li className={style.feature}>{svgChekcmark} <span className={style.featureText}>Free updates: <b>36 months</b></span></li>
                        </ul>
                        <Button text='Get Started' onClick={() => {}} />    
                    </div>
                </div>
            </div>

        </section>
    );
}