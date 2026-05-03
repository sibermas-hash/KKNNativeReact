import { Capacitor } from '@capacitor/core';

type NativeCameraDirection = 'front' | 'rear';

interface CapturePhotoFileOptions {
  direction?: NativeCameraDirection;
  fileNamePrefix?: string;
  quality?: number;
}

function isCancelledError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return message.includes('cancel') || message.includes('canceled');
}

function mapCameraError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('permission') || message.includes('denied')) {
    return 'Izin kamera ditolak. Aktifkan akses kamera pada perangkat Anda.';
  }

  if (message.includes('unavailable') || message.includes('not available')) {
    return 'Kamera perangkat tidak tersedia saat ini.';
  }

  return 'Gagal membuka kamera perangkat.';
}

function resolveFileExtension(format?: string | null, mimeType?: string): string {
  if (format) {
    return format.toLowerCase();
  }

  if (mimeType?.includes('/')) {
    return mimeType.split('/')[1] ?? 'jpeg';
  }

  return 'jpeg';
}

export function isNativeCameraAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function capturePhotoFile(
  options: CapturePhotoFileOptions = {},
): Promise<File | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const {
    Camera,
    CameraDirection,
    CameraResultType,
    CameraSource,
  } = await import('@capacitor/camera');

  try {
    const photo = await Camera.getPhoto({
      quality: options.quality ?? 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      direction:
        options.direction === 'front' ? CameraDirection.Front : CameraDirection.Rear,
      saveToGallery: false,
    });

    if (!photo.webPath) {
      throw new Error('Native camera returned no webPath.');
    }

    const response = await fetch(photo.webPath);
    if (!response.ok) {
      throw new Error('Captured photo could not be read.');
    }

    const blob = await response.blob();
    const extension = resolveFileExtension(photo.format, blob.type);
    const fileNamePrefix = options.fileNamePrefix ?? 'photo';

    return new File([blob], `${fileNamePrefix}-${Date.now()}.${extension}`, {
      type: blob.type || `image/${extension}`,
    });
  } catch (error) {
    if (isCancelledError(error)) {
      return null;
    }

    throw new Error(mapCameraError(error));
  }
}
