import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isNightMode, setIsNightMode] = useState(false);

    useEffect(() => {
        // Apply night mode class to body for global CSS overrides
        if (isNightMode) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
    }, [isNightMode]);

    const toggleTheme = () => setIsNightMode(!isNightMode);

    return (
        <ThemeContext.Provider value={{ isNightMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
