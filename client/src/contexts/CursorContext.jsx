import { createContext, useContext, useRef } from 'react';
import Cursor from '../components/common/Cursor/Cursor';

const CursorContext = createContext(null);

export const CursorProvider = ({ children }) => {
    const cursorRef = useRef();

    return (
        <CursorContext.Provider value={cursorRef}>
            <Cursor ref={cursorRef} />
            {children}
        </CursorContext.Provider>
    );
};

export const useCursor = () => {
    const context = useContext(CursorContext);
    if (!context) {
        console.warn('useCursor must be used within CursorProvider');
        return null;
    }
    return context;
};