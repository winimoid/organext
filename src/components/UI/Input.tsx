import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, ...props }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    { 
                        backgroundColor: theme.colors.background, 
                        color: theme.colors.text, 
                        borderColor: error ? theme.colors.danger : theme.colors.border 
                    },
                    props.multiline && { height: 100, textAlignVertical: 'top' }
                ]}
                placeholderTextColor={theme.colors.textMuted}
                {...props}
            />
            {error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500'
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    error: {
        marginTop: 5,
        fontSize: 12,
    },
});
