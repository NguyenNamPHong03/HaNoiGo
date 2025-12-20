import { useRef } from "react";
import styles from "./Why.module.css";
import TitleSection from "../../../components/common/TitleSection/TitleSection";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCursor } from "../../../contexts/CursorContext";

const WHY_ITEMS = [
    {
        id: 1,
        title: "Trip transfer",
        description: "Comfortable transfers between your hotel and the main attractions, so you spend less time on the road and more time exploring.",
        image: "https://images.unsplash.com/photo-1639806413641-7fee4d566b69?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 2,
        title: "Easy booking",
        description: "Fast, flexible reservations for tours and activities in just a few clicks, with options that adapt to your plans.",
        image: "https://images.unsplash.com/photo-1547158291-06774526756c?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 3,
        title: "Local guides",
        description: "Friendly local experts who know the region inside out and are ready to show you the best viewpoints, hidden spots, and stories.",
        image: "https://images.unsplash.com/photo-1678461863258-185d001d7a1b?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 4,
        title: "Exclusive offers",
        description: "Special prices on ski passes, cosy chalets, and selected excursions available only for our travelers.",
        image: "https://images.unsplash.com/photo-1556383166-eded0173b7fd?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
];

const Why = () => {
    const containerRef = useRef(null);
    const cursorRef = useCursor();

    useGSAP(() => {
        // Initial setup for images
        gsap.set(`.${styles.swipeimage}`, { yPercent: -50, xPercent: -50, force3D: true });

        const items = gsap.utils.toArray(`.${styles.item}`);

        items.forEach((el) => {
            const image = el.querySelector(`.${styles.swipeimage}`);
            if (!image) return;

            // use quickTo for high performance mouse following
            // use quickTo for high performance mouse following with force3D
            const setX = gsap.quickTo(image, "x", { duration: 0.6, ease: "power3" });
            const setY = gsap.quickTo(image, "y", { duration: 0.6, ease: "power3" });

            const align = (e) => {
                setX(e.clientX);
                setY(e.clientY);
            };

            const startFollow = () => window.addEventListener("mousemove", align);
            const stopFollow = () => window.removeEventListener("mousemove", align);

            const fade = gsap.to(image, {
                autoAlpha: 1,
                ease: "power1.inOut",
                paused: true,
                duration: 0.4,
                onReverseComplete: stopFollow // stop following when hidden
            });

            el.addEventListener("mouseenter", (e) => {
                // Initial positioning to avoid jump
                // We could set it immediately, but quickTo handles it reasonably well.
                // For a perfect start, we might want to setX/Y immediately without tween on first enter
                setX(e.clientX);
                setY(e.clientY);

                startFollow();
                fade.play();
            });

            el.addEventListener("mouseleave", () => {
                fade.reverse();
            });
        });

    }, { scope: containerRef });

    const handleMouseEnter = () => {
        cursorRef?.current?.enter();
    };

    const handleMouseLeave = () => {
        cursorRef?.current?.leave();
    };

    return (
        <section className={styles.why} ref={containerRef}>
            <div className={styles.title}>
                <TitleSection>
                    Traveling with us means you don’t have to worry about the details. We handle your transfers, bookings, and on-site arrangements so you can simply relax and enjoy your holiday from the very first day.
                </TitleSection>
            </div>
            <div className={styles.whyContent}>
                {WHY_ITEMS.map((item) => (
                    <div
                        className={styles.item}
                        key={item.id}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <img className={styles.swipeimage} src={item.image} alt={item.title} />
                        <div className={styles.count}>
                            <div className={styles.countBox}>
                                <p>0{item.id}</p>
                            </div>
                            <div className={styles.content}>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Why;