const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

export async function fetchApiOrThrow<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const result = await fetchApi<T>(endpoint, options);
  if (result === null) throw new Error(`Failed to fetch ${endpoint}`);
  return result;
}
