import { forwardRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChatInput.module.css";
import MagneticButton from "../MagneticButton/MagneticButton";
import Fong from "../Fong/Fong";
import { useCursor } from "../../../contexts/CursorContext";

const ChatInput = forwardRef((props, ref) => {
    const cursorRef = useCursor();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    // Navigate to search page with query
    const handleSearch = useCallback(() => {
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    }, [query, navigate]);

    // Handle Enter key press
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    // Handle suggestion click
    const handleSuggestionClick = useCallback((suggestionText) => {
        navigate(`/search?q=${encodeURIComponent(suggestionText)}`);
    }, [navigate]);

    const handleMouseEnter = useCallback(() => {
        cursorRef?.current?.enter();
    }, [cursorRef]);

    const handleMouseLeave = useCallback(() => {
        cursorRef?.current?.leave();
    }, [cursorRef]);

    return (
        <div ref={ref} className={styles.chatInput + " liquid"}>
            <div className={styles.fong} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <Fong />
                <p>Powered by Fong 1.3</p>
            </div>

            <div className={styles.inputBox}>
                <input
                    type="text"
                    placeholder="Tìm quán ốc ngon ở Ba Đình, cafe học bài yên tĩnh..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <MagneticButton
                    bg="var(--yellow)"
                    borderColor="var(--yellow)"
                    hoverBg="var(--yellow)"
                    hoverBorderColor="var(--yellow)"
                    padding="15px 35px"
                    borderRadius="30px"
                    onClick={handleSearch}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 0 47 27" fill="none">
                        <path d="M33.5813 0L31.3717 2.20967L40.7464 11.5844H0V14.7095H40.7461L31.3717 24.0839L33.5813 26.2936L46.7283 13.1468L33.5813 0Z" fill="black" />
                    </svg>
                </MagneticButton>
            </div>
            <div className={styles.suggestions}>
                <div
                    className={styles.suggestionItem}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleSuggestionClick("Gợi ý địa điểm thú vị ở Hà Nội")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 0 50 50" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M28.3384 2.33839C27.2027 -0.779464 22.7955 -0.779464 21.6598 2.33839L16.5063 16.5063L2.33839 21.6598C-0.779464 22.7955 -0.779464 27.2027 2.33839 28.3384L16.5063 33.492L21.6598 47.6598C22.7955 50.7777 27.2027 50.7777 28.3384 47.6598L33.492 33.492L47.6598 28.3384C50.7777 27.2027 50.7777 22.7955 47.6598 21.6598L33.492 16.5063L28.3384 2.33839Z" fill="black" />
                    </svg>
                    <p>Gợi ý địa điểm</p>
                </div>
                <div
                    className={styles.suggestionItem}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleSuggestionClick("Nhà hàng lãng mạn cho buổi hẹn hò ở Hà Nội")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 0 50 50" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M28.3384 2.33839C27.2027 -0.779464 22.7955 -0.779464 21.6598 2.33839L16.5063 16.5063L2.33839 21.6598C-0.779464 22.7955 -0.779464 27.2027 2.33839 28.3384L16.5063 33.492L21.6598 47.6598C22.7955 50.7777 27.2027 50.7777 28.3384 47.6598L33.492 33.492L47.6598 28.3384C50.7777 27.2027 50.7777 22.7955 47.6598 21.6598L33.492 16.5063L28.3384 2.33839Z" fill="black" />
                    </svg>
                    <p>Địa điểm hẹn hò</p>
                </div>
                <div
                    className={styles.suggestionItem}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleSuggestionClick("Quán cafe yên tĩnh để học bài ở Hà Nội")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="15" viewBox="0 0 50 50" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M28.3384 2.33839C27.2027 -0.779464 22.7955 -0.779464 21.6598 2.33839L16.5063 16.5063L2.33839 21.6598C-0.779464 22.7955 -0.779464 27.2027 2.33839 28.3384L16.5063 33.492L21.6598 47.6598C22.7955 50.7777 27.2027 50.7777 28.3384 47.6598L33.492 33.492L47.6598 28.3384C50.7777 27.2027 50.7777 22.7955 47.6598 21.6598L33.492 16.5063L28.3384 2.33839Z" fill="black" />
                    </svg>
                    <p>Cafe học bài</p>
                </div>
            </div>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;