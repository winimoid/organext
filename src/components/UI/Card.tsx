import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export const Card: React.FC<ViewProps> = ({ children, style, ...props }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow }, style]} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});
