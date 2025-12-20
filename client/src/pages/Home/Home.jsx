import { useState, useEffect } from "react";
import styles from "./Home.module.css";
import Hero from "./Hero/Hero";
import Preloader from "../../components/common/Preloader/Preloader";
import OurPartners from "./OurPartners/OurPartners";
import Introduction from "./Introduction/Introduction";
import useLenis from "../../hooks/useLenis";
import Why from "./Why/Why";

const Home = () => {
    const [showPreloader, setShowPreloader] = useState(true);
    const [preloaderComplete, setPreloaderComplete] = useState(false);
    const lenisRef = useLenis();

    // Lock scroll initially
    useEffect(() => {
        const lockScroll = () => {
            if (lenisRef.current) {
                lenisRef.current.stop();
            } else {
                requestAnimationFrame(lockScroll);
            }
        };
        lockScroll();
    }, []); // Run once on mount

    const handlePreloaderComplete = () => {
        setShowPreloader(false);
        setPreloaderComplete(true);
        // Scroll is still locked here, waiting for Hero animation
    };

    const handleHeroAnimationComplete = () => {
        if (lenisRef.current) {
            lenisRef.current.start();
        }
    };

    return (
        <div className={styles.home}>
            {showPreloader && (
                <Preloader onComplete={handlePreloaderComplete} />
            )}
            <Hero
                preloaderComplete={preloaderComplete}
                onAnimationComplete={handleHeroAnimationComplete}
            />
            <OurPartners />
            <Introduction />
            <Why />
        </div>
    );
};

export default Home;
