import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique identifier (UUID v4).
 * A good practice to ensure all IDs are universally unique.
 * @returns {string} A new UUID.
 */
export const generateUUID = (): string => {
    return uuidv4();
};

/**
 * Formats a date object into a more readable string.
 * @param {Date} date The date to format.
 * @param {string} locale The locale to use for formatting (e.g., 'en-US', 'fr-FR').
 * @returns {string} The formatted date string.
 */
export const formatDate = (date: Date, locale: string = 'en-US'): string => {
    return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * A simple debounce function.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Checks if a given ISO date string corresponds to today.
 * @param {string} isoDate The date string to check.
 * @returns {boolean} True if the date is today, false otherwise.
 */
export const isToday = (isoDate: string): boolean => {
    if (!isoDate) return false;
    const date = new Date(isoDate);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate();
};

/**
 * Gets the name of a month from its number.
 * @param {number} monthIndex The month number (0-11).
 * @param {string} locale The locale to use ('en', 'fr', etc.).
 * @returns {string} The full name of the month.
 */
export const getMonthName = (monthIndex: number, locale: string): string => {
  const date = new Date();
  date.setMonth(monthIndex);
  return date.toLocaleString(locale, { month: 'long' });
}

/**
 * Gets the week number of a date within its month.
 * @param {Date} date The date object.
 * @returns {number} The week number (1-5).
 */
export const getWeekOfMonth = (date: Date): number => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.floor(offsetDate / 7) + 1;
}

/**
 * Gère différents types d'erreurs (HTTP, JS, personnalisées) et retourne un message utilisateur.
 * @param error - Erreur capturée dans un bloc try/catch.
 * @param contextMessage - (Optionnel) Message pour situer le contexte de l'erreur.
 * @returns Chaîne de texte claire à afficher à l'utilisateur.
 */
export const handleAppError = (error: any, contextMessage: string | null = null) => {
    if (contextMessage) {
        console.error(`❌ ${contextMessage}`);
    }

    let userMessage = 'Une erreur inattendue est survenue.';

    // 🔴 Erreurs HTTP (Axios)
    if (error?.response) {
        console.error('🔴 HTTP Error Response:');
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);

        // Utilisation d’un message si présent dans la réponse
        if (error.response.data?.message) {
            userMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
            userMessage = error.response.data;
        } else {
            userMessage = `Erreur serveur (${error.response.status})`;
        }
    }

    // 🟠 Problème de requête sans réponse
    else if (error?.request) {
        console.error('🟠 Aucune réponse reçue pour la requête :', error.request);
        userMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }

    // ⚠️ Erreur JS classique
    else if (error instanceof Error) {
        console.error('⚠️ Erreur JS:', error.message);
        userMessage = error.message;
    }

    // 🔵 Erreur personnalisée ou objet inconnu
    else if (typeof error === 'object' && error !== null) {
        console.error('🔵 Erreur personnalisée ou inconnue:', error);
        userMessage = error.message || error.details || JSON.stringify(error);
    }

    // 🟣 Erreur de type inconnu
    else {
        console.error('🟣 Erreur inattendue:', error);
        userMessage = String(error);
    }

    // 📦 Config Axios si dispo
    if (error?.config) {
        console.error('📦 Axios config:', error.config);
    }

    return userMessage;
};
