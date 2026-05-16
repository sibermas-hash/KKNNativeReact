import type { AxiosAdapter, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { createMobileClient, createWebClient } from './client';

type CapturedRequest = {
  method: string | undefined;
  data: unknown;
};

function installCaptureAdapter(client: AxiosInstance): CapturedRequest[] {
  const captured: CapturedRequest[] = [];
  const adapter: AxiosAdapter = async (config) => {
    captured.push({ method: config.method, data: config.data });

    return {
      data: { data: { ok: true } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config as InternalAxiosRequestConfig,
    };
  };

  client.defaults.adapter = adapter;

  return captured;
}

describe('REST method spoofing', () => {
  it('spoofs patch requests from the web client into POST + _method', async () => {
    const client = createWebClient('https://example.test/api/v1');
    const captured = installCaptureAdapter(client);

    await client.patch('/profile', { display_name: 'Sibermas' });

    expect(captured).toHaveLength(1);
    expect(captured[0]?.method).toBe('post');
    expect(String(captured[0]?.data)).toContain('"display_name":"Sibermas"');
    expect(String(captured[0]?.data)).toContain('"_method":"PATCH"');
  });

  it('spoofs delete requests without a body into POST + _method', async () => {
    const client = createWebClient('https://example.test/api/v1');
    const captured = installCaptureAdapter(client);

    await client.delete('/admin/dispensasi/7');

    expect(captured).toHaveLength(1);
    expect(captured[0]?.method).toBe('post');
    expect(String(captured[0]?.data)).toContain('"_method":"DELETE"');
  });

  it('keeps get requests unchanged', async () => {
    const client = createWebClient('https://example.test/api/v1');
    const captured = installCaptureAdapter(client);

    await client.get('/period-context');

    expect(captured).toHaveLength(1);
    expect(captured[0]?.method).toBe('get');
  });

  it('spoofs patch requests for the mobile client too', async () => {
    const client = createMobileClient(async () => null, 'https://example.test/api/v1');
    const captured = installCaptureAdapter(client);

    await client.patch('/profile/notification-preferences', { email: false });

    expect(captured).toHaveLength(1);
    expect(captured[0]?.method).toBe('post');
    expect(String(captured[0]?.data)).toContain('"_method":"PATCH"');
    expect(String(captured[0]?.data)).toContain('"email":false');
  });
});
