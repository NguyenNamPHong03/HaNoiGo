import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import HanoiGo from "../../../components/HanoiGo/HanoiGo";
import ChatInput from "../../../components/common/ChatInput/ChatInput";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

import useParallax from "../../../hooks/useParallax";
import useTextReveal from "../../../hooks/useTextReveal";

const Hero = ({ preloaderComplete, onAnimationComplete }) => {
    const heroRef = useRef(null);
    const layer1Ref = useRef(null);
    const layer2Ref = useRef(null);
    const layer3Ref = useRef(null);
    const layer4Ref = useRef(null); // Keeps track of container for parallax
    const chatInputRef = useRef(null);
    const hanoiGoRef = useRef(null);

    const [playTextReveal, setPlayTextReveal] = useState(false);

    // Use text reveal hook for description in MANUAL mode
    // It will only play when playTextReveal becomes true
    const descriptionRef = useTextReveal({
        manual: true,
        play: playTextReveal
    });

    // Parallax Effect
    useParallax({
        trigger: heroRef,
        animations: [
            { target: layer1Ref, vars: { yPercent: 10 } },
            { target: layer2Ref, vars: { yPercent: 20 } },
            { target: layer3Ref, vars: { yPercent: 30 } },
            { target: layer4Ref, vars: { yPercent: 300 } },
            { target: chatInputRef, vars: { yPercent: 100 } }
        ],
        config: {
            start: "0% 0%",
            end: "100% 0%",
            scrub: 0
        }
    });

    // Set initial hidden state immediately (before paint)
    useLayoutEffect(() => {
        const hanoiGo = hanoiGoRef.current;
        const chatInput = chatInputRef.current;
        if (hanoiGo && chatInput) {
            gsap.set(hanoiGo, { yPercent: 500 });
            // ChatInput: hide and set height 0
            gsap.set(chatInput, { height: 0, overflow: "hidden", opacity: 0 });
            // Hide children
            const children = chatInput.children;
            gsap.set(children, { opacity: 0, y: 20 });
        }
    }, []);

    // Intro animation when preloader completes
    useEffect(() => {
        if (!preloaderComplete) return;

        const hanoiGo = hanoiGoRef.current;
        const chatInput = chatInputRef.current;

        if (!hanoiGo || !chatInput) return;

        const tl = gsap.timeline();

        // Animate HanoiGo from bottom to top
        tl.to(hanoiGo, {
            yPercent: 0,
            duration: 1.2,
            ease: "power2.out"
        })
            .call(() => {
                // Start Text Reveal Animation right after HanoiGo finishes
                setPlayTextReveal(true);
            });

        // ChatInput: animate height from 0 to auto
        tl.to(chatInput, {
            height: "auto",
            duration: 0.8,
            opacity: 1,
            ease: "power2.out"
        }, "-=0.5");

        // ChatInput children: fade in with stagger
        const children = chatInput.children;
        tl.to(children, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: "power2.out",
            onComplete: () => {
                if (onAnimationComplete) onAnimationComplete();
            }
        }, "-=0.3");
    }, [preloaderComplete, onAnimationComplete]);

    return (
        <section ref={heroRef} className={styles.hero}>
            <img
                ref={layer1Ref}
                src="/img/layer1.webp"
                alt="Background"
                className={styles.layerBackgroundImg}
            />

            <div ref={layer2Ref} className={styles.hanoiGoWrapper}>
                <div ref={hanoiGoRef} className={styles.hanoiGoInner}>
                    <HanoiGo height={150} fill="var(--yellow)" className={styles.hanoiGo} />
                </div>
            </div>

            <div className={styles.content} ref={layer4Ref}>
                <p className={styles.description} ref={descriptionRef}>
                    Khám phá vẻ đẹp của Hà Nội với các tour du lịch được thiết kế tỉ mỉ của chúng tôi, khám phá nền văn hóa phong phú, những địa danh nổi tiếng và cuộc sống địa phương sôi động.
                </p>
            </div>
            <ChatInput ref={chatInputRef} />
            <img
                ref={layer3Ref}
                src="/img/layer2.webp"
                alt="Foreground"
                className={styles.layerImg}
            />
        </section>
    );
};

export default Hero;
