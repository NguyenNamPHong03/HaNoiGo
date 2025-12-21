import { useState, useEffect } from "react";
import styles from "./Home.module.css";
import Hero from "./Hero/Hero";
import Preloader from "../../components/common/Preloader/Preloader";
import OurPartners from "./OurPartners/OurPartners";
import Introduction from "./Introduction/Introduction";
import useLenis from "../../hooks/useLenis";
import Why from "./Why/Why";

// Track preloader state across component remounts (client-side navigation)
let hasPlayedPreloader = false;

const Home = () => {
    // If it has played before, don't show it again, and consider it complete
    const [showPreloader, setShowPreloader] = useState(!hasPlayedPreloader);
    const [preloaderComplete, setPreloaderComplete] = useState(hasPlayedPreloader);
    const lenisRef = useLenis();

    // Lock scroll initially ONLY if preloader is showing
    useEffect(() => {
        if (!showPreloader) return;

        const lockScroll = () => {
            if (lenisRef.current) {
                lenisRef.current.stop();
            } else {
                requestAnimationFrame(lockScroll);
            }
        };
        lockScroll();
    }, [showPreloader]); // Run when showPreloader changes (or just on mount if true)

    const handlePreloaderComplete = () => {
        hasPlayedPreloader = true;
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
