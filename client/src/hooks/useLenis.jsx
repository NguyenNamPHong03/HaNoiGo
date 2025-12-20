import { useEffect, useRef, createContext, useContext } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// Create Context
const LenisContext = createContext(null);

/**
 * LenisProvider - Wrap your app with this provider
 * Provides smooth scrolling functionality throughout the app
 */
export const LenisProvider = ({ children, options = {} }) => {
    const lenisRef = useRef(null);

    useEffect(() => {
        // Initialize Lenis with default + custom options
        const lenis = new Lenis({
            duration: 0.8, // Reduced from 1.2 for less "smoothness"/inertia
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
            ...options
        });

        lenisRef.current = lenis;

        // Sync Lenis scroll with ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        // Use GSAP ticker for Lenis RAF (convert to ms)
        const onTick = (time) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(onTick);

        // Disable GSAP lag smoothing for smooth-scroll compatibility
        gsap.ticker.lagSmoothing(0);

        // Cleanup
        return () => {
            gsap.ticker.remove(onTick);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, [options]);

    return (
        <LenisContext.Provider value={lenisRef}>
            {children}
        </LenisContext.Provider>
    );
};

/**
 * useLenis - Custom hook to access Lenis instance
 * @returns {Object} Lenis instance ref
 * 
 * Methods available:
 * - lenis.scrollTo(target, options) - Scroll to element/position
 * - lenis.stop() - Stop scrolling
 * - lenis.start() - Start scrolling
 * - lenis.on('scroll', callback) - Listen to scroll events
 */
export const useLenis = () => {
    const context = useContext(LenisContext);

    if (!context) {
        console.warn('useLenis must be used within LenisProvider');
        return { current: null };
    }

    return context;
};

/**
 * useScrollTo - Hook for programmatic scrolling
 * @returns {Function} scrollTo function
 */
export const useScrollTo = () => {
    const lenisRef = useLenis();

    const scrollTo = (target, options = {}) => {
        if (lenisRef?.current) {
            lenisRef.current.scrollTo(target, {
                offset: 0,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                immediate: false,
                lock: false,
                ...options
            });
        }
    };

    return scrollTo;
};

export default useLenis;
