import { useCallback, useState } from 'react';
import styles from "./Header.module.css";
import Icon from "../../common/Icon/Icon";
import HanoiGo from "../../HanoiGo/HanoiGo";
import MagneticButton from "../../common/MagneticButton/MagneticButton";
import Link from "../../Link/Link";
import { useCursor } from "../../../contexts/CursorContext";

import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from "../../../contexts/UserContext";

const Header = () => {
    const cursorRef = useCursor();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const isHomePage = location.pathname === '/';
    const textColor = isHomePage ? '#fff' : '#000';
    const iconColor = isHomePage ? 'var(--yellow)' : '#000';

    // ✅ useCallback for event handlers (Rules.md §5.2)
    const handleMouseEnter = useCallback(() => {
        cursorRef?.current?.enter();
    }, [cursorRef]);

    const handleMouseLeave = useCallback(() => {
        cursorRef?.current?.leave();
    }, [cursorRef]);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prev => !prev);
    }, []);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    const handleLoginClick = () => {
        if (!user) {
            navigate('/login');
        }
    };

    return (
        <header className={`${styles.header} ${!isHomePage ? styles.darkHeader : ''}`}>
            <div
                className={styles.logo}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => navigate('/')}
            >
                <Icon height={25} fill={iconColor} className={styles.icon} />
                <HanoiGo height={15} fill={textColor} className={styles.hanoiGo} />
            </div>

            {/* Desktop Navigation */}
            <ul className={styles.links}>
                <li><Link href="#tours" color={textColor}>Our tours</Link></li>
                <li><Link href="#about" color={textColor}>About us</Link></li>
                <li><Link href="#booking" color={textColor}>Booking</Link></li>
                <li><Link href="#contact" color={textColor}>Contact</Link></li>
            </ul>

            <div className={styles.loginBtn}>
                <MagneticButton
                    bg="transparent"
                    color={textColor}
                    borderColor={textColor}
                    hoverBg="var(--yellow)"
                    hoverColor="#000"
                    hoverBorderColor="var(--yellow)"
                    padding="10px 30px"
                    onClick={handleLoginClick}
                >
                    {user ? `Hi, ${user.displayName}` : 'Login'}
                </MagneticButton>
            </div>

            {/* Hamburger Menu Button (Mobile) */}
            <button
                className={styles.hamburger}
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 0 34 22" fill="none">
                    <path d="M1.04168 21.9563C0.745848 21.9563 0.498625 21.8556 0.300014 21.6542C0.101403 21.4528 0.00140316 21.2049 1.42694e-05 20.9104C-0.00137462 20.616 0.0986255 20.3688 0.300014 20.1688C0.501403 19.9688 0.748625 19.8694 1.04168 19.8708H32.2917C32.5875 19.8708 32.8347 19.9708 33.0333 20.1708C33.2333 20.3708 33.3333 20.6188 33.3333 20.9146C33.3333 21.2104 33.2333 21.4576 33.0333 21.6562C32.8333 21.8549 32.5861 21.9542 32.2917 21.9542L1.04168 21.9563ZM1.04168 12.0187C0.745848 12.0187 0.498625 11.9187 0.300014 11.7187C0.101403 11.5187 0.00140316 11.2708 1.42694e-05 10.975C-0.00137462 10.6792 0.0986255 10.4319 0.300014 10.2333C0.501403 10.0347 0.748625 9.93542 1.04168 9.93542H32.2917C32.5875 9.93542 32.8347 10.0354 33.0333 10.2354C33.232 10.4354 33.332 10.6833 33.3333 10.9792C33.3347 11.275 33.2347 11.5222 33.0333 11.7208C32.832 11.9194 32.5847 12.0187 32.2917 12.0187H1.04168ZM1.04168 2.08125C0.745848 2.08125 0.498625 1.98194 0.300014 1.78333C0.100014 1.58333 1.42694e-05 1.33542 1.42694e-05 1.03958C1.42694e-05 0.74375 0.100014 0.496528 0.300014 0.297917C0.500014 0.0993058 0.747236 0 1.04168 0H32.2917C32.5875 0 32.8347 0.1 33.0333 0.3C33.232 0.5 33.332 0.746528 33.3333 1.03958C33.3347 1.33264 33.2347 1.57986 33.0333 1.78125C32.832 1.98264 32.5847 2.08264 32.2917 2.08125H1.04168Z" fill={textColor} />
                </svg>
            </button>

            {/* Mobile Menu Overlay */}
            <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <button
                    className={styles.closeBtn}
                    onClick={closeMenu}
                    aria-label="Close menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <nav className={styles.mobileNav}>
                    <a href="#tours" onClick={closeMenu}>Our tours</a>
                    <a href="#about" onClick={closeMenu}>About us</a>
                    <a href="#booking" onClick={closeMenu}>Booking</a>
                    <a href="#contact" onClick={closeMenu}>Contact</a>
                </nav>

                <MagneticButton
                    bg="var(--yellow)"
                    color="#000"
                    borderColor="var(--yellow)"
                    hoverBg="transparent"
                    hoverColor="#fff"
                    hoverBorderColor="#fff"
                    padding="15px 40px"
                    onClick={closeMenu}
                >Login</MagneticButton>
            </div>

            {/* Backdrop */}
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={closeMenu} />
            )}
        </header>
    );
};

export default Header;
