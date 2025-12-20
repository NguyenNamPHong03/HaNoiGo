import { memo } from "react";
import useTextReveal from "../../../hooks/useTextReveal";

const TitleSection = ({ children, className = "", triggerStart = "top 80%" }) => {
    const textRef = useTextReveal({
        triggerStart: triggerStart,
        toggleActions: "play none none none"
    });

    return (
        <p className={`titleSection ${className}`} ref={textRef}>
            {children}
        </p>
    );
};

export default memo(TitleSection);
