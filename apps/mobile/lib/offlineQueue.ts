import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline:daily-reports';
let activeQueueRun: Promise<{ succeeded: number; failed: number }> | null = null;

export type QueuedReport = {
  id?: string;
  title: string;
  activity: string;
  reflection?: string;
  date: string;
  captured_at: string;
  latitude?: number;
  longitude?: number;
};

function buildQueuedReportFormData(item: QueuedReport): FormData {
  const formData = new FormData();
  formData.append('title', item.title);
  formData.append('activity', item.activity);
  formData.append('reflection', item.reflection || '');
  formData.append('date', item.date);
  formData.append('captured_at', item.captured_at);
  formData.append('location_source', 'gps');
  formData.append('category', 'administrasi');
  formData.append('abcd_stage', 'reflection');
  if (item.latitude != null) formData.append('latitude', String(item.latitude));
  if (item.longitude != null) formData.append('longitude', String(item.longitude));
  if (item.latitude != null && item.longitude != null) {
    formData.append('location_name', `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`);
  }
  return formData;
}

async function readQueue(): Promise<QueuedReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as QueuedReport[] : [];
  } catch {
    await AsyncStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

async function writeQueue(items: QueuedReport[]): Promise<void> {
  if (items.length === 0) {
    await AsyncStorage.removeItem(QUEUE_KEY);
    return;
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueReport(item: QueuedReport): Promise<void> {
  const list = await readQueue();
  list.push({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  await writeQueue(list);
}

export async function getQueue(): Promise<QueuedReport[]> {
  return readQueue();
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

// R13-MOBILE-005: minimal structural type for the API client used here so
// the queue doesn't depend on `any`. We only need `post`; the wider web
// client in `@sibermas/api-client` satisfies this shape.
export interface OfflineQueueApi {
  post: (
    path: string,
    body: unknown,
    config?: { headers?: Record<string, string> },
  ) => Promise<unknown>;
}

// Process queue items using an API client that exposes a post() method.
export async function processQueue(api: OfflineQueueApi): Promise<{ succeeded: number; failed: number }> {
  if (activeQueueRun) return activeQueueRun;

  activeQueueRun = processQueueItems(api).finally(() => {
    activeQueueRun = null;
  });

  return activeQueueRun;
}

async function processQueueItems(api: OfflineQueueApi): Promise<{ succeeded: number; failed: number }> {
  const queue = await getQueue();
  const processedIds = new Set(queue.map((item) => item.id).filter(Boolean) as string[]);
  const canMergeWithLatestQueue = processedIds.size === queue.length;
  let succeeded = 0;
  const failures: QueuedReport[] = [];

  for (const item of queue) {
    try {
      const formData = buildQueuedReportFormData(item);

      // api.post is required — shape is checked by OfflineQueueApi.
      await api.post('/student/daily-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      succeeded++;
    } catch (err) {
      failures.push(item);
    }
  }

  if (canMergeWithLatestQueue) {
    const latestQueue = await getQueue();
    const newlyQueuedItems = latestQueue.filter((item) => !item.id || !processedIds.has(item.id));
    await writeQueue([...failures, ...newlyQueuedItems]);
    return { succeeded, failed: failures.length };
  }

  if (failures.length === 0) {
    await clearQueue();
  } else {
    await writeQueue(failures);
  }

  return { succeeded, failed: failures.length };
}
