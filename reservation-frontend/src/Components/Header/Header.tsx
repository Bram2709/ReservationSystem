import { useState } from 'react';
import style from './Header.module.css';
import { Button } from '../Button/Button';


export function Header(){

    const [menu, setMenu] = useState(false);

    return (
        <header className={style.header}>
            <nav className={style.navbarWrapper}>
            
                <div className={style.navbar}>
                    <div className={style.logo}>
                        <img className={style.image} src="/testLogo.png" alt="Logo" />
                    </div>
                    <div className={style.navLinks}>
                        <a href="/">Home</a>
                        <a href="/about">About</a>
                        <a href="/contact">Contact</a>
                    </div>
                    <div className={style.headerRightSide}>
                        {/* <button className={style.getStartedButton}>Get Started</button> */}
                        <Button text='Get Started' onClick={() => {}} />
                        <input type='image' className={style.menuButtonImg} src="/menu.png" alt="Menu" onClick={() => setMenu(!menu)} />
                    </div>

                    {menu &&
                        <div className={style.mobileMenu}>
                            <a className={style.mobileMenuItem} href="/">Home</a>
                            <a className={style.mobileMenuItem} href="/about">About</a>
                            <a className={style.mobileMenuItem} href="/contact">Contact</a>
                        </div>
                    }

                </div>
            </nav>
        </header>
    );
}   