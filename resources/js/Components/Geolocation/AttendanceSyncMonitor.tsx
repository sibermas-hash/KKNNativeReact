import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface SyncStats {
  total: number;
  successful: number;
  failed: number;
  pending_retry: number;
  needs_manual: number;
}

interface PendingRetry {
  id: number;
  attendance_id: number;
  next_retry_at: string;
  attempt_number: number;
  last_error: string;
}

const AttendanceSyncMonitor: React.FC = () => {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [pendingRetries, setPendingRetries] = useState<PendingRetry[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkSyncStatus();

    // Check every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000);

    // Listen for sync events
    window.addEventListener('attendanceSyncSuccess', handleSyncSuccess);
    window.addEventListener('attendanceSyncFailed', handleSyncFailed);

    return () => {
      clearInterval(interval);
      window.removeEventListener('attendanceSyncSuccess', handleSyncSuccess);
      window.removeEventListener('attendanceSyncFailed', handleSyncFailed);
    };
  }, []);

  async function checkSyncStatus() {
    setLoading(true);

    try {
      const response = await axios.get('/api/attendance/sync-status', {
        headers: {
          Authorization: `Bearer ${(window as any).__token__}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.sync_stats);
        setPendingRetries(response.data.pending_retries);
        setLastChecked(new Date());
      }
    } catch (err) {
      console.error('Failed to check sync status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSync() {
    setSyncing(true);

    try {
      await axios.post(
        '/api/attendance/retry-sync',
        {},
        {
          headers: {
            Authorization: `Bearer ${(window as any).__token__}`,
          },
        },
      );

      // Recheck status after sync
      setTimeout(checkSyncStatus, 1000);
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    } finally {
      setSyncing(false);
    }
  }

  function handleSyncSuccess() {
    checkSyncStatus();
  }

  function handleSyncFailed() {
    checkSyncStatus();
  }

  if (!stats) {
    return null;
  }

  const totalPending = stats.pending_retry + stats.needs_manual;

  if (totalPending === 0) {
    return null; // Don't show if nothing to sync
  }

  return (
    <div className="bg-white rounded-lg shadow border border-blue-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-emerald-950 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          Sinkronisasi Data Offline
        </h3>
        <button
          onClick={checkSyncStatus}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-blue-50 p-2 rounded">
          <p className="text-gray-600">Total Menunggu</p>
          <p className="text-lg font-semibold text-blue-600">
            {stats.pending_retry + stats.needs_manual}
          </p>
        </div>
        <div className="bg-green-50 p-2 rounded">
          <p className="text-gray-600">Berhasil</p>
          <p className="text-lg font-semibold text-green-600">{stats.successful}</p>
        </div>
        <div className="bg-orange-50 p-2 rounded">
          <p className="text-gray-600">Pending Retry</p>
          <p className="text-lg font-semibold text-orange-600">{stats.pending_retry}</p>
        </div>
        <div className="bg-red-50 p-2 rounded">
          <p className="text-gray-600">Perlu Review</p>
          <p className="text-lg font-semibold text-red-600">{stats.needs_manual}</p>
        </div>
      </div>

      {/* Pending Retries List */}
      {pendingRetries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Riwayat Retry:</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {pendingRetries.map((retry) => (
              <div key={retry.id} className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">Attendance #{retry.attendance_id}</p>
                    <p className="text-gray-600">{retry.last_error}</p>
                    <p className="text-gray-500 text-xs mt-1">Attempt #{retry.attempt_number}</p>
                  </div>
                  {retry.next_retry_at && (
                    <div className="text-right whitespace-nowrap">
                      <Clock size={12} className="inline mr-1" />
                      <span className="text-gray-600">
                        {new Date(retry.next_retry_at).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Sync Button */}
      {stats.pending_retry > 0 && (
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sinkronisasi...' : 'Sinkronisasi Sekarang'}
        </button>
      )}

      {stats.needs_manual > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 flex gap-2 text-xs">
          <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
          <p className="text-red-700">
            {stats.needs_manual} record memerlukan intervensi manual. Hubungi DPL untuk bantuan.
          </p>
        </div>
      )}

      {lastChecked && (
        <p className="text-xs text-gray-500 text-center">
          Terakhir diperbarui: {lastChecked.toLocaleTimeString('id-ID')}
        </p>
      )}
    </div>
  );
};

export default AttendanceSyncMonitor;
