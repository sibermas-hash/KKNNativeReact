/**
 * Attendance Sync Service
 * Mengelola sinkronisasi offline attendance data ke backend
 */

import axios from 'axios';
import { indexedDBService } from './IndexedDBService';

interface PendingAttendance {
  id: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  altitude_meters?: number;
  heading_degrees?: number;
  speed_mps?: number;
  timestamp_client: string;
  timestamp_gps?: string;
  activity_type: string;
  proof_photo_base64?: string;
  device_signature?: string;
  user_agent?: string;
  created_at: string;
  status?: 'pending' | 'synced' | 'failed';
}

interface SyncResult {
  success: boolean;
  attendance_id?: number;
  message: string;
  error?: string;
}

export class AttendanceSyncService {
  private maxRetries = 5;
  private retryDelay = 1000; // 1 second initial delay

  constructor(private apiToken: string) {}

  /**
   * Initialize sync listeners
   */
  initializeListeners(): void {
    // Listen for online event
    window.addEventListener('online', () => this.handleOnline());

    // Listen for manual sync trigger
    window.addEventListener('kknAttendanceManualSync', () => this.syncPendingData());

    // Auto-sync every 5 minutes if online
    setInterval(
      () => {
        if (navigator.onLine) {
          this.syncPendingData();
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Handle online event
   */
  private async handleOnline(): Promise<void> {
    console.log('[Attendance Sync] Internet connection restored, syncing pending data...');
    await this.syncPendingData();
  }

  /**
   * Sync all pending attendance records
   */
  async syncPendingData(): Promise<{ success: number; failed: number }> {
    const pending = await indexedDBService.getAll('pending_attendance');

    if (pending.length === 0) {
      return { success: 0, failed: 0 };
    }

    console.log(`[Attendance Sync] Found ${pending.length} pending records to sync`);

    let successCount = 0;
    let failedCount = 0;

    // Process each pending record
    for (const record of pending) {
      if (record.status === 'synced') {
        continue; // Skip already synced
      }

      const result = await this.syncAttendance(record);

      if (result.success) {
        // Mark as synced in IndexedDB
        await indexedDBService.update('pending_attendance', {
          ...record,
          status: 'synced',
        });

        console.log(`[Attendance Sync] Successfully synced record ${record.id}`);
        successCount++;

        // Emit event for UI update
        window.dispatchEvent(
          new CustomEvent('attendanceSyncSuccess', {
            detail: { attendance_id: result.attendance_id },
          }),
        );
      } else {
        // Mark as failed with retry info
        await indexedDBService.update('pending_attendance', {
          ...record,
          status: 'failed',
          retry_count: (record as any).retry_count ? (record as any).retry_count + 1 : 1,
          last_sync_error: result.error,
        });

        console.warn(`[Attendance Sync] Failed to sync record ${record.id}: ${result.error}`);
        failedCount++;

        // Emit event for UI update
        window.dispatchEvent(
          new CustomEvent('attendanceSyncFailed', {
            detail: { record_id: record.id, error: result.error },
          }),
        );
      }
    }

    console.log(`[Attendance Sync] Sync complete: ${successCount} success, ${failedCount} failed`);

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync single attendance record with retry logic
   */
  private async syncAttendance(record: PendingAttendance, retryCount = 0): Promise<SyncResult> {
    try {
      // If offline, don't try to sync
      if (!navigator.onLine) {
        return {
          success: false,
          message: 'Offline',
          error: 'No internet connection',
        };
      }

      const response = await axios.post('/api/attendance', record, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.data.success) {
        return {
          success: true,
          attendance_id: response.data.data.attendance_id,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.message || 'Unknown error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic for network errors (not validation errors)
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('timeout') ||
          error.message.includes('Network') ||
          error.message.includes('ERR_NETWORK'));

      if (isRetryable && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`[Attendance Sync] Retrying record ${record.id} in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.syncAttendance(record, retryCount + 1);
      }

      return {
        success: false,
        message: 'Sync failed',
        error: errorMsg,
      };
    }
  }

  /**
   * Get pending records count
   */
  async getPendingCount(): Promise<number> {
    const pending = await indexedDBService.getAll('pending_attendance');
    return pending.filter((r) => r.status !== 'synced').length;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    total: number;
    synced: number;
    failed: number;
    pending: number;
  }> {
    const records = await indexedDBService.getAll('pending_attendance');

    return {
      total: records.length,
      synced: records.filter((r) => r.status === 'synced').length,
      failed: records.filter((r) => r.status === 'failed').length,
      pending: records.filter((r) => !r.status || r.status === 'pending').length,
    };
  }

  /**
   * Clear all synced records
   */
  async clearSyncedRecords(): Promise<void> {
    const records = await indexedDBService.getAll('pending_attendance');

    for (const record of records) {
      if (record.status === 'synced') {
        await indexedDBService.delete('pending_attendance', record.id);
      }
    }

    console.log('[Attendance Sync] Cleared synced records');
  }

  /**
   * Retry failed records
   */
  async retryFailedRecords(): Promise<void> {
    const records = await indexedDBService.getAll('pending_attendance');
    const failed = records.filter((r) => r.status === 'failed');

    for (const record of failed) {
      // Reset status to retry
      await indexedDBService.update('pending_attendance', {
        ...record,
        status: 'pending',
        retry_count: 0,
      });
    }

    // Trigger sync
    await this.syncPendingData();
  }
}

// Export singleton instance factory
export function createAttendanceSyncService(apiToken: string): AttendanceSyncService {
  return new AttendanceSyncService(apiToken);
}

export default AttendanceSyncService;
