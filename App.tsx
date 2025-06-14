import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { store } from './src/store/store';
import Navigation from './src/components/Layout/Navigation';
import { useDatabase } from './src/hooks/useDatabase';
import { initI18n } from './src/i18n';
import { notificationService } from './src/notifications/notificationService';
import { ThemeProvider } from './src/components/UI/ThemeProvider';
import { darkTheme, lightTheme } from './src/styles/theme';

const App = () => {
  const { isDBLoading, db } = useDatabase();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await initI18n();
      notificationService.configure();
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
