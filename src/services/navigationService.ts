// src/services/navigationService.ts (Nouveau Fichier)

import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';

type RootStackParamList = {
  [key: string]: object | undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
