import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useCursor } from '../../../contexts/CursorContext';
import styles from './MagneticButton.module.css';

// Utility functions
const lerp = (a, b, n) => (1 - n) * a + n * b;

const getMousePos = (e) => {
    return { x: e.clientX, y: e.clientY };
};

const distance = (x1, y1, x2, y2) => {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.hypot(a, b);
};

const MagneticButton = ({
    children,
    onClick,
    className = '',
    // Color props với default khớp CSS hiện tại
    bg = 'transparent',
    color = '#000',
    borderColor = '#000',
    hoverBg = 'transparent',
    hoverColor = '#000',
    hoverBorderColor = '#000',
    // Size props
    padding,
    borderRadius
}) => {
    const cursorRef = useCursor();
    const buttonRef = useRef(null);
    const textRef = useRef(null);
    const textInnerRef = useRef(null);

    const mouseRef = useRef({ x: 0, y: 0 });
    const rectRef = useRef(null);
    const distanceToTriggerRef = useRef(0);
    const isHoverRef = useRef(false);

    const renderedStylesRef = useRef({
        tx: { previous: 0, current: 0, amt: 0.1 },
        ty: { previous: 0, current: 0, amt: 0.1 }
    });

    const rafIdRef = useRef(null);

    useEffect(() => {
        const button = buttonRef.current;
        const text = textRef.current;
        const textInner = textInnerRef.current;

        if (!button || !text || !textInner) return;

        const calculateSizePosition = () => {
            rectRef.current = button.getBoundingClientRect();
            distanceToTriggerRef.current = rectRef.current.width * 0.7;
        };

        calculateSizePosition();

        const handleMouseMove = (e) => {
            mouseRef.current = getMousePos(e);
        };

        const enter = () => {
            // Trigger cursor animation
            cursorRef?.current?.enter();

            isHoverRef.current = true;
            button.classList.add(styles.buttonHover);

            gsap.killTweensOf(textInner);
            gsap.timeline()
                .to(textInner, {
                    duration: 0.15,
                    ease: 'power2.in',
                    opacity: 0,
                    y: '-20%'
                })
                .to(textInner, {
                    duration: 0.2,
                    ease: 'expo.out',
                    opacity: 1,
                    y: '0%',
                    startAt: { y: '100%' }
                });
        };

        const leave = () => {
            // Trigger cursor animation
            cursorRef?.current?.leave();

            isHoverRef.current = false;
            button.classList.remove(styles.buttonHover);

            gsap.killTweensOf(textInner);
            gsap.timeline()
                .to(textInner, {
                    duration: 0.15,
                    ease: 'power2.in',
                    opacity: 0,
                    y: '20%'
                })
                .to(textInner, {
                    duration: 0.2,
                    ease: 'expo.out',
                    opacity: 1,
                    y: '0%',
                    startAt: { y: '-100%' }
                });
        };

        const render = () => {
            const rect = rectRef.current;

            // Skip if rect is not valid (button in collapsed container)
            if (!rect || rect.width === 0 || rect.height === 0) {
                rafIdRef.current = requestAnimationFrame(render);
                return;
            }

            const distanceMouseButton = distance(
                mouseRef.current.x + window.scrollX,
                mouseRef.current.y + window.scrollY,
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );

            let x = 0;
            let y = 0;

            if (distanceMouseButton < distanceToTriggerRef.current) {
                if (!isHoverRef.current) {
                    enter();
                }
                x = (mouseRef.current.x + window.scrollX - (rect.left + rect.width / 2)) * 0.3;
                y = (mouseRef.current.y + window.scrollY - (rect.top + rect.height / 2)) * 0.3;
            } else if (isHoverRef.current) {
                leave();
            }

            const styles = renderedStylesRef.current;
            styles.tx.current = x;
            styles.ty.current = y;

            for (const key in styles) {
                styles[key].previous = lerp(
                    styles[key].previous,
                    styles[key].current,
                    styles[key].amt
                );
            }

            button.style.transform = `translate3d(${styles.tx.previous}px, ${styles.ty.previous}px, 0)`;
            text.style.transform = `translate3d(${-styles.tx.previous * 0.6}px, ${-styles.ty.previous * 0.6}px, 0)`;

            rafIdRef.current = requestAnimationFrame(render);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', calculateSizePosition);

        // Debounced recalculate function
        let recalcTimeout;
        const debouncedRecalculate = () => {
            clearTimeout(recalcTimeout);
            recalcTimeout = setTimeout(calculateSizePosition, 50);
        };

        // ResizeObserver on button AND its positioned ancestor (parent container)
        const resizeObserver = new ResizeObserver(debouncedRecalculate);
        resizeObserver.observe(button);

        // Find and observe closest positioned ancestor (handles parent animation)
        let parent = button.parentElement;
        while (parent && parent !== document.body) {
            const position = getComputedStyle(parent).position;
            if (position !== 'static') {
                resizeObserver.observe(parent);
                break;
            }
            parent = parent.parentElement;
        }

        // MutationObserver to detect style changes on parent (e.g., height animation)
        const mutationObserver = new MutationObserver(debouncedRecalculate);
        if (button.parentElement) {
            mutationObserver.observe(button.parentElement, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }

        rafIdRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', calculateSizePosition);
            clearTimeout(recalcTimeout);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [cursorRef]);

    // CSS variables cho màu sắc (truyền qua inline style)
    const buttonStyle = {
        '--mb-bg': bg,
        '--mb-color': color,
        '--mb-border': borderColor,
        '--mb-hover-bg': hoverBg,
        '--mb-hover-color': hoverColor,
        '--mb-hover-border': hoverBorderColor,
        '--mb-padding': padding,
        '--mb-border-radius': borderRadius
    };

    return (
        <button
            ref={buttonRef}
            className={`${styles.button} ${className}`}
            style={buttonStyle}
            onClick={onClick}
        >
            <span ref={textRef} className={styles.buttonText}>
                <span ref={textInnerRef} className={styles.buttonTextInner}>
                    {children}
                </span>
            </span>
        </button>
    );
};

export default MagneticButton;