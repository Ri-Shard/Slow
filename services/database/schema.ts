import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('slow.db');
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS unlocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        app_opened TEXT,
        skipped BOOLEAN,
        intervention_type TEXT
      );
    `);
    }
    return db;
};

export const recordUnlock = async (type: string, skipped: boolean = false, appOpened: string | null = null) => {
    try {
        const database = await getDb();
        console.log(`Recording unlock: ${appOpened} (${type})`);
        await database.runAsync(
            'INSERT INTO unlocks (intervention_type, skipped, app_opened) VALUES (?, ?, ?)',
            [type, skipped ? 1 : 0, appOpened]
        );
    } catch (error) {
        console.error('Error saving unlock to DB:', error);
    }
};

export type UnlockRecord = {
    id: number;
    timestamp: string;
    app_opened: string | null;
    skipped: boolean;
    intervention_type: string;
};

export const getRecentUnlocks = async (limit: number = 100): Promise<UnlockRecord[]> => {
    try {
        const database = await getDb();
        return await database.getAllAsync<UnlockRecord>(`SELECT * FROM unlocks ORDER BY timestamp DESC LIMIT ?`, [limit]);
    } catch (error) {
        console.error('Error fetching unlocks:', error);
        return [];
    }
};

export const getTodayUnlockCount = async (): Promise<number> => {
    try {
        const database = await getDb();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await database.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM unlocks WHERE timestamp >= datetime(?, 'unixepoch')`,
            [Math.floor(startOfDay.getTime() / 1000)]
        );
        return result?.count || 0;
    } catch (error) {
        console.error('Error fetching today unlocks count:', error);
        return 0;
    }
};

export const getSkippedUnlocksCountToday = async (): Promise<number> => {
    try {
        const database = await getDb();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await database.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM unlocks WHERE timestamp >= datetime(?, 'unixepoch') AND skipped = 1`,
            [Math.floor(startOfDay.getTime() / 1000)]
        );
        return result?.count || 0;
    } catch (error) {
        console.error('Error fetching today skipped unlocks count:', error);
        return 0;
    }
};

export const getTopApps = async (limit: number = 3): Promise<{ app_opened: string, unlocks: number }[]> => {
    try {
        const database = await getDb();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await database.getAllAsync<{ app_opened: string, unlocks: number }>(
            `SELECT app_opened, COUNT(*) as unlocks 
             FROM unlocks 
             WHERE timestamp >= datetime(?, 'unixepoch') AND app_opened IS NOT NULL AND skipped = 0
             GROUP BY app_opened 
             ORDER BY unlocks DESC 
             LIMIT ?`,
            [Math.floor(startOfDay.getTime() / 1000), limit]
        );
        return result || [];
    } catch (error) {
        console.error('Error fetching top apps:', error);
        return [];
    }
};

