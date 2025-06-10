import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { store } from './store/store';
import Navigation from './components/Layout/Navigation';
import { useDatabase } from './hooks/useDatabase';
import { initI18n } from './i18n';
import { notificationService } from './notifications/notificationService';
import { ThemeProvider } from './components/UI/ThemeProvider';
import { darkTheme, lightTheme } from './styles/theme';
import { configureBackgroundFetch } from './services/backgroundTaskService';

const App = () => {
  const { isDBLoading, db } = useDatabase();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await initI18n();
      notificationService.configure();
      // ✅ Configuration de la tâche de fond
      await configureBackgroundFetch();
      setIsAppReady(true);
    };

    initializeApp();
  }, []);

  if (isDBLoading || !isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        {/* The rest of the app will be wrapped by ThemeContext.Consumer in Navigation.tsx */}
        <Navigation />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
