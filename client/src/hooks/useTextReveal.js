import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger, SplitText } from "gsap/all";

// Register plugins safely
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, SplitText);
}

const useTextReveal = (options = {}) => {
    const elementRef = useRef(null);
    const {
        triggerStart = "top 85%",
        stagger = 0.1,
        duration = 1,
        ease = "expo.out",
        toggleActions = "play none none none",
        manual = false,
        play = false
    } = options;

    useGSAP(() => {
        const element = elementRef.current;
        if (!element || !SplitText) return;

        // Wait for fonts to load before splitting text
        const initSplitText = async () => {
            // Check if fonts are ready
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            // Ensure parent is visible (in case CSS hid it to prevent FOUC)
            gsap.set(element, { autoAlpha: 1 });

            // Create SplitText
            const split = new SplitText(element, {
                type: "lines,words",
                linesClass: "reveal-line",
                wordsClass: "reveal-word" // Optional, if needed
            });

            // Wrap lines for the mask effect
            // We create a wrapper div with overflow: hidden for each line
            const lines = split.lines;
            lines.forEach((line) => {
                const wrapper = document.createElement("div");
                wrapper.style.overflow = "hidden";
                wrapper.style.display = "block"; // Ensure it takes line width
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            if (manual) {
                // Manual Mode: Prepare state and wait for 'play' prop
                gsap.set(lines, { yPercent: 100, opacity: 0 });

                if (play) {
                    gsap.to(lines, {
                        yPercent: 0,
                        opacity: 1,
                        duration: duration,
                        stagger: stagger,
                        ease: ease
                    });
                }
            } else {
                // ScrollTrigger Mode (Default)
                gsap.from(lines, {
                    scrollTrigger: {
                        trigger: element,
                        start: triggerStart,
                        toggleActions: toggleActions,
                    },
                    yPercent: 100,
                    opacity: 0,
                    duration: duration,
                    stagger: stagger,
                    ease: ease,
                });
            }

            // Cleanup
            return () => {
                split.revert();
            };
        };

        initSplitText();

    }, { scope: elementRef, dependencies: [manual, play] });

    return elementRef;
};

export default useTextReveal;
