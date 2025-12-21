import { memo } from "react";
import styles from "./OurPartners.module.css";
import useHorizontalLoop from "../../../hooks/useHorizontalLoop";
import TitleSection from "../../../components/common/TitleSection/TitleSection";

const PARTNER_DATA = [
    { src: "/img/partner1.webp", alt: "Partner 1" },
    { src: "/img/partner2.webp", alt: "Partner 2" },
    { src: "/img/partner3.webp", alt: "Partner 3" },
    { src: "/img/partner4.webp", alt: "Partner 4" },
    { src: "/img/partner5.webp", alt: "Partner 5" },
    { src: "/img/partner6.webp", alt: "Partner 6" },
];

const PARTNERS = [...PARTNER_DATA, ...PARTNER_DATA, ...PARTNER_DATA];

/**
 * OurPartners Section - Infinite carousel using reusable custom hook
 */
const OurPartners = () => {
    const { containerRef, pause, play } = useHorizontalLoop({
        itemSelector: `.${styles.partner}`,
        speed: 0.5,
        repeat: -1,
        draggable: true,
        gap: 150         // Gap between items
    });

    return (
        <section className={styles.ourPartners}>
            <TitleSection className={styles.titleReveal}>
                We proudly collaborate with a trusted network of partners who share our
                commitment to quality, reliability, and innovation.
            </TitleSection>
            <div
                className={styles.partners}
                ref={containerRef}
                onMouseEnter={pause}
                onMouseLeave={play}
            >
                {PARTNERS.map((partner, index) => (
                    <div key={index} className={styles.partner}>
                        <img src={partner.src} alt={partner.alt} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default memo(OurPartners);
