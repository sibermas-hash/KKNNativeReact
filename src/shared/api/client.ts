import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

export type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sibermas.site/api/v1'

function unwrap<T>(response: AxiosResponse<ApiEnvelope<T> | T>): T {
  if (response.status === 204) return undefined as T
  const raw = response.data as unknown
  if (typeof raw === 'string') {
    const contentType = String(response.headers?.['content-type'] ?? '')
    if (raw.trimStart().startsWith('<') || !contentType.includes('application/json')) {
      throw new Error(`API returned non-JSON response (${contentType || 'unknown'}) for ${response.config.url ?? '?'}`)
    }
  }
  if (raw && typeof raw === 'object' && 'data' in raw) return (raw as ApiEnvelope<T>).data as T
  return response.data as T
}

export function createWebClient(baseURL = API_BASE_URL): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  })

  client.interceptors.response.use(
    (response) => ({ ...response, data: unwrap(response) }),
    (error) => Promise.reject(error),
  )

  return client
}

export const api = createWebClient()
