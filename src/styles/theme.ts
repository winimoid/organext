export const commonColors = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#7209b7',
  danger: '#d00000',
  success: '#4c956c',
};

// ✅ Définition centralisée des polices
const fonts = {
  regular: { fontFamily: 'Outfit-Regular', fontWeight: '400' as const },
  medium: { fontFamily: 'Outfit-Medium', fontWeight: '500' as const },
  bold: { fontFamily: 'Outfit-Bold', fontWeight: '700' as const },
  heavy: { fontFamily: 'Outfit-Bold', fontWeight: '700' as const }, // Mappé sur bold
};

export const lightTheme = {
  dark: false,
  colors: {
    ...commonColors,
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#212529',
    textMuted: '#6c757d',
    border: '#dee2e6',
    shadow: '#000000',
    disabled: '#ced4da',
  },
  fonts, // ✅ Ajout des polices au thème
};

export const darkTheme = {
  dark: true,
  colors: {
    ...commonColors,
    background: '#121212',
    card: '#1e1e1e',
    text: '#e0e0e0',
    textMuted: '#9e9e9e',
    border: '#2c2c2c',
    shadow: '#ffffff',
    disabled: '#424242',
  },
  fonts, // ✅ Ajout des polices au thème
};

export type Theme = typeof lightTheme;
