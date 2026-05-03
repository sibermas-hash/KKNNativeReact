import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeolocationCapture from '@/Components/Geolocation/GeolocationCapture';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import axios from 'axios';

// Mock window.navigator
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock axios
vi.mock('axios');

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('GeolocationCapture Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock token
    (window as any).__token__ = 'test_token';
  });

  /**
   * Test: Component renders correctly
   */
  test('renders geolocation capture form', () => {
    render(<GeolocationCapture />);

    expect(screen.getByText('Absensi Kehadiran')).toBeInTheDocument();
    expect(screen.getByText('Jenis Aktivitas')).toBeInTheDocument();
    expect(screen.getByText('📍 Ambil Lokasi Saat Ini')).toBeInTheDocument();
  });

  /**
   * Test: GPS capture button triggers geolocation
   */
  test('GPS capture button calls navigator.geolocation', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -7.2575,
          longitude: 110.4268,
          accuracy: 25,
          altitude: 100,
          heading: 45,
          speed: 0,
        },
        timestamp: Date.now(),
      });
    });

    render(<GeolocationCapture />);

    const gpsButton = screen.getByText('📍 Ambil Lokasi Saat Ini');
    fireEvent.click(gpsButton);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  /**
   * Test: GPS coordinates display after capture
   */
  test('displays GPS coordinates after capture', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -7.2575,
          longitude: 110.4268,
          accuracy: 25,
        },
        timestamp: Date.now(),
      });
    });

    render(<GeolocationCapture />);

    fireEvent.click(screen.getByText('📍 Ambil Lokasi Saat Ini'));

    await waitFor(() => {
      expect(screen.getByText(/Latitude:/)).toBeInTheDocument();
      expect(screen.getByText(/-7.257500/)).toBeInTheDocument();
      expect(screen.getByText(/110.426800/)).toBeInTheDocument();
    });
  });

  /**
   * Test: Accuracy status indicator
   */
  test('displays accuracy status indicator', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -7.2575,
          longitude: 110.4268,
          accuracy: 5, // Very good accuracy (< 10)
        },
        timestamp: Date.now(),
      });
    });

    render(<GeolocationCapture />);

    fireEvent.click(screen.getByText('📍 Ambil Lokasi Saat Ini'));

    await waitFor(() => {
      expect(screen.getByText('🟢 Sangat Akurat')).toBeInTheDocument();
    });
  });

  /**
   * Test: GPS error handling
   */
  test('displays error message on GPS failure', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        message: 'User denied geolocation',
      });
    });

    render(<GeolocationCapture />);

    fireEvent.click(screen.getByText('📍 Ambil Lokasi Saat Ini'));

    await waitFor(() => {
      expect(screen.getByText(/Izin GPS ditolak/)).toBeInTheDocument();
    });
  });

  /**
   * Test: Activity type selection
   */
  test('allows selecting different activity types', () => {
    render(<GeolocationCapture />);

    const select = screen.getByDisplayValue('📍 Absen Masuk') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'absen_keluar' } });

    expect(select.value).toBe('absen_keluar');
  });

  /**
   * Test: Camera button visibility
   */
  test('shows camera button', () => {
    render(<GeolocationCapture />);

    expect(screen.getByText('📷 Buka Kamera')).toBeInTheDocument();
  });

  /**
   * Test: Submit button disabled without GPS
   */
  test('submit button is disabled without GPS data', () => {
    render(<GeolocationCapture />);

    const submitButton = screen.getByText('Kirim Absensi') as HTMLButtonElement;

    expect(submitButton).toBeDisabled();
  });

  /**
   * Test: Submit button enabled with GPS data
   */
  test('submit button is enabled after GPS capture', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -7.2575,
          longitude: 110.4268,
          accuracy: 25,
        },
        timestamp: Date.now(),
      });
    });

    render(<GeolocationCapture />);

    fireEvent.click(screen.getByText('📍 Ambil Lokasi Saat Ini'));

    await waitFor(() => {
      const submitButton = screen.getByText('Kirim Absensi') as HTMLButtonElement;
      expect(submitButton).not.toBeDisabled();
    });
  });

  /**
   * Test: Online/Offline status indicator
   */
  test('displays online status', () => {
    render(<GeolocationCapture />);

    if (navigator.onLine) {
      expect(screen.getByText('Online')).toBeInTheDocument();
    }
  });

  /**
   * Test: API submission on online
   */
  test('submits attendance via API when online', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: -7.2575,
          longitude: 110.4268,
          accuracy: 25,
        },
        timestamp: Date.now(),
      });
    });

    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        message: '✅ Absensi berhasil',
        data: {
          attendance_id: 1,
          status: 'verified',
        },
      },
    });

    render(<GeolocationCapture />);

    // Capture GPS
    fireEvent.click(screen.getByText('📍 Ambil Lokasi Saat Ini'));

    await waitFor(() => {
      expect(screen.getByText('Kirim Absensi')).not.toBeDisabled();
    });

    // Submit
    fireEvent.click(screen.getByText('Kirim Absensi'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/attendance',
        expect.objectContaining({
          latitude: -7.2575,
          longitude: 110.4268,
        }),
        expect.any(Object),
      );
    });
  });
});
