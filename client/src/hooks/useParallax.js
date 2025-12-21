import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * useParallax - Custom hook for managing scroll-based parallax animations.
 * 
 * @param {Object} options - Configuration options
 * @param {React.MutableRefObject} options.trigger - The container ref that triggers the scroll sequence.
 * @param {Array<{target: React.MutableRefObject|string, vars: Object}>} options.animations - Array of animation objects.
 * @param {Object} [options.config] - Optional ScrollTrigger configuration overrides.
 */
const useParallax = ({ trigger, animations = [], config = {} }) => {
    useGSAP(() => {
        const triggerEl = trigger.current;
        if (!triggerEl) return;

        // Default ScrollTrigger config
        const defaultConfig = {
            trigger: triggerEl,
            start: "top top",
            end: "bottom top",
            scrub: 0
        };

        const tl = gsap.timeline({
            scrollTrigger: {
                ...defaultConfig,
                ...config
            }
        });

        animations.forEach(({ target, vars }) => {
            // Support both React Refs and CSS selector strings/elements
            const el = target.current || target;

            if (el) {
                // Determine layout logic: if it's a "from" or "to" tween. 
                // Defaulting to "to" as it's most common for parallax (moving away from initial position).
                tl.to(el, {
                    ease: "none", // Parallax usually needs linear ease for direct scroll mapping
                    ...vars
                }, 0); // The '0' ensures all animations start at the beginning of the scrollTimeline
            }
        });

    }, {
        scope: trigger,
        // We assume animations list structure is static for a given component lifecycle.
        // If animations change dynamically, add them to dependencies.
        dependencies: []
    });
};

export default useParallax;
