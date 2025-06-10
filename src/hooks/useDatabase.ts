import { useState, useEffect, useCallback } from 'react';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection, createTables } from '../database/dbService';

export const useDatabase = () => {
    const [isDBLoading, setIsDBLoading] = useState(true);
    const [db, setDb] = useState<SQLiteDatabase | null>(null);

    const loadData = useCallback(async () => {
        try {
            const dbInstance = await getDBConnection();
            await createTables(dbInstance);
            setDb(dbInstance);
            setIsDBLoading(false);
        } catch (error) {
            console.error(error);
            setIsDBLoading(false); // Even on error, stop loading
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { isDBLoading, db };
};
