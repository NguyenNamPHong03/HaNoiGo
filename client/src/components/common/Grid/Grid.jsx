import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCursor } from "../../../contexts/CursorContext";
import styles from "./Grid.module.css";

// Register ScrollTrigger
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const GRID_DATA = [
    {
        id: 1,
        src: "https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0",
        title: "Hidden Alleys",
        description: "Explore the secret charm of Hanoi's narrow streets."
    },
    {
        id: 2,
        src: "https://images.unsplash.com/photo-1562323150-c3f486a6f185?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0",
        title: "Street Food",
        description: "Taste the authentic flavors of world-famous local cuisine."
    },
    {
        id: 3,
        src: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0",
        title: "Cultural Heritage",
        description: "Discover centuries of history in every temple and pagoda."
    },
    {
        id: 4,
        src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0",
        title: "Modern Vibes",
        description: "Experience the dynamic and youthful energy of the capital."
    },
    {
        id: 5,
        src: "https://images.unsplash.com/photo-1557750255-c76072a7aad1?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Modern Vibes",
        description: "Experience the dynamic and youthful energy of the capital."
    }
];

const Grid = () => {
    const containerRef = useRef(null);
    const cursorRef = useCursor();

    const handleMouseEnter = () => {
        if (cursorRef?.current) cursorRef.current.enter();
    };

    const handleMouseLeave = () => {
        if (cursorRef?.current) cursorRef.current.leave();
    };

    return (
        <div className={styles.grid} ref={containerRef}>
            {GRID_DATA.map((item, index) => (
                <div
                    key={item.id}
                    className={styles[`grid${index + 1}`]}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <img src={item.src} alt={item.title} />
                    {item.title && item.description && (
                        <div className={`${styles.content} liquid`}>
                            <h2>{item.title}</h2>
                            <p>{item.description}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Grid;