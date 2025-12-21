import { memo, useMemo } from 'react';
import { useCursor } from '../../contexts/CursorContext';
import styles from "./Link.module.css";

const Link = memo(({ children, href = "#", color = "#fff" }) => {
    // ✅ useMemo for style object to prevent re-creation (Rules.md §5.4)
    const linkStyle = useMemo(() => ({ color }), [color]);
    const cursorRef = useCursor();

    const handleMouseEnter = () => {
        if (cursorRef?.current) {
            cursorRef.current.enter();
        }
    };

    const handleMouseLeave = () => {
        if (cursorRef?.current) {
            cursorRef.current.leave();
        }
    };

    return (
        <a
            href={href}
            className={styles.link}
            style={linkStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span>{children}</span>
            <svg
                className={styles.linkGraphic}
                width="100%"
                height="18"
                viewBox="0 0 59 18"
            >
                <path
                    d="M.945.149C12.3 16.142 43.573 22.572 58.785 10.842"
                    pathLength="1"
                    stroke={color}
                />
            </svg>
        </a>
    );
});

Link.displayName = 'Link';

export default Link;
