import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Keychain from 'react-native-keychain';
import { getDBConnection, getSetting, setSetting } from '../../database/dbService';
import { AIProvider } from '../ai/aiService';

export type ThemeMode = 'light' | 'dark';

// ✅ Interface de l'état mise à jour
interface SettingsState {
    provider: AIProvider;
    modelId: string;
    // La clé est le nom du fournisseur, la valeur est la clé API
    apiKeys: Partial<Record<AIProvider, string>>;
    language: string;
    theme: ThemeMode;
    status: 'idle' | 'loading';
}

// ✅ État initial mis à jour avec des valeurs par défaut robustes
const initialState: SettingsState = {
    provider: 'OpenAI',
    modelId: 'gpt-4o', // Modèle par défaut pour OpenAI
    apiKeys: {}, // Commence vide
    language: 'en',
    theme: 'light',
    status: 'idle',
};

// ✅ Thunk de chargement global mis à jour
export const loadSettings = createAsyncThunk('settings/loadSettings', async () => {
    const db = await getDBConnection();
    // On charge toutes les configurations en parallèle
    const [provider, modelId, language, theme] = await Promise.all([
        getSetting(db, 'ai_provider'),
        getSetting(db, 'ai_model_id'),
        getSetting(db, 'language'),
        getSetting(db, 'theme'),
    ]);

    let apiKeys: Partial<Record<AIProvider, string>> = {};
    // Le service 'api_keys' stockera toutes nos clés
    const credentials = await Keychain.getGenericPassword({ service: 'com.organext.apikeys' });
    if (credentials) {
        // La chaîne JSON est dans le champ 'password'
        apiKeys = JSON.parse(credentials.password);
    }

    return {
        provider: (provider as AIProvider) || initialState.provider,
        modelId: modelId || initialState.modelId,
        language: language || initialState.language,
        theme: (theme as ThemeMode) || initialState.theme,
        apiKeys,
    };
});

// ✅ Nouveau thunk pour sauvegarder le fournisseur ET le modèle
export const setProviderAndModel = createAsyncThunk(
    'settings/setProviderAndModel',
    async ({ provider, modelId }: { provider: AIProvider; modelId: string }) => {
        const db = await getDBConnection();
        await Promise.all([
            setSetting(db, 'ai_provider', provider),
            setSetting(db, 'ai_model_id', modelId),
        ]);
        return { provider, modelId };
    }
);

// ✅ Thunk mis à jour pour sauvegarder LA clé API d'UN fournisseur
export const setApiKeyForProvider = createAsyncThunk(
    'settings/setApiKeyForProvider', 
    async ({ provider, apiKey }: { provider: AIProvider, apiKey: string }, { getState }) => {
        const state = getState() as { settings: SettingsState }; // Typage pour getState
        const currentKeys = state.settings.apiKeys;
        
        // On crée le nouvel objet de clés
        const newKeys = { ...currentKeys, [provider]: apiKey };
        
        // On le convertit en chaîne JSON
        const keysJson = JSON.stringify(newKeys);
        
        // On le sauvegarde dans Keychain sous un service spécifique
        await Keychain.setGenericPassword('api_keys_user', keysJson, { service: 'com.organext.apikeys' });
        
        return newKeys;
    }
);

// Thunks pour la langue et le thème (inchangés)
export const setLanguage = createAsyncThunk('settings/setLanguage', async (lang: string) => {
    const db = await getDBConnection();
    await setSetting(db, 'language', lang);
    return lang;
});

export const setTheme = createAsyncThunk('settings/setTheme', async (theme: ThemeMode) => {
    const db = await getDBConnection();
    await setSetting(db, 'theme', theme);
    return theme;
});

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {},
    // ✅ extraReducers mis à jour pour gérer les nouveaux états
    extraReducers: (builder) => {
        builder
            // Gérer le chargement
            .addCase(loadSettings.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(loadSettings.fulfilled, (state, action) => {
                state.provider = action.payload.provider;
                state.modelId = action.payload.modelId;
                state.apiKeys = action.payload.apiKeys; // Charge toutes les clés
                state.language = action.payload.language;
                state.theme = action.payload.theme;
                state.status = 'idle';
            })
            // Gérer la sauvegarde du fournisseur/modèle
            .addCase(setProviderAndModel.fulfilled, (state, action) => {
                state.provider = action.payload.provider;
                state.modelId = action.payload.modelId;
            })
            // Gérer la sauvegarde d'une clé API
            .addCase(setApiKeyForProvider.fulfilled, (state, action) => {
                state.apiKeys = action.payload; // Met à jour l'objet de clés
            })
            // Gérer les autres actions
            .addCase(setLanguage.fulfilled, (state, action) => {
                state.language = action.payload;
            })
            .addCase(setTheme.fulfilled, (state, action) => {
                state.theme = action.payload;
            });
    },
});

export type { SettingsState }; // Exporter le type si nécessaire ailleurs
export default settingsSlice.reducer;
