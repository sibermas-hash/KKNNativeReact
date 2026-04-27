/**
 * IndexedDB Service untuk Offline Storage
 * Mengelola penyimpanan offline data attendance
 */

interface StorageSchema {
  gps_capture: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  photo_capture: {
    data: string;
    timestamp: string;
    source?: string;
  };
  pending_attendance: {
    id: string;
    latitude: number;
    longitude: number;
    activity_type: string;
    proof_photo_base64?: string;
    [key: string]: any;
  };
}

const DB_NAME = 'KknAttendance';
const DB_VERSION = 1;

class IndexedDBService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // GPS Capture Store
        if (!db.objectStoreNames.contains('gps_capture')) {
          const gpsStore = db.createObjectStore('gps_capture', { autoIncrement: true });
          gpsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Photo Capture Store
        if (!db.objectStoreNames.contains('photo_capture')) {
          const photoStore = db.createObjectStore('photo_capture', { autoIncrement: true });
          photoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Pending Attendance Store (for offline sync)
        if (!db.objectStoreNames.contains('pending_attendance')) {
          const attendanceStore = db.createObjectStore('pending_attendance', { keyPath: 'id' });
          attendanceStore.createIndex('status', 'status', { unique: false });
          attendanceStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Sync Logs
        if (!db.objectStoreNames.contains('sync_logs')) {
          const syncStore = db.createObjectStore('sync_logs', { autoIncrement: true });
          syncStore.createIndex('attendance_id', 'attendance_id', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Save data to store
   */
  async save<T extends keyof StorageSchema>(
    storeName: T,
    data: StorageSchema[T],
  ): Promise<IDBValidKey> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from store
   */
  async getAll<T extends keyof StorageSchema>(storeName: T): Promise<StorageSchema[T][]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get record by key
   */
  async get<T extends keyof StorageSchema>(
    storeName: T,
    key: any,
  ): Promise<StorageSchema[T] | undefined> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query by index
   */
  async queryByIndex<T extends keyof StorageSchema>(
    storeName: T,
    indexName: string,
    value: any,
  ): Promise<StorageSchema[T][]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update record
   */
  async update<T extends keyof StorageSchema>(storeName: T, data: StorageSchema[T]): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete record
   */
  async delete<T extends keyof StorageSchema>(storeName: T, key: any): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear entire store
   */
  async clear<T extends keyof StorageSchema>(storeName: T): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage size estimate
   */
  async getStorageInfo(): Promise<{ usage: number; quota: number }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, quota: 0 };
    }

    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
}

export const indexedDBService = new IndexedDBService();
export default IndexedDBService;
