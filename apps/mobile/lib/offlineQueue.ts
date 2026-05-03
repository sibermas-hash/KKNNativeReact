import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline:daily-reports';

export type QueuedReport = {
  id?: string;
  title: string;
  activity: string;
  reflection?: string;
  date: string;
  captured_at: string;
  latitude?: string;
  longitude?: string;
};

export async function enqueueReport(item: QueuedReport): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const list: QueuedReport[] = raw ? JSON.parse(raw) : [];
  list.push({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list));
}

export async function getQueue(): Promise<QueuedReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

// Process queue items using an API client that exposes dailyReports.store(formData)
export async function processQueue(api: any): Promise<{ succeeded: number; failed: number }> {
  const queue = await getQueue();
  let succeeded = 0;
  const failures: QueuedReport[] = [];

  for (const item of queue) {
    try {
      const formData = new FormData();
      formData.append('title', item.title);
      formData.append('activity', item.activity);
      formData.append('reflection', item.reflection || '');
      formData.append('date', item.date);
      formData.append('captured_at', item.captured_at);
      if (item.latitude) formData.append('latitude', item.latitude);
      if (item.longitude) formData.append('longitude', item.longitude);

      // use api.studentEndpoints.dailyReports.store if available, fallback to direct post
      if (api?.studentEndpoints?.dailyReports?.store) {
        await api.studentEndpoints.dailyReports.store(formData);
      } else if (api?.post) {
        await api.post('/student/daily-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        throw new Error('No API client provided to processQueue');
      }

      succeeded++;
    } catch (err) {
      failures.push(item);
    }
  }

  if (failures.length === 0) {
    await clearQueue();
  } else {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failures));
  }

  return { succeeded, failed: failures.length };
}
