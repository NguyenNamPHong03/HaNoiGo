import { useRef, useState } from "react";
import styles from "./Why.module.css";
import TitleSection from "../../../components/common/TitleSection/TitleSection";
import { useCursor } from "../../../contexts/CursorContext";

const WHY_ITEMS = [
    {
        id: 1,
        title: "Trip transfer",
        description: "Comfortable transfers between your hotel and the main attractions, so you spend less time on the road and more time exploring.",
        image: "https://images.unsplash.com/photo-1561842951-2f960156a061?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 2,
        title: "Easy booking",
        description: "Fast, flexible reservations for tours and activities in just a few clicks, with options that adapt to your plans.",
        image: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 3,
        title: "Local guides",
        description: "Friendly local experts who know the region inside out and are ready to show you the best viewpoints, hidden spots, and stories.",
        image: "https://images.unsplash.com/photo-1570559120097-e6c3388329e6?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
        id: 4,
        title: "Exclusive offers",
        description: "Special prices on ski passes, cosy chalets, and selected excursions available only for our travelers.",
        image: "https://images.unsplash.com/photo-1603269231725-4ea1da7d02fd?q=80&w=2531&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
];

const Why = () => {
    const cursorRef = useCursor();
    const [activeImage, setActiveImage] = useState(WHY_ITEMS[0].image);

    const handleMouseEnter = () => {
        cursorRef?.current?.enter();
    };

    const handleMouseLeave = () => {
        cursorRef?.current?.leave();
    };

    return (
        <section className={styles.why}>
            <div className={styles.title}>
                <TitleSection>
                    Traveling with us means you don’t have to worry about the details. We handle your transfers, bookings, and on-site arrangements so you can simply relax and enjoy your holiday from the very first day.
                </TitleSection>
            </div>

            <div className={styles.whyContent}>
                <div className={styles.leftColumn}>
                    {WHY_ITEMS.map((item) => (
                        <div
                            className={styles.item}
                            key={item.id}
                            onMouseEnter={() => {
                                handleMouseEnter();
                                setActiveImage(item.image);
                            }}
                            onMouseLeave={handleMouseLeave}
                        >
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

                <div className={styles.rightColumn}>
                    <div className={styles.imageWrapper}>
                        <img src={activeImage} alt="Feature" className={styles.featureImage} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Why;