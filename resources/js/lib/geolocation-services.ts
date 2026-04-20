const DB_NAME = 'kkn_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_attendance';

interface PendingRecord {
    id?: number;
    uuid: string;
    kelompok_id: number;
    activity_title: string;
    activity_description: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    client_timestamp: number;
    captured_at: string;
    photo_base64?: string;
    sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
    created_at: number;
    local_timezone: string;
    server_timestamp?: number;
    server_id?: number;
    error_message?: string;
}

class OfflineStorageService {
    private db: IDBDatabase | null = null;

    async openDB(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('uuid', 'uuid', { unique: true });
                    store.createIndex('sync_status', 'sync_status', { unique: false });
                    store.createIndex('created_at', 'created_at', { unique: false });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async saveActivity(record: Omit<PendingRecord, 'id' | 'created_at' | 'sync_status'>): Promise<number> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const recordToSave: PendingRecord = {
            ...record,
            sync_status: 'pending',
            created_at: Date.now(),
            local_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        return new Promise((resolve, reject) => {
            const req = store.add(recordToSave);
            req.onsuccess = () => resolve(req.result as number);
            req.onerror = () => reject(req.error);
        });
    }

    async getPendingRecords(): Promise<PendingRecord[]> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('sync_status');

        return new Promise((resolve, reject) => {
            const req = index.getAll('pending');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async markAsSynced(localId: number, serverResponse: { id: number; server_timestamp: number }): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const getReq = store.get(localId);
            getReq.onsuccess = () => {
                const record = getReq.result as PendingRecord;
                record.sync_status = 'synced';
                record.server_timestamp = serverResponse.server_timestamp;
                record.server_id = serverResponse.id;
                const putReq = store.put(record);
                putReq.onsuccess = () => resolve();
                putReq.onerror = () => reject(putReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async markAsFailed(localId: number, errorMessage: string): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const getReq = store.get(localId);
            getReq.onsuccess = () => {
                const record = getReq.result as PendingRecord;
                record.sync_status = 'failed';
                record.error_message = errorMessage;
                const putReq = store.put(record);
                putReq.onsuccess = () => resolve();
                putReq.onerror = () => reject(putReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async getPendingCount(): Promise<number> {
        const pending = await this.getPendingRecords();
        return pending.length;
    }

    async clearSynced(): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('sync_status');

        return new Promise((resolve, reject) => {
            const req = index.openCursor('synced');
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            req.onerror = () => reject(req.error);
        });
    }
}

class TrustedTimestampService {
    private serverTimeOffset = 0;
    private lastSyncTime = 0;

    async syncWithServer(): Promise<boolean> {
        try {
            const t1 = performance.now();
            const response = await fetch('/api/server-time');
            const t2 = performance.now();
            const data = await response.json();

            const latency = (t2 - t1) / 2;
            const estimatedServerTime = data.server_unix_ms + latency;

            this.serverTimeOffset = estimatedServerTime - Date.now();
            this.lastSyncTime = Date.now();

            sessionStorage.setItem('ts_offset', String(this.serverTimeOffset));
            sessionStorage.setItem('ts_synced_at', String(this.lastSyncTime));

            return true;
        } catch {
            return false;
        }
    }

    getTrustedTimestamp(): {
        trusted_unix_ms: number;
        local_unix_ms: number;
        is_server_synced: boolean;
        ms_since_last_sync: number;
        trust_level: 'high' | 'medium' | 'low';
    } {
        let offset = 0;
        let syncedAt = 0;

        const storedOffset = sessionStorage.getItem('ts_offset');
        const storedSyncedAt = sessionStorage.getItem('ts_synced_at');

        if (storedOffset) offset = parseFloat(storedOffset);
        if (storedSyncedAt) syncedAt = parseFloat(storedSyncedAt);

        const localNow = Date.now();
        const msSinceSync = localNow - syncedAt;

        return {
            trusted_unix_ms: localNow + offset,
            local_unix_ms: localNow,
            is_server_synced: syncedAt > 0,
            ms_since_last_sync: msSinceSync,
            trust_level: msSinceSync < 1800000 ? 'high' : msSinceSync < 3600000 ? 'medium' : 'low',
        };
    }

    getClientTimestamp(): number {
        return this.getTrustedTimestamp().trusted_unix_ms;
    }
}

export const offlineStorage = new OfflineStorageService();
export const timestampService = new TrustedTimestampService();
export type { PendingRecord };