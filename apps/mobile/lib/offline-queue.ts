import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosInstance } from 'axios';
import { studentEndpoints } from '@sibermas/api-client';

const QUEUE_KEY = 'offline_daily_reports';

export interface QueuedReport {
  id: string;
  payload: Record<string, any>;
  created_at: string;
  retry_count: number;
}

export async function addToQueue(payload: Record<string, any>): Promise<void> {
  const queue = await getQueue();
  const newItem: QueuedReport = {
    id: Math.random().toString(36).substring(2, 11),
    payload,
    created_at: new Date().toISOString(),
    retry_count: 0,
  };
  queue.push(newItem);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedReport[]> {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const newQueue = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
}

export async function processQueue(apiClient: AxiosInstance): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const endpoints = studentEndpoints(apiClient);
  let successCount = 0;

  for (const item of queue) {
    try {
      // FormData cannot be easily serialized to JSON, so we reconstruct it from plain object
      const formData = new FormData();
      Object.keys(item.payload).forEach((key) => {
        formData.append(key, item.payload[key]);
      });

      await endpoints.dailyReports.store(formData);
      await removeFromQueue(item.id);
      successCount++;
    } catch (error) {
      console.warn(`Failed to process queued item ${item.id}:`, error);
      item.retry_count++;
      if (item.retry_count >= 3) {
        await removeFromQueue(item.id);
      } else {
        const currentQueue = await getQueue();
        const updatedQueue = currentQueue.map((q) => (q.id === item.id ? item : q));
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
      }
    }
  }

  return successCount;
}
