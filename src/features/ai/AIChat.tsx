import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { RootState } from '../../store/store';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { loadConversationMessages, sendMessage, setActiveConversationId, Message } from './aiSlice';

export const AIChat = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    
    // --- CONNEXION AU STATE REDUX ---
    const { messages, status, activeConversationId, conversations } = useAppSelector((state: RootState) => state.ai);
    const activeConversation = conversations.find((c: { id: string; title: string }) => c.id === activeConversationId);
    const isLoading = status === 'loading';

    // --- ÉTAT LOCAL POUR L'INPUT UTILISATEUR ---
    const [input, setInput] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // --- GESTION DE LA NAVIGATION ET DU CHARGEMENT ---
    useEffect(() => {
        const conversationIdFromRoute = route.params?.conversationId;
        if (conversationIdFromRoute) {
            // Charge les messages de la conversation sélectionnée
            dispatch(loadConversationMessages(conversationIdFromRoute));
        }

        // Action de nettoyage : quand on quitte l'écran, on désélectionne la conversation active
        return () => {
            dispatch(setActiveConversationId(null));
        };
    }, [route.params?.conversationId, dispatch]);

    // Mettre à jour le titre de l'écran avec le titre de la conversation
    useLayoutEffect(() => {
        if (activeConversation) {
            navigation.setOptions({ title: activeConversation.title });
        }
    }, [navigation, activeConversation]);
    
    // Scroll vers le bas quand de nouveaux messages arrivent
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
        }
    }, [messages]);

    // --- ENVOI DE MESSAGE VIA REDUX ---
    const handleSend = async () => {
        if (!input.trim() || !activeConversation) return;
        
        const prompt = input;
        setInput(''); // Vide l'input immédiatement pour une meilleure UX

        // L'action sendMessage gère tout : sauvegarde user, appel IA, sauvegarde IA
        await dispatch(sendMessage({ conversation: activeConversation, prompt }));
    };

    // --- GESTION DU CLAVIER ---
    const headerHeight = useHeaderHeight();
    const tabBarHeight = useBottomTabBarHeight();
    const keyboardVerticalOffset = headerHeight + tabBarHeight;

    // --- RENDU DES MESSAGES ---
    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
                <View style={[styles.messageBubble, isUser ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : theme.colors.text }]}>{item.text}</Text>
                    <Text style={[styles.timestamp, { color: isUser ? '#E0E0E0' : theme.colors.textMuted }]}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </View>
        );
    };

    // --- NOUVELLE LOGIQUE POUR LE COMPOSANT DE LISTE VIDE ---
    const renderEmptyListComponent = () => {
        // Cas 1 : C'est une nouvelle conversation qui n'a AUCUN message
        // On vérifie que la date de création et de mise à jour sont très proches (ex: moins de 5 secondes de différence)
        // ET qu'il n'y a pas de messages.
        if (activeConversation && messages.length === 0 && new Date(activeConversation.updatedAt).getTime() - new Date(activeConversation.createdAt).getTime() < 5000) {
            return (
                <View style={styles.emptyChat}>
                    <Icon name="robot-happy-outline" size={60} color={theme.colors.textMuted} />
                    <Text style={[styles.emptyChatText, { color: theme.colors.textMuted }]}>
                        {t('aiWelcome')}
                    </Text>
                </View>
            );
        }

        // Cas 2 : C'est une conversation existante mais vide
        if (activeConversation && messages.length === 0) {
            return (
                <View style={styles.emptyChat}>
                    <Icon name="message-text-outline" size={60} color={theme.colors.textMuted} />
                    <Text style={styles.emptyChatText}>
                        {t('startTyping')}
                    </Text>
                </View>
            );
        }
        
        // Cas 3 (Erreur) : Aucune conversation n'est sélectionnée
        if (!activeConversation) {
            return (
                <View style={styles.emptyChat}>
                    <Icon name="alert-circle-outline" size={60} color={theme.colors.danger} />
                    <Text style={styles.emptyChatText}>
                        {t('noConversationSelected')}
                    </Text>
                </View>
            );
        }

        // Cas par défaut (ne devrait pas arriver)
        return null;
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={keyboardVerticalOffset}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages} // Les messages viennent maintenant de Redux
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatList}
                    // ✅ On appelle notre nouvelle fonction de rendu ici
                    ListEmptyComponent={renderEmptyListComponent}
                />
                
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                        value={input}
                        onChangeText={setInput}
                        placeholder={t('askAiPlaceholder')}
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        // Désactivé si aucune conversation n'est active
                        editable={!!activeConversation} 
                    />
                    <TouchableOpacity 
                        onPress={handleSend} 
                        // Désactivé si en chargement ou si l'input est vide
                        disabled={isLoading || !input.trim() || !activeConversation} 
                        style={styles.sendButton}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Icon name="send-circle" size={36} color={!input.trim() || !activeConversation ? theme.colors.disabled : theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Les styles restent les mêmes que votre version précédente
const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    chatList: { flexGrow: 1, paddingHorizontal: 10, paddingBottom: 10 },
    messageContainer: { marginVertical: 5, maxWidth: '80%' },
    userMessageContainer: { alignSelf: 'flex-end' },
    aiMessageContainer: { alignSelf: 'flex-start' },
    messageBubble: { padding: 12, borderRadius: 20, elevation: 1 },
    messageText: { fontSize: 16 },
    timestamp: { fontSize: 10, alignSelf: 'flex-end', marginTop: 5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1 },
    textInput: { flex: 1, maxHeight: 100, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, borderRadius: 25, marginRight: 8, fontSize: 16 },
    sendButton: { padding: 5 },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50, // Pour décoller un peu du bas
    },
    emptyChatText: {
        marginTop: 15,
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 24,
    },
});
