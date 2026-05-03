import axios from 'axios';
import { route } from 'ziggy-js';

const DB_NAME = 'kknuinsaizu-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-daily-reports';

export interface PendingDailyReportPayload {
  date: string;
  title: string;
  activity: string;
  reflection: string;
  output: string;
  location_name: string;
  latitude: string;
  longitude: string;
  gps_accuracy: string;
  captured_at: string;
  location_source: 'gps';
  social_media_link?: string;
  files: File[];
}

export interface PendingDailyReportRecord {
  local_id: string;
  created_at: string;
  last_attempted_at: string | null;
  last_error: string | null;
  payload: PendingDailyReportPayload;
}

export interface PendingDailyReportSyncSummary {
  synced: number;
  failed: number;
  remaining: number;
  lastError: string | null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Penyimpanan offline tidak didukung pada perangkat ini.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () =>
      reject(request.error ?? new Error('Database offline tidak dapat dibuka.'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'local_id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);

        Promise.resolve(handler(store))
          .then((result) => {
            transaction.oncomplete = () => {
              database.close();
              resolve(result);
            };
          })
          .catch((error) => {
            database.close();
            reject(error);
          });

        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('Transaksi penyimpanan offline gagal.'));
        };
      }),
  );
}

function requestToPromise<T = void>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Operasi IndexedDB gagal.'));
  });
}

function normalizeSyncError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string; errors?: Record<string, string[] | string> }
      | undefined;

    if (responseData?.errors) {
      const firstError = Object.values(responseData.errors)[0];
      if (Array.isArray(firstError)) {
        return firstError[0] ?? 'Sinkronisasi laporan gagal divalidasi.';
      }

      if (typeof firstError === 'string') {
        return firstError;
      }
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (!error.response) {
      return 'Koneksi internet belum tersedia. Sinkronisasi akan dicoba lagi saat online.';
    }
  }

  return error instanceof Error ? error.message : 'Sinkronisasi laporan offline gagal.';
}

function buildFormData(payload: PendingDailyReportPayload): FormData {
  const formData = new FormData();

  formData.append('date', payload.date);
  formData.append('title', payload.title);
  formData.append('activity', payload.activity);
  formData.append('reflection', payload.reflection);
  formData.append('output', payload.output);
  formData.append('location_name', payload.location_name);
  formData.append('latitude', payload.latitude);
  formData.append('longitude', payload.longitude);
  formData.append('gps_accuracy', payload.gps_accuracy);
  formData.append('captured_at', payload.captured_at);
  formData.append('location_source', payload.location_source);

  payload.files.forEach((file) => {
    formData.append('files[]', file, file.name);
  });

  return formData;
}

export async function queueDailyReport(
  payload: PendingDailyReportPayload,
): Promise<PendingDailyReportRecord> {
  const record: PendingDailyReportRecord = {
    local_id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    created_at: new Date().toISOString(),
    last_attempted_at: null,
    last_error: null,
    payload,
  };

  await withStore('readwrite', (store) => requestToPromise(store.put(record)));

  return record;
}

export async function listPendingDailyReports(): Promise<PendingDailyReportRecord[]> {
  return withStore('readonly', async (store) => {
    const records = await requestToPromise<PendingDailyReportRecord[]>(store.getAll());
    return records.sort((left, right) => right.created_at.localeCompare(left.created_at));
  });
}

export async function removePendingDailyReport(localId: string): Promise<void> {
  await withStore('readwrite', (store) => requestToPromise(store.delete(localId)));
}

export async function syncPendingDailyReports(): Promise<PendingDailyReportSyncSummary> {
  const records = await listPendingDailyReports();

  if (records.length === 0) {
    return {
      synced: 0,
      failed: 0,
      remaining: 0,
      lastError: null,
    };
  }

  let synced = 0;
  let failed = 0;
  let lastError: string | null = null;

  for (const record of records) {
    try {
      await axios.post(route('student.laporan-harian.store'), buildFormData(record.payload), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      await removePendingDailyReport(record.local_id);
      synced += 1;
    } catch (error) {
      failed += 1;
      lastError = normalizeSyncError(error);

      await withStore('readwrite', (store) =>
        requestToPromise(
          store.put({
            ...record,
            last_attempted_at: new Date().toISOString(),
            last_error: lastError,
          } satisfies PendingDailyReportRecord),
        ),
      );

      if (!navigator.onLine || !axios.isAxiosError(error) || !error.response) {
        break;
      }
    }
  }

  const remaining = (await listPendingDailyReports()).length;

  return {
    synced,
    failed,
    remaining,
    lastError,
  };
}
