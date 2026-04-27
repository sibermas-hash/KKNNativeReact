import { beforeEach, describe, expect, it, vi } from 'vitest';
import { capturePhotoFile, isNativeCameraAvailable } from '@/lib/native-camera';

const capacitorMocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  getPhoto: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: capacitorMocks.isNativePlatform,
  },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: capacitorMocks.getPhoto,
  },
  CameraDirection: {
    Front: 'front',
    Rear: 'rear',
  },
  CameraResultType: {
    Uri: 'uri',
  },
  CameraSource: {
    Camera: 'camera',
  },
}));

describe('native-camera helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capacitorMocks.isNativePlatform.mockReturnValue(true);
    global.fetch = vi.fn();
  });

  it('reports native camera availability from Capacitor', () => {
    capacitorMocks.isNativePlatform.mockReturnValue(false);

    expect(isNativeCameraAvailable()).toBe(false);
  });

  it('returns null when running on web', async () => {
    capacitorMocks.isNativePlatform.mockReturnValue(false);

    await expect(capturePhotoFile()).resolves.toBeNull();
    expect(capacitorMocks.getPhoto).not.toHaveBeenCalled();
  });

  it('converts native photo output into a File object', async () => {
    const blob = new Blob(['avatar'], { type: 'image/jpeg' });
    capacitorMocks.getPhoto.mockResolvedValue({
      webPath: 'https://device.local/avatar.jpg',
      format: 'jpeg',
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => blob,
    } as Response);

    const result = await capturePhotoFile({
      direction: 'front',
      fileNamePrefix: 'avatar',
    });

    expect(result).toBeInstanceOf(File);
    expect(result?.name).toMatch(/^avatar-\d+\.jpeg$/);
    expect(result?.type).toBe('image/jpeg');
    expect(capacitorMocks.getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'camera',
        direction: 'front',
        resultType: 'uri',
      }),
    );
  });

  it('returns null when user cancels native camera capture', async () => {
    capacitorMocks.getPhoto.mockRejectedValue(new Error('User cancelled camera flow'));

    await expect(capturePhotoFile()).resolves.toBeNull();
  });

  it('maps permission failures into a friendly message', async () => {
    capacitorMocks.getPhoto.mockRejectedValue(new Error('Permission denied'));

    await expect(capturePhotoFile()).rejects.toThrow(
      'Izin kamera ditolak. Aktifkan akses kamera pada perangkat Anda.',
    );
  });
});
