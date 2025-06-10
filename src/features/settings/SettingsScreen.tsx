import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setLanguage, setTheme as setThemeAction, setProviderAndModel, setApiKeyForProvider } from './settingsSlice';
import { RootState } from '../../store/store';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { AIProvider, AI_MODELS } from '../ai/aiService';

export const SettingsScreen = () => {
    const dispatch = useAppDispatch();
    const { t, i18n } = useTranslation();
    const { theme, setTheme, isDark } = useTheme();
    const settings = useAppSelector((state: RootState) => state.settings);

    // États locaux pour gérer les sélections dans l'UI
    const [selectedProvider, setSelectedProvider] = useState<AIProvider>(settings.provider);
    const [selectedModelId, setSelectedModelId] = useState<string>(settings.modelId);
    const [localApiKey, setLocalApiKey] = useState(settings.apiKeys[settings.provider] || '');
    const [customHfModel, setCustomHfModel] = useState(settings.provider === 'HuggingFace' ? settings.modelId : '');

    // Mettre à jour les champs lorsque le fournisseur sélectionné change
    useEffect(() => {
        setLocalApiKey(settings.apiKeys[selectedProvider] || '');
        // Si le modèle actuel n'appartient pas au nouveau fournisseur, on prend le premier de la liste
        if (!AI_MODELS[selectedProvider].find(m => m.id === selectedModelId)) {
            setSelectedModelId(AI_MODELS[selectedProvider][0].id);
        }
        if (selectedProvider !== 'HuggingFace') {
            setCustomHfModel('');
        } else {
            setCustomHfModel(settings.modelId);
        }
    }, [selectedProvider, settings.apiKeys, settings.modelId]);

    const handleSaveAISettings = () => {
        const finalModelId = selectedProvider === 'HuggingFace' ? customHfModel : selectedModelId;
        if (!finalModelId) {
            Alert.alert(t('error'), t('modelRequired'));
            return;
        }
        dispatch(setProviderAndModel({ provider: selectedProvider, modelId: finalModelId }));
        dispatch(setApiKeyForProvider({ provider: selectedProvider, apiKey: localApiKey }));
        Alert.alert(t('settingsSaved'), t('aiSettingsUpdated'));
    };
    
    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        dispatch(setLanguage(lang));
    };

    const handleThemeToggle = (value: boolean) => {
        const newTheme = value ? 'dark' : 'light';
        setTheme(newTheme);
        dispatch(setThemeAction(newTheme));
    };

    return (
        <MainLayout>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* --- Section Apparence & Langue --- */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('appearance')}</Text>
                <View style={[styles.settingRow, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('darkMode')}</Text>
                    <Switch trackColor={{ false: "#767577", true: theme.colors.primary }} thumbColor={isDark ? theme.colors.accent : "#f4f3f4"} onValueChange={handleThemeToggle} value={isDark} />
                </View>
                <View style={[styles.pickerContainer, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('language')}</Text>
                    <Picker selectedValue={settings.language} onValueChange={handleLanguageChange} style={{color: theme.colors.text}}>
                        <Picker.Item label="Français" value="fr" />
                        <Picker.Item label="English" value="en" />
                    </Picker>
                </View>

                {/* --- Section Assistant IA --- */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 30 }]}>{t('aiSettings')}</Text>
                <View style={[styles.aiConfigContainer, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text, marginBottom: 10 }]}>{t('aiProvider')}</Text>
                    <Picker selectedValue={selectedProvider} onValueChange={(itemValue: AIProvider) => setSelectedProvider(itemValue)} style={{color: theme.colors.text}}>
                        {Object.keys(AI_MODELS).map(p => <Picker.Item key={p} label={p} value={p} />)}
                    </Picker>
                    
                    <Text style={[styles.settingLabel, { color: theme.colors.text, marginTop: 20, marginBottom: 10 }]}>{t('model')}</Text>
                    {selectedProvider !== 'HuggingFace' ? (
                        <Picker selectedValue={selectedModelId} onValueChange={(itemValue: string) => setSelectedModelId(itemValue)} style={{color: theme.colors.text}}>
                            {AI_MODELS[selectedProvider].map(m => <Picker.Item key={m.id} label={m.name} value={m.id} />)}
                        </Picker>
                    ) : (
                        <Input
                            label={t('hfModelIdLabel')}
                            value={customHfModel}
                            onChangeText={setCustomHfModel}
                            placeholder="e.g., mistralai/Mistral-7B-Instruct-v0.2"
                            containerStyle={{ marginTop: 0, marginBottom: 10 }}
                        />
                    )}

                    <Input
                        label={`${selectedProvider} ${t('apiKey')}`}
                        value={localApiKey}
                        onChangeText={setLocalApiKey}
                        placeholder={t('enterApiKey')}
                        secureTextEntry
                        containerStyle={{ marginTop: 20 }}
                    />
                    <Button title={t('save')} onPress={handleSaveAISettings} style={{ marginTop: 20 }}/>
                </View>
            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1 },
    pickerContainer: { padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1 },
    settingLabel: { fontSize: 18 },
    aiConfigContainer: { padding: 20, borderRadius: 10, borderWidth: 1 },
});
