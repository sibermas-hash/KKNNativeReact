import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { AlertCircle, MapPin, Camera, RefreshCw, Wifi, WifiOff, Upload } from 'lucide-react';

interface GeolocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp: string;
}

interface AttendanceStatus {
    success: boolean;
    message: string;
    data?: {
        attendance_id: number;
        status: string;
        is_within_geofence: boolean;
        distance_from_posko: number;
        validation_message: string;
        requires_manual_review: boolean;
        fraud_risk_score: number;
    };
}

interface SyncLog {
    id: number;
    attendance_id: number;
    status: 'success' | 'failed' | 'retry_pending' | 'manual_intervention_needed';
    next_retry_at?: string;
    attempt_number: number;
    last_error?: string;
}

const GeolocationCapture: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    // GPS State
    const [geoData, setGeoData] = useState<GeolocationData | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);

    // Photo State
    const [photoData, setPhotoData] = useState<string | null>(null);
    const cameraRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Network State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [submitting, setSubmitting] = useState(false);

    // Sync State
    const [pendingSync, setPendingSync] = useState<SyncLog[]>([]);
    const [syncStatus, setSyncStatus] = useState<string>('idle');

    // Activity Type
    const [activityType, setActivityType] = useState<string>('absen_masuk');

    // UI State
    const [showCamera, setShowCamera] = useState(false);

    // ─── INDEXEDDB HELPERS ───────────────────────────────────────

    const openIndexedDB = useCallback((): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('KknAttendance', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('gps_capture')) {
                    db.createObjectStore('gps_capture', { autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('photo_capture')) {
                    db.createObjectStore('photo_capture', { autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('pending_attendance')) {
                    db.createObjectStore('pending_attendance', { keyPath: 'id' });
                }
            };
        });
    }, []);

    const saveToIndexedDB = useCallback(async (storeName: string, data: any) => {
        try {
            const db = await openIndexedDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.add(data);
        } catch (err) {
            console.warn('IndexedDB save failed:', err);
        }
    }, [openIndexedDB]);

    const removeFromIndexedDB = useCallback(async (storeName: string, key: any) => {
        try {
            const db = await openIndexedDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(key);
        } catch (err) {
            console.warn('IndexedDB remove failed:', err);
        }
    }, [openIndexedDB]);

    // ─── SYNC HANDLERS ───────────────────────────────────────────

    const checkSyncStatus = useCallback(async () => {
        try {
            const response = await axios.get('/api/attendance/sync-status', {
                headers: {
                    'Authorization': `Bearer ${(window as any).__token__}`,
                },
            });

            if (response.data.success) {
                setPendingSync(response.data.pending_retries);
            }
        } catch (err) {
            // Silent fail
        }
    }, []);

    const autoSync = useCallback(async () => {
        if (pendingSync.length === 0) return;

        setSyncStatus('syncing');

        try {
            await axios.post('/api/attendance/retry-sync', {}, {
                headers: {
                    'Authorization': `Bearer ${(window as any).__token__}`,
                },
            });

            setSyncStatus('sync_complete');
            await checkSyncStatus();

            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
            setSyncStatus('sync_failed');
        }
    }, [pendingSync.length, checkSyncStatus]);

    // ─── CAMERA HANDLERS ─────────────────────────────────────────

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });

            if (cameraRef.current) {
                cameraRef.current.srcObject = stream;
            }
        } catch (err) {
            setGeoError('Gagal mengakses kamera: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (cameraRef.current && cameraRef.current.srcObject) {
            const tracks = (cameraRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());
        }
    }, []);

    // ─── UTILITIES ───────────────────────────────────────────────

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        setSyncStatus('online_detected');
        setTimeout(() => autoSync(), 1000);
    }, [autoSync]);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setSyncStatus('offline');
    }, []);

    // ─── LIFECYCLE ───────────────────────────────────────────────

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    useEffect(() => {
        if (showCamera) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [showCamera, startCamera, stopCamera]);

    useEffect(() => {
        checkSyncStatus();
        const interval = setInterval(checkSyncStatus, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [checkSyncStatus]);

    // ─── GPS CAPTURE ─────────────────────────────────────────────

    const captureGPS = async () => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation tidak didukung di browser ini');
            return;
        }

        setGeoLoading(true);
        setGeoError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
                const timestamp = new Date().toISOString();

                setGeoData({
                    latitude,
                    longitude,
                    accuracy,
                    altitude: altitude || undefined,
                    heading: heading || undefined,
                    speed: speed || undefined,
                    timestamp,
                });

                setAccuracy(accuracy);
                setGeoLoading(false);

                // Store in IndexedDB for offline reference
                saveToIndexedDB('gps_capture', {
                    ...position.coords,
                    timestamp,
                });
            },
            (error) => {
                let errorMsg = 'Gagal mengambil lokasi';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Izin GPS ditolak. Aktifkan lokasi di pengaturan browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Lokasi tidak tersedia. Cek koneksi GPS.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'GPS timeout. Coba lagi.';
                        break;
                }

                setGeoError(errorMsg);
                setGeoLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // ─── CAMERA CAPTURE ─────────────────────────────────────────

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });

            if (cameraRef.current) {
                cameraRef.current.srcObject = stream;
            }
        } catch (err) {
            setGeoError('Gagal mengakses kamera: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const stopCamera = () => {
        if (cameraRef.current && cameraRef.current.srcObject) {
            const tracks = (cameraRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());
        }
    };

    const capturePhoto = () => {
        if (cameraRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = cameraRef.current.videoWidth;
                canvasRef.current.height = cameraRef.current.videoHeight;
                context.drawImage(cameraRef.current, 0, 0);

                // Add watermark
                addWatermark(context);

                const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
                setPhotoData(imageData);

                // Save to IndexedDB
                saveToIndexedDB('photo_capture', {
                    data: imageData,
                    timestamp: new Date().toISOString(),
                });

                setShowCamera(false);
            }
        }
    };

    const uploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target?.result as string;
                setPhotoData(imageData);

                saveToIndexedDB('photo_capture', {
                    data: imageData,
                    timestamp: new Date().toISOString(),
                    source: 'upload',
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const addWatermark = (context: CanvasRenderingContext2D) => {
        const user = (window as any).__user__?.name || 'User';
        const time = new Date().toLocaleString('id-ID');

        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.font = 'bold 16px Arial';
        context.fillText(`${user} - ${time}`, 10, 30);

        // Add GPS coordinates
        if (geoData) {
            context.fillText(
                `${geoData.latitude.toFixed(6)}, ${geoData.longitude.toFixed(6)}`,
                10,
                55
            );
        }
    };

    // ─── SUBMISSION ──────────────────────────────────────────────

    const submitAttendance = async () => {
        if (!geoData) {
            setGeoError('Silakan ambil lokasi terlebih dahulu');
            return;
        }

        setSubmitting(true);
        setGeoError(null);

        try {
            const payload = {
                latitude: geoData.latitude,
                longitude: geoData.longitude,
                accuracy_meters: geoData.accuracy,
                altitude_meters: geoData.altitude,
                heading_degrees: geoData.heading,
                speed_mps: geoData.speed,
                timestamp_client: geoData.timestamp,
                timestamp_gps: geoData.timestamp,
                activity_type: activityType,
                proof_photo_base64: photoData,
                device_signature: getDeviceSignature(),
                user_agent: navigator.userAgent,
            };

            // Save to IndexedDB before sending (for offline sync)
            await saveToIndexedDB('pending_attendance', {
                ...payload,
                created_at: new Date().toISOString(),
                id: `offline_${Date.now()}`,
            });

            if (isOnline) {
                // Submit immediately if online
                const response = await axios.post<AttendanceStatus>('/api/attendance', payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(window as any).__token__}`,
                    },
                });

                if (response.data.success) {
                    setGeoError(null);
                    setSubmitting(false);

                    // Mark as synced in IndexedDB
                    await removeFromIndexedDB('pending_attendance', `offline_${Date.now()}`);

                    onSuccess?.();

                    // Show success message
                    alert(response.data.message);
                } else {
                    throw new Error(response.data.message);
                }
            } else {
                // Offline - mark as pending sync
                setGeoError(null);
                setSubmitting(false);
                setSyncStatus('offline_saved');
                setTimeout(() => setSyncStatus('idle'), 3000);

                alert(
                    '📱 Data tersimpan secara lokal. Akan otomatis sinkronisasi saat koneksi kembali.'
                );
            }

            // Reset form
            setTimeout(() => {
                setGeoData(null);
                setPhotoData(null);
                setShowDetails(false);
            }, 1000);
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : 'Gagal mengirim absensi. Data disimpan untuk retry nanti.';
            setGeoError(errorMsg);
            setSubmitting(false);
        }
    };

    // ─── SYNC HANDLERS ───────────────────────────────────────────

    const checkSyncStatus = async () => {
        try {
            const response = await axios.get('/api/attendance/sync-status', {
                headers: {
                    'Authorization': `Bearer ${(window as any).__token__}`,
                },
            });

            if (response.data.success) {
                setPendingSync(response.data.pending_retries);
            }
        } catch (err) {
            // Silent fail
        }
    };

    const autoSync = async () => {
        if (pendingSync.length === 0) return;

        setSyncStatus('syncing');

        try {
            await axios.post('/api/attendance/retry-sync', {}, {
                headers: {
                    'Authorization': `Bearer ${(window as any).__token__}`,
                },
            });

            setSyncStatus('sync_complete');
            await checkSyncStatus();

            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
            setSyncStatus('sync_failed');
        }
    };

    const manualSync = () => {
        autoSync();
    };

    // ─── INDEXEDDB HELPERS ───────────────────────────────────────

    const saveToIndexedDB = async (storeName: string, data: any) => {
        try {
            const db = await openIndexedDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.add(data);
        } catch (err) {
            console.warn('IndexedDB save failed:', err);
        }
    };

    const removeFromIndexedDB = async (storeName: string, key: any) => {
        try {
            const db = await openIndexedDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(key);
        } catch (err) {
            console.warn('IndexedDB remove failed:', err);
        }
    };

    const openIndexedDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('KknAttendance', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('gps_capture')) {
                    db.createObjectStore('gps_capture', { autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('photo_capture')) {
                    db.createObjectStore('photo_capture', { autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('pending_attendance')) {
                    db.createObjectStore('pending_attendance', { keyPath: 'id' });
                }
            };
        });
    };

    // ─── UTILITIES ───────────────────────────────────────────────

    const getDeviceSignature = (): string => {
        // Simple device fingerprint
        const ua = navigator.userAgent;
        const screen = `${window.screen.width}x${window.screen.height}`;
        const tz = new Date().getTimezoneOffset();

        return btoa(`${ua}|${screen}|${tz}`).substring(0, 32);
    };

    const getAccuracyStatus = (accuracy: number | null): string => {
        if (!accuracy) return 'Tidak tersedia';
        if (accuracy < 10) return '🟢 Sangat Akurat';
        if (accuracy < 50) return '🟡 Baik';
        if (accuracy < 100) return '🟠 Cukup';
        return '🔴 Buruk';
    };

    // ─── RENDER ──────────────────────────────────────────────────

    return (
        <div className="space-y-4 bg-white rounded-lg p-6 shadow">
            {/* Header dengan status online/offline */}
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-semibold text-emerald-950">Absensi Kehadiran</h3>
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                            <Wifi size={16} />
                            <span className="text-sm">Online</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                            <WifiOff size={16} />
                            <span className="text-sm">Offline</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Type Selection */}
            <div>
                <label className="block text-sm font-medium text-emerald-950 mb-2">
                    Jenis Aktivitas
                </label>
                <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="absen_masuk">📍 Absen Masuk</option>
                    <option value="absen_keluar">🚪 Absen Keluar</option>
                    <option value="logbook_activity">📔 Aktivitas Logbook</option>
                    <option value="workshop_attendance">🎓 Workshop</option>
                    <option value="meeting_attendance">👥 Pertemuan</option>
                </select>
            </div>

            {/* GPS Section */}
            <div className="border border-emerald-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-emerald-600" size={20} />
                        <h4 className="font-medium text-emerald-950">Lokasi GPS</h4>
                    </div>
                    {geoData && (
                        <span className={`text-xs px-2 py-1 rounded ${getAccuracyStatus(accuracy)}`}>
                            {getAccuracyStatus(accuracy)}
                        </span>
                    )}
                </div>

                {geoData ? (
                    <div className="bg-emerald-50 p-3 rounded space-y-2 text-sm">
                        <p className="text-emerald-950">
                            <strong>Latitude:</strong> {geoData.latitude.toFixed(6)}
                        </p>
                        <p className="text-emerald-950">
                            <strong>Longitude:</strong> {geoData.longitude.toFixed(6)}
                        </p>
                        <p className="text-emerald-950">
                            <strong>Akurasi:</strong> ±{geoData.accuracy.toFixed(1)}m
                        </p>
                        {geoData.altitude && (
                            <p className="text-emerald-950">
                                <strong>Ketinggian:</strong> {geoData.altitude.toFixed(1)}m
                            </p>
                        )}
                        {geoData.speed !== undefined && (
                            <p className="text-emerald-950">
                                <strong>Kecepatan:</strong> {(geoData.speed * 3.6).toFixed(1)} km/h
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-emerald-600 text-sm">Belum ada data lokasi</p>
                )}

                <button
                    onClick={captureGPS}
                    disabled={geoLoading}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                    {geoLoading ? '⏳ Mengambil lokasi...' : '📍 Ambil Lokasi Saat Ini'}
                </button>
            </div>

            {/* Photo Section */}
            <div className="border border-emerald-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Camera className="text-emerald-600" size={20} />
                    <h4 className="font-medium text-emerald-950">Foto Bukti</h4>
                </div>

                {photoData ? (
                    <div className="space-y-2">
                        <img src={photoData} alt="Proof" className="w-full h-64 object-cover rounded-lg" />
                        <button
                            onClick={() => setPhotoData(null)}
                            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                        >
                            Ambil Foto Ulang
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowCamera(!showCamera)}
                            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                        >
                            {showCamera ? '✖️ Tutup Kamera' : '📷 Buka Kamera'}
                        </button>

                        {showCamera && (
                            <div className="space-y-2">
                                <video ref={cameraRef} autoPlay playsInline className="w-full rounded-lg">
                                    <track kind="captions" />
                                </video>
                                <button
                                    onClick={capturePhoto}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                                >
                                    📸 Ambil Foto
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                        >
                            📁 Upload dari File
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={uploadPhoto}
                            className="hidden"
                        />
                    </div>
                )}
            </div>

            {/* Error Display */}
            {geoError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <p className="text-red-700 text-sm">{geoError}</p>
                </div>
            )}

            {/* Sync Status */}
            {pendingSync.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <p className="text-blue-700 text-sm font-medium">
                        📊 {pendingSync.length} data menunggu sinkronisasi
                    </p>
                    <button
                        onClick={manualSync}
                        disabled={syncStatus === 'syncing'}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                        {syncStatus === 'syncing' ? 'Sinkronisasi...' : 'Sinkronisasi Sekarang'}
                    </button>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={submitAttendance}
                disabled={!geoData || submitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
                <Upload size={18} />
                {submitting ? 'Mengirim...' : 'Kirim Absensi'}
            </button>

            {/* Canvas for photo processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default GeolocationCapture;
