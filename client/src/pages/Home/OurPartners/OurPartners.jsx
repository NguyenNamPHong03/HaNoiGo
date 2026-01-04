import { memo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./OurPartners.module.css";
import TitleSection from "../../../components/common/TitleSection/TitleSection";

const PARTNER_DATA = [
    { src: "/img/partner1.webp", alt: "Partner 1" },
    { src: "/img/partner2.webp", alt: "Partner 2" },
    { src: "/img/partner3.webp", alt: "Partner 3" },
    { src: "/img/partner4.webp", alt: "Partner 4" },
    { src: "/img/partner5.webp", alt: "Partner 5" },
    { src: "/img/partner6.webp", alt: "Partner 6" },
];

/**
 * RINGS CONFIG
 * Radius: MUST MATCH THE CSS width calculations (Width/2)
 * Ring 1 CSS: 500px -> Radius 250
 * Ring 2 CSS: 800px -> Radius 400
 * Ring 3 CSS: 1100px -> Radius 550
 * 
 * Note: These are base radii. CSS uses --scale-factor. 
 * We will apply the scale factor in the JS or CSS variable usage.
 * Actually, since we put style={{ transform: ...px }} in JS,
 * we need to include the scale factor in JS or handle it via CSS calc().
 * The previous CSS used `calc(Xpx * var(--scale-factor))`.
 * 
 * To make this easier with GSAP, we'll keep the JS 'radius' logical
 * and use CSS variable in the transform string if possible, 
 * or purely rely on CSS classes and nested containers.
 * 
 * Strategy:
 * JS sets `rotate(deg) translate(var(--radius))`.
 * We define --radius in styles for each ring.
 */
const RINGS = [
    { id: 1, radiusVar: "250px", speed: 40, partners: [0, 1, 2, 0, 1, 2] },
    { id: 2, radiusVar: "400px", speed: -50, partners: [3, 4, 5, 0, 1, 3, 4] },
    { id: 3, radiusVar: "550px", speed: 60, partners: [2, 3, 4, 5, 0, 1, 2, 5] },
];

const OurPartners = () => {
    const containerRef = useRef(null);

    useGSAP(() => {
        RINGS.forEach((ring, index) => {
            const ringPlane = containerRef.current.querySelector(`.ring-plane-${index}`);
            const nodes = ringPlane.querySelectorAll(`.${styles.partnerNode}`);

            // 1. Animate the Ring Plane (Orbit)
            // If speed is positive: CW -> Rotation goes 0 -> 360
            // If speed is negative: CCW -> Rotation goes 360 -> 0 (or 0 -> -360)
            const duration = Math.abs(ring.speed);
            const direction = ring.speed > 0 ? 360 : -360;

            gsap.to(ringPlane, {
                rotation: direction,
                duration: duration,
                repeat: -1,
                ease: "none"
            });

            // 2. Counter-rotate the nodes to keep them upright
            // They must rotate in the OPPOSITE direction of the plane
            gsap.to(nodes, {
                rotation: -direction,
                duration: duration,
                repeat: -1,
                ease: "none"
            });
        });
    }, { scope: containerRef });

    return (
        <section className={styles.ourPartners} ref={containerRef}>
            <div className={styles.header}>
                <TitleSection className={styles.title}>
                    Technologies & Partners with HaNoiGo
                </TitleSection>
                <div className={styles.subtitle}>
                    Chúng tôi tự hào hợp tác với mạng lưới đối tác đáng tin cậy.
                </div>
            </div>

            <div className={styles.orbitContainer}>
                {/* Visual Rings (Background) */}
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>

                {/* Rotating Planes */}
                {RINGS.map((ring, rIndex) => (
                    <div
                        key={rIndex}
                        className={`${styles.ringPlane} ring-plane-${rIndex}`}
                        style={{ zIndex: 10 + rIndex }}
                    >
                        {ring.partners.map((pIndex, i) => {
                            const partner = PARTNER_DATA[pIndex];
                            // Distribute evenly
                            const angleStep = 360 / ring.partners.length;
                            const startAngle = angleStep * i;

                            return (
                                <div
                                    key={`${rIndex}-${i}`}
                                    className={styles.partnerWrapper}
                                    style={{
                                        // Rotate to position, then push out by radius
                                        // The radius is adjusted by scale factor in CSS via calc
                                        transform: `rotate(${startAngle}deg) translate(calc(${ring.radiusVar} * var(--scale-factor)))`
                                    }}
                                >
                                    {/* The Node itself - This will be counter-rotated by GSAP */}
                                    {/* We set initial rotation to -startAngle so if the plane was static, it would be upright.
                                        But since the plane ROTATES, we need to animate this value.
                                        Actually, GSAP 'rotation' overwrites.
                                        So we set initial rotation via GSAP or specific style?
                                        Better: Let GSAP handle the continuous counter-rotation.
                                        BUT we need an initial offset to be upright at start.
                                        Initial Plane Rotation = 0.
                                        Node Position Rotation = startAngle.
                                        Node Upright Rotation = -startAngle.
                                        
                                        We need to animate from [-startAngle] to [-startAngle - 360].
                                    */}
                                    <div
                                        className={styles.partnerNode}
                                        style={{ transform: `translate(-50%, -50%) rotate(${-startAngle}deg)` }} // Initial upright state
                                    >
                                        <div className={styles.partnerNodeContent}>
                                            <img src={partner.src} alt={partner.alt} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Central Logo - Moved outside to escape overflow: hidden */}
            <div className={styles.centerPiece}>
                <img src="/img/Icon.webp" alt="HaNoiGo" className={styles.centerLogo} />
            </div>
        </section>
    );
};

export default memo(OurPartners);
