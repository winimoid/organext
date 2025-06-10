import { enablePromise, openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';

// Enable promise-based API
enablePromise(true);

export const getDBConnection = async () => {
  return openDatabase({ name: 'organext.db', location: 'default' });
};

/**
 * Creates all necessary tables if they don't exist.
 * Uses a single transaction for atomicity.
 * @param db - The database connection instance.
 */
export const createTables = async (db: SQLiteDatabase): Promise<void> => {
  const queries = [
    // Tasks table
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      dueDate TEXT,
      isCompleted BOOLEAN NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );`,
    // Events table
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      location TEXT,
      createdAt TEXT NOT NULL
    );`,
    // Appointments table (can be merged with events, but kept separate as per request)
    `CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        contact TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL
    );`,
     // Settings table for key-value storage
    `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
    );`,
    // ✅ Nouvelle table pour les conversations
    `CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      modelId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );`,

    // ✅ Nouvelle table pour les messages, liée à une conversation
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversationId TEXT NOT NULL,
      text TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'user' ou 'ai'
      timestamp TEXT NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES conversations (id) ON DELETE CASCADE
    );`,
  ];

  try {
    await db.transaction(tx => {
      queries.forEach(query => {
        tx.executeSql(query);
      });
    });
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables", error);
    throw error;
  }
};


/**
 * A generic function to get all items from a table.
 * @param db - The database connection instance.
 * @param tableName - The name of the table to fetch from.
 */
export const getAllItems = async <T>(db: SQLiteDatabase, tableName: string): Promise<T[]> => {
    try {
        const results = await db.executeSql(`SELECT * FROM ${tableName} ORDER BY createdAt DESC;`);
        const items: T[] = [];
        results.forEach(result => {
            for (let i = 0; i < result.rows.length; i++) {
                items.push(result.rows.item(i));
            }
        });
        return items;
    } catch (error) {
        console.error(`Error getting items from ${tableName}`, error);
        throw error;
    }
};

/**
 * A generic function to insert an item into a table.
 * @param db - The database connection instance.
 * @param tableName - The name of the table.
 * @param item - The item object to insert.
 */
export const insertItem = async <T extends { id: string }>(db: SQLiteDatabase, tableName: string, item: Omit<T, 'id'> & { id: string }): Promise<void> => {
    const keys = Object.keys(item);
    const values = Object.values(item);
    const placeholders = keys.map(() => '?').join(', ');
    const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders});`;

    try {
        await db.executeSql(query, values);
    } catch (error) {
        console.error(`Error inserting item into ${tableName}`, error);
        throw error;
    }
};

/**
 * A generic function to update an item in a table.
 * @param db - The database connection instance.
 * @param tableName - The name of the table.
 * @param item - The item object to update, must contain an id.
 */
export const updateItem = async <T extends { id: string }>(db: SQLiteDatabase, tableName: string, item: T): Promise<void> => {
    const { id, ...fieldsToUpdate } = item;
    const keys = Object.keys(fieldsToUpdate);
    const values = Object.values(fieldsToUpdate);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?;`;

    try {
        await db.executeSql(query, [...values, id]);
    } catch (error) {
        console.error(`Error updating item in ${tableName}`, error);
        throw error;
    }
};

/**
 * A generic function to delete an item from a table by its ID.
 * @param db - The database connection instance.
 * @param tableName - The name of the table.
 * @param id - The ID of the item to delete.
 */
export const deleteItem = async (db: SQLiteDatabase, tableName: string, id: string): Promise<void> => {
    const query = `DELETE FROM ${tableName} WHERE id = ?;`;
    try {
        await db.executeSql(query, [id]);
    } catch (error) {
        console.error(`Error deleting item from ${tableName}`, error);
        throw error;
    }
};


/**
 * Gets a setting value by key.
 * @param db The database connection.
 * @param key The key of the setting.
 * @returns The setting value or null if not found.
 */
export const getSetting = async (db: SQLiteDatabase, key: string): Promise<string | null> => {
  try {
    const [result] = await db.executeSql('SELECT value FROM settings WHERE key = ?', [key]);
    if (result.rows.length > 0) {
      return result.rows.item(0).value;
    }
    return null;
  } catch (error) {
    console.error(`Error getting setting for key ${key}`, error);
    throw error;
  }
};

/**
 * Sets (inserts or updates) a setting value.
 * @param db The database connection.
 * @param key The key of the setting.
 * @param value The value of the setting.
 */
export const setSetting = async (db: SQLiteDatabase, key: string, value: string): Promise<void> => {
  try {
    // Use INSERT OR REPLACE to handle both new and existing keys
    await db.executeSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  } catch (error) {
    console.error(`Error setting setting for key ${key}`, error);
    throw error;
  }
};

/**
 * Gets all messages for a specific conversation, ordered by time.
 * @param db - The database connection instance.
 * @param conversationId - The ID of the conversation.
 */
export const getMessagesByConversationId = async (db: SQLiteDatabase, conversationId: string): Promise<any[]> => {
    try {
        const results = await db.executeSql(`SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC;`, [conversationId]);
        const items: any[] = [];
        results.forEach(result => {
            for (let i = 0; i < result.rows.length; i++) {
                items.push(result.rows.item(i));
            }
        });
        return items;
    } catch (error) {
        console.error(`Error getting messages for conversation ${conversationId}`, error);
        throw error;
    }
};
