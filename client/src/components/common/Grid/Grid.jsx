import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { useCursor } from "../../../contexts/CursorContext";
import { placesAPI } from "../../../services/api";
import styles from "./Grid.module.css";

// Register ScrollTrigger
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

// Fallback data nếu API lỗi
const FALLBACK_DATA = [
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
    const [gridData, setGridData] = useState(FALLBACK_DATA);
    const [loading, setLoading] = useState(true);

    // Fetch latest places from API
    useEffect(() => {
        const fetchLatestPlaces = async () => {
            try {
                const response = await placesAPI.getLatest(5);
                
                if (response.success && response.data && response.data.length > 0) {
                    // Transform API data to grid format
                    const transformedData = response.data.map((place, index) => ({
                        id: place._id,
                        src: place.images && place.images.length > 0 
                            ? place.images[0] 
                            : FALLBACK_DATA[index % FALLBACK_DATA.length].src,
                        title: place.name,
                        description: place.description.length > 100 
                            ? place.description.substring(0, 97) + '...' 
                            : place.description
                    }));
                    
                    setGridData(transformedData);
                }
            } catch (error) {
                console.error('Error fetching latest places:', error);
                // Giữ nguyên fallback data nếu có lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchLatestPlaces();
    }, []);

    const handleMouseEnter = () => {
        if (cursorRef?.current) cursorRef.current.enter();
    };

    const handleMouseLeave = () => {
        if (cursorRef?.current) cursorRef.current.leave();
    };

    if (loading) {
        return <div className={styles.grid}>Loading...</div>;
    }

    return (
        <div className={styles.grid} ref={containerRef}>
            {gridData.map((item, index) => (
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