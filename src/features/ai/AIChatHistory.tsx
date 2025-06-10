// src/features/ai/AIChatHistory.tsx (Nouveau fichier)

import React, { useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchConversations, startNewConversation, deleteConversation, Conversation } from './aiSlice';
import { RootState } from '../../store/store';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card } from '../../components/UI/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AIChatHistory = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { theme } = useTheme();
    // ✅ Ce hook renvoie `true` quand l'écran est visible
    const isFocused = useIsFocused();
    const { conversations, status: aiStatus } = useAppSelector((state: RootState) => state.ai);
    const { provider, modelId } = useAppSelector((state: RootState) => state.settings);

    // ✅ L'effet se déclenche maintenant à chaque fois que l'écran redevient visible
    useEffect(() => {
        // On ne charge les conversations que si l'écran est au premier plan
        if (isFocused) {
            console.log("AIChatHistory is focused, fetching conversations...");
            dispatch(fetchConversations());
        }
    }, [isFocused, dispatch]);

    const handleNewConversation = () => {
        const title = `${t('newConversation')} - ${new Date().toLocaleDateString()}`;
        dispatch(startNewConversation({ title, provider, modelId })).then(() => {
            navigation.navigate('AIChat');
        });
    };

    // ✅ Logique de suppression appelée par l'appui long
    const handleDelete = (item: Conversation) => {
        Alert.alert(
            t('deleteConversationTitle'),
            t('deleteConversationMessage', { title: item.title }),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: () => {
                        dispatch(deleteConversation(item.id));
                    },
                },
            ]
        );
    };

    // ✅ Composant pour le bouton "Supprimer" qui apparaît au swipe
    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, item: Conversation) => {
        const trans = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
        });
        return (
            <TouchableOpacity onPress={() => handleDelete(item)}>
                <Animated.View style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}>
                    <Icon name="delete-outline" size={30} color="#FFFFFF" />
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Conversation }) => (
            <TouchableOpacity 
                onPress={() => navigation.navigate('AIChat', { conversationId: item.id })}
                onLongPress={() => handleDelete(item)} // Ajout de onLongPress
                delayLongPress={500} // Un délai raisonnable pour éviter les déclenchements accidentels
            >
                {/* La Card est maintenant dans une View pour que l'ombre ne soit pas coupée */}
                <View style={styles.cardContainer}>
                    <Card style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                                {item.provider} - {new Date(item.updatedAt).toLocaleString()}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
                    </Card>
                </View>
            </TouchableOpacity>
    );

    return (
        <MainLayout>
            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: theme.colors.textMuted}}>{t('noConversations')}</Text>}
                // ✅ Important pour que le swipe ne soit pas annulé par le scroll
                ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={handleNewConversation}>
                <Icon name="plus" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        paddingHorizontal: 16, // On met le padding ici plutôt que sur la Card
    },
    card: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginHorizontal: 0, // La Card prend toute la largeur du container
    },
    cardContent: {
        flex: 1, // Permet au texte de prendre l'espace disponible
    },
    title: { fontSize: 16, fontWeight: 'bold' },
    subtitle: { fontSize: 12, marginTop: 4 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    deleteAction: {
        backgroundColor: '#dd2c00', // Rouge pour la suppression
        justifyContent: 'center',
        alignItems: 'flex-end',
        width: 80,
        height: '100%',
        paddingRight: 20,
    },
});
