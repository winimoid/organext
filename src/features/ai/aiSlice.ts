// src/features/ai/aiSlice.ts (Nouveau fichier)

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { getDBConnection, getAllItems, insertItem, getMessagesByConversationId, updateItem, deleteItem } from '../../database/dbService';
import { generateText } from './aiService';
import { handleAppError } from '../../utils/helpers';

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

interface AIState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AIState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  status: 'idle',
  error: null,
};

// --- THUNKS ---

export const fetchConversations = createAsyncThunk('ai/fetchConversations', async () => {
    const db = await getDBConnection();
    return await getAllItems<Conversation>(db, 'conversations');
});

export const startNewConversation = createAsyncThunk('ai/startNewConversation', async ({ title, provider, modelId }: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const db = await getDBConnection();
    const now = new Date().toISOString();
    const newConversation: Conversation = {
        id: uuidv4(),
        title,
        provider,
        modelId,
        createdAt: now,
        updatedAt: now,
    };
    await insertItem(db, 'conversations', newConversation);
    return newConversation;
});

export const loadConversationMessages = createAsyncThunk('ai/loadConversationMessages', async (conversationId: string) => {
    const db = await getDBConnection();
    const messages = await getMessagesByConversationId(db, conversationId);
    return { conversationId, messages };
});

export const sendMessage = createAsyncThunk(
    'ai/sendMessage',
    async ({ conversation, prompt }: { conversation: Conversation; prompt: string }, { dispatch, getState }) => {
        const db = await getDBConnection();
        const state = getState() as any;
        const apiKey = state.settings.apiKeys[conversation.provider];
        let currentConversation = { ...conversation };

        // 1. Sauvegarder le message de l'utilisateur
        const userMessage: Message = {
            id: uuidv4(),
            conversationId: conversation.id,
            text: prompt,
            sender: 'user',
            timestamp: new Date().toISOString(),
        };
        await insertItem(db, 'messages', userMessage);
        dispatch(aiSlice.actions.addMessage(userMessage));

        // 2. Mettre à jour la date de la conversation
        currentConversation.updatedAt = new Date().toISOString();
        await updateItem(db, 'conversations', currentConversation);
        dispatch(aiSlice.actions.updateConversation(currentConversation));

        // 3. Obtenir la réponse de l'IA
        const aiResponseText = await generateText(prompt, conversation.provider as any, apiKey, conversation.modelId);
        
        // 4. Sauvegarder la réponse de l'IA
        const aiMessage: Message = {
            id: uuidv4(),
            conversationId: conversation.id,
            text: aiResponseText,
            sender: 'ai',
            timestamp: new Date().toISOString(),
        };
        await insertItem(db, 'messages', aiMessage);
        
        // ✅ 5. LOGIQUE DE GÉNÉRATION DE TITRE
        // Si le titre est encore celui par défaut...
        if (currentConversation.title.startsWith('Nouvelle Conversation') || currentConversation.title.startsWith('New Conversation')) {
            // On demande à l'IA de générer un titre concis.
            const titlePrompt = `Summarize the following text in 5 words or less, to be used as a conversation title: "${prompt}"`;
            try {
                const newTitle = await generateText(titlePrompt, conversation.provider as any, apiKey, conversation.modelId);
                // On nettoie le titre (enlève les guillemets, etc.)
                const cleanedTitle = newTitle.replace(/"/g, '').trim();
                
                if (cleanedTitle) {
                    currentConversation.title = cleanedTitle;
                    await updateItem(db, 'conversations', currentConversation);
                    // On met à jour le titre dans le state Redux
                    dispatch(aiSlice.actions.updateConversation(currentConversation));
                }
            } catch (e) {
                const message = handleAppError(e, 'Failed to generate conversation title');
            }
        }
        
        return aiMessage;
    }
);

// ✅ Nouveau thunk pour supprimer une conversation
export const deleteConversation = createAsyncThunk('ai/deleteConversation', async (conversationId: string) => {
    const db = await getDBConnection();
    // La suppression en cascade (ON DELETE CASCADE) dans la table 'messages'
    // s'occupera de supprimer automatiquement tous les messages associés.
    await deleteItem(db, 'conversations', conversationId);
    return conversationId;
});

// --- SLICE ---

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setActiveConversationId: (state, action: PayloadAction<string | null>) => {
        state.activeConversationId = action.payload;
        if (action.payload === null) {
            state.messages = [];
        }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
        state.messages.push(action.payload);
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
        const index = state.conversations.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
            state.conversations[index] = action.payload;
        }
    },
  },
  extraReducers: (builder) => {
    builder
        .addCase(fetchConversations.fulfilled, (state, action) => {
            state.conversations = action.payload.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        })
        .addCase(startNewConversation.fulfilled, (state, action) => {
            state.conversations.unshift(action.payload);
            state.activeConversationId = action.payload.id;
            state.messages = [];
        })
        .addCase(loadConversationMessages.fulfilled, (state, action) => {
            state.activeConversationId = action.payload.conversationId;
            state.messages = action.payload.messages;
        })
        .addCase(sendMessage.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(sendMessage.fulfilled, (state, action) => {
            state.messages.push(action.payload);
            state.status = 'succeeded';
        })
        .addCase(sendMessage.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.error.message || 'Failed to send message';
            // Optionnel : ajouter un message d'erreur dans le chat
            const errorMessage: Message = {
                id: uuidv4(),
                conversationId: state.activeConversationId!,
                text: action.error.message || 'An error occurred',
                sender: 'ai',
                timestamp: new Date().toISOString()
            };
            state.messages.push(errorMessage);
        })
        // ✅ Gérer la suppression d'une conversation
        .addCase(deleteConversation.fulfilled, (state, action) => {
            state.conversations = state.conversations.filter(c => c.id !== action.payload);
        });
    },
});

export const { setActiveConversationId } = aiSlice.actions;
export default aiSlice.reducer;
