import style from './Footer.module.css';
import logo from '../../assets/testLogo.svg';

export function Footer() {
    return (
        <footer className={style.footer}>
            <div className={style.contentWrapper}>
                <div className={style.footerLinks}>
                    <div className={style.linkGroup}>
                        <h3 className={style.linkGroupHeading}>COMPANY</h3>
                        <ul className={style.linkList}>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Careers</a></li>
                        </ul>
                    </div>
                    <div className={style.linkGroup}>
                        <h3 className={style.linkGroupHeading}>HELP CENTER</h3>
                        <ul className={style.linkList}>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">FAQs</a></li>
                            <li><a href="#">Support</a></li>
                        </ul>
                    </div>
                    <div className={style.linkGroup}>
                        <h3 className={style.linkGroupHeading}>LEGAL</h3>
                        <ul className={style.linkList}>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                    <div className={style.linkGroup}>
                        <h3 className={style.linkGroupHeading}>DOWNLOAD</h3>
                        <ul className={style.linkList}>
                            <li><a href="#">App Store</a></li>
                            <li><a href="#">Google Play</a></li>
                            <li><a href="#">Windows Store</a></li>
                        </ul>
                    </div>
                </div>
                <hr className={style.hrborder} />
                <div className={style.footerText}>
                    <a className={style.footerLogo} href='#'>
                        <img src={logo} alt='Reservation System Logo' className={style.logoImage} />
                        LandWind
                    </a>
                    <p className={style.paragraph}>&copy; 2026 Reservation System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}