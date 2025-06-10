import React, { createContext, useState, useMemo, useEffect, act } from 'react';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { RootState } from '../../store/store';
import { loadSettings, setTheme as setThemeAction, ThemeMode } from '../../features/settings/settingsSlice';
import { lightTheme, darkTheme } from '../../styles/theme';
import { i18n } from '../../i18n';

interface ThemeContextType {
    isDark: boolean;
    theme: typeof lightTheme;
    setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useAppDispatch();
    const settings = useAppSelector((state: RootState) => state.settings);
    const systemTheme = useColorScheme();
    
    const [activeTheme, setActiveTheme] = useState<ThemeMode>(settings.theme || systemTheme || 'light');

    // Load settings on initial mount
    useEffect(() => {
        dispatch(loadSettings());
    }, [dispatch]);

    // Once settings are loaded, update the theme and language
    useEffect(() => {
        if (settings.status === 'idle') {
            setActiveTheme(settings.theme || systemTheme || 'light');
            i18n.changeLanguage(settings.language || 'en');
        }
    }, [settings, systemTheme]);
    
    const setTheme = (newTheme: ThemeMode) => {
        setActiveTheme(newTheme);
        dispatch(setThemeAction(newTheme));
    };

    const theme = useMemo(() => {
        return activeTheme === 'dark' ? darkTheme : lightTheme;
    }, [activeTheme]);

    const value = {
        isDark: activeTheme === 'dark',
        theme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
