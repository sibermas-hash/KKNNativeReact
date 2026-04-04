import { getCurrentPosition } from '@/lib/capacitor';

export interface BrowserCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    capturedAt: string;
}

function mapGeolocationError(error: unknown): string {
    if (error instanceof GeolocationPositionError) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Izin lokasi ditolak. Aktifkan akses lokasi pada browser atau perangkat Anda.';
            case error.POSITION_UNAVAILABLE:
                return 'Lokasi saat ini tidak dapat ditentukan. Coba lagi beberapa saat.';
            case error.TIMEOUT:
                return 'Pengambilan lokasi melebihi batas waktu. Coba lagi.';
            default:
                return 'Terjadi kendala saat mengambil lokasi GPS.';
        }
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (message.includes('permission')) {
        return 'Izin lokasi ditolak. Aktifkan akses lokasi pada browser atau perangkat Anda.';
    }

    if (message.includes('timeout')) {
        return 'Pengambilan lokasi melebihi batas waktu. Coba lagi.';
    }

    if (message.includes('support')) {
        return 'Perangkat ini tidak mendukung pengambilan lokasi GPS.';
    }

    return 'Terjadi kendala saat mengambil lokasi GPS.';
}

export async function getCurrentCoordinates(options?: PositionOptions): Promise<BrowserCoordinates> {
    try {
        const position = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options,
        });

        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? null,
            capturedAt: new Date().toISOString(),
        };
    } catch (error) {
        throw new Error(mapGeolocationError(error));
    }
}
