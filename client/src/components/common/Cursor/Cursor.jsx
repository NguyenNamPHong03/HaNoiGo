import { useEffect, useRef } from 'react';
import { useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import styles from './Cursor.module.css';

const lerp = (a, b, n) => (1 - n) * a + n * b;

const getMousePos = (e) => {
    return { x: e.clientX, y: e.clientY };
};

const Cursor = forwardRef((props, ref) => {
    const cursorRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const renderedStylesRef = useRef({
        tx: { previous: 0, current: 0, amt: 0.2 },
        ty: { previous: 0, current: 0, amt: 0.2 },
        scale: { previous: 1, current: 1, amt: 0.2 },
        opacity: { previous: 1, current: 1, amt: 0.2 }
    });
    const rafIdRef = useRef(null);

    useImperativeHandle(ref, () => ({
        enter: () => {
            renderedStylesRef.current.scale.current = 4;
            renderedStylesRef.current.opacity.current = 0.2;
        },
        leave: () => {
            renderedStylesRef.current.scale.current = 1;
            renderedStylesRef.current.opacity.current = 1;
        }
    }));

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        const bounds = cursor.getBoundingClientRect();
        let isFirstMove = true;

        const handleMouseMove = (e) => {
            mouseRef.current = getMousePos(e);

            if (isFirstMove) {
                const styles = renderedStylesRef.current;
                styles.tx.previous = styles.tx.current = mouseRef.current.x - bounds.width / 2;
                styles.ty.previous = styles.ty.current = mouseRef.current.y - bounds.height / 2;

                gsap.to(cursor, {
                    duration: 0.9,
                    ease: 'Power3.easeOut',
                    opacity: 1
                });

                isFirstMove = false;
                render();
            }
        };

        const render = () => {
            const styles = renderedStylesRef.current;

            styles.tx.current = mouseRef.current.x - bounds.width / 2;
            styles.ty.current = mouseRef.current.y - bounds.height / 2;

            for (const key in styles) {
                styles[key].previous = lerp(
                    styles[key].previous,
                    styles[key].current,
                    styles[key].amt
                );
            }

            cursor.style.transform = `translateX(${styles.tx.previous}px) translateY(${styles.ty.previous}px) scale(${styles.scale.previous})`;
            cursor.style.opacity = styles.opacity.previous;

            rafIdRef.current = requestAnimationFrame(render);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    return (
        <svg
            ref={cursorRef}
            className={styles.cursor}
            width="25"
            height="25"
            viewBox="0 0 25 25"
        >
            <circle
                className={styles.cursorInner}
                cx="12.5"
                cy="12.5"
                r="6.25"
            />
        </svg>
    );
});

Cursor.displayName = 'Cursor';

export default Cursor;