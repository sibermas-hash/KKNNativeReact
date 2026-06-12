export type ImageCompressionResult = {
  file: File
  originalSize: number
  compressedSize: number
  width: number
  height: number
  previewUrl: string
}

const TARGET_MAX = 600 * 1024
const TARGET_MIN = 300 * 1024

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gagal kompres gambar'))), 'image/jpeg', quality)
  })
}

export async function compressImage(file: File, maxWidth = 1600, initialQuality = 0.72): Promise<ImageCompressionResult> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar')

  const image = await loadImage(file)
  const scale = Math.min(1, maxWidth / image.naturalWidth)
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung kompresi gambar')
  ctx.drawImage(image, 0, 0, width, height)

  let quality = initialQuality
  let blob = await canvasToBlob(canvas, quality)

  while (blob.size > TARGET_MAX && quality > 0.42) {
    quality = Math.max(0.42, quality - 0.08)
    blob = await canvasToBlob(canvas, quality)
  }
  while (blob.size < TARGET_MIN && quality < 0.82 && file.size > TARGET_MIN) {
    quality = Math.min(0.82, quality + 0.05)
    const bigger = await canvasToBlob(canvas, quality)
    if (bigger.size > TARGET_MAX) break
    blob = bigger
  }

  const name = file.name.replace(/\.[^.]+$/, '') || 'foto'
  const compressed = new File([blob], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  return {
    file: compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    width,
    height,
    previewUrl: URL.createObjectURL(compressed),
  }
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 KB'
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`
}
