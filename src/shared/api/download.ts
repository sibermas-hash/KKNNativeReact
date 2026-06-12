import type { AxiosInstance, AxiosResponse } from 'axios'
import { api } from './client'

function fallbackName(url: string) {
  const clean = url.split('?')[0]
  return decodeURIComponent(clean.substring(clean.lastIndexOf('/') + 1) || 'sertifikat.pdf')
}

function filenameFromDisposition(disposition?: string, fallback = 'sertifikat.pdf') {
  if (!disposition) return fallback
  const utf = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (utf) return decodeURIComponent(utf.replace(/"/g, ''))
  const ascii = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  return ascii ? decodeURIComponent(ascii) : fallback
}

export async function downloadBlob(url: string, filename?: string, client: AxiosInstance = api) {
  const response = await client.get<Blob | ArrayBuffer, AxiosResponse<Blob | ArrayBuffer>>(url, { responseType: 'blob' })
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })
  const name = filenameFromDisposition(String(response.headers?.['content-disposition'] ?? ''), filename || fallbackName(url))
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
  return name
}

export { filenameFromDisposition }
