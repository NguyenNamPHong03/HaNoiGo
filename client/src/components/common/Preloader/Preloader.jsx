import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./Preloader.module.css";

const Preloader = ({ onComplete }) => {
    const containerRef = useRef(null);
    const tubeRef = useRef(null);

    const text = "Loading";
    const fontSize = 25; // px

    useEffect(() => {
        const container = containerRef.current;
        const tube = tubeRef.current;

        if (!container || !tube) return;

        // Make container visible
        gsap.set(container, { visibility: "visible" });

        // Grab all lines
        const lines = tube.querySelectorAll(`.${styles.line}`);

        // Split characters for all lines
        const splitLines = Array.from(lines).map(line => {
            const lineText = line.textContent;
            line.innerHTML = '';
            const chars = lineText.split('').map(char => {
                const span = document.createElement('div');
                span.className = styles.char;
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.display = 'inline-block';
                span.style.backfaceVisibility = 'hidden';
                line.appendChild(span);
                return span;
            });
            return { chars };
        });

        // 3D setup
        const depth = -fontSize * 0.7;
        const transformOrigin = `50% 50% ${depth}px`;

        gsap.set(lines, { perspective: 100, transformStyle: "preserve-3d" });

        // Timeline animation
        const animTime = 0.9;
        const tl = gsap.timeline({ repeat: -1 });

        // Animate each line in a loop
        splitLines.forEach((split, index) => {
            tl.fromTo(
                split.chars,
                { rotationX: -90 },
                {
                    rotationX: 90,
                    stagger: 0.08,
                    duration: animTime,
                    ease: "none",
                    transformOrigin
                },
                index * 0.45
            );
        });

        // Sau 3 giây, fade out preloader
        const fadeOutTimer = setTimeout(() => {
            gsap.to(container, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    tl.kill();
                    if (onComplete) onComplete();
                }
            });
        }, 3000);

        return () => {
            tl.kill();
            clearTimeout(fadeOutTimer);
        };
    }, [onComplete]);

    return (
        <div ref={containerRef} className={styles.container}>
            <div ref={tubeRef} className={styles.tube}>
                <h1 className={styles.line}>{text}</h1>
                <h1 className={styles.line}>{text}</h1>
                <h1 className={styles.line}>{text}</h1>
                <h1 className={styles.line}>{text}</h1>
            </div>
        </div>
    );
};

export default Preloader;
