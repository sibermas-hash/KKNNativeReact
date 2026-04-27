import { Preferences } from '@capacitor/preferences';

const QUEUE_KEY = 'offline_actions_queue';

export interface OfflineAction {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: any;
    timestamp: number;
}

export class OfflineQueueService {
    static async enqueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
        const currentQueue = await this.getQueue();
        
        const newAction: OfflineAction = {
            ...action,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        
        currentQueue.push(newAction);
        await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(currentQueue) });
    }

    static async getQueue(): Promise<OfflineAction[]> {
        const { value } = await Preferences.get({ key: QUEUE_KEY });
        return value ? JSON.parse(value) : [];
    }

    static async dequeue(id: string): Promise<void> {
        const currentQueue = await this.getQueue();
        const newQueue = currentQueue.filter(action => action.id !== id);
        await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(newQueue) });
    }

    static async clear(): Promise<void> {
        await Preferences.remove({ key: QUEUE_KEY });
    }
}
