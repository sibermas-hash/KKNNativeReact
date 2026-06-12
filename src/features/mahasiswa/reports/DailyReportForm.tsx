import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Camera, LoaderCircle, Save, X } from 'lucide-react'
import { api } from '../../../shared/api/client'
import { compressImage, formatBytes, type ImageCompressionResult } from '../../../shared/utils/imageCompression'

export const DAILY_REPORT_ENDPOINT = '/student/daily-reports'

export type DailyReport = {
  id: number | string
  tanggal?: string
  date?: string
  kegiatan?: string
  activity?: string
  deskripsi?: string
  description?: string
  kendala?: string
  obstacle?: string
  lokasi?: string
  location?: string
  foto?: string
  photo?: string
  image?: string
}

type Props = { id?: string | null; onDone?: () => void; onCancel?: () => void }

function firstText(...values: unknown[]) {
  return values.find((value) => typeof value === 'string' && value.length) as string | undefined
}

function errorMessage(error: unknown) {
  const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
  return (err.response?.data?.errors && Object.values(err.response.data.errors).flat()[0]) || err.response?.data?.message || err.message || 'Gagal menyimpan laporan.'
}

export function DailyReportForm({ id, onDone, onCancel }: Props) {
  const isEdit = Boolean(id)
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [kegiatan, setKegiatan] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kendala, setKendala] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [photo, setPhoto] = useState<ImageCompressionResult | null>(null)
  const [existingPhoto, setExistingPhoto] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<DailyReport>(`${DAILY_REPORT_ENDPOINT}/${id}`)
      .then((res) => {
        const data = res.data
        setTanggal(firstText(data.tanggal, data.date)?.slice(0, 10) || '')
        setKegiatan(firstText(data.kegiatan, data.activity) || '')
        setDeskripsi(firstText(data.deskripsi, data.description) || '')
        setKendala(firstText(data.kendala, data.obstacle) || '')
        setLokasi(firstText(data.lokasi, data.location) || '')
        setExistingPhoto(firstText(data.foto, data.photo, data.image))
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => () => { if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl) }, [photo])

  const preview = useMemo(() => photo?.previewUrl || existingPhoto, [existingPhoto, photo?.previewUrl])

  const pickPhoto = async (file?: File) => {
    if (!file) return
    setCompressing(true)
    setError(null)
    try {
      const compressed = await compressImage(file, 1600, 0.72)
      setPhoto((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
        return compressed
      })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCompressing(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('tanggal', tanggal)
      form.append('kegiatan', kegiatan)
      form.append('deskripsi', deskripsi)
      form.append('kendala', kendala)
      form.append('lokasi', lokasi)
      if (photo?.file) form.append('foto', photo.file)
      if (isEdit) {
        form.append('_method', 'PUT')
        await api.post(`${DAILY_REPORT_ENDPOINT}/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post(DAILY_REPORT_ENDPOINT, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      onDone?.()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="rounded-2xl border bg-white p-5 text-slate-500">Memuat laporan...</div>

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-800">{isEdit ? 'Edit Laporan Harian' : 'Buat Laporan Harian'}</h2><p className="text-sm text-slate-500">Upload dikompresi client-side sebelum submit.</p></div>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><X className="inline h-4 w-4" /> Batal</button>}
      </div>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Tanggal<input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium text-slate-700">Lokasi<input value={lokasi} onChange={(e) => setLokasi(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Lokasi kegiatan" /></label>
      </div>
      <label className="block text-sm font-medium text-slate-700">Kegiatan<input required value={kegiatan} onChange={(e) => setKegiatan(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Judul/ringkasan kegiatan" /></label>
      <label className="block text-sm font-medium text-slate-700">Deskripsi<textarea required rows={5} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Detail laporan harian" /></label>
      <label className="block text-sm font-medium text-slate-700">Kendala<textarea rows={3} value={kendala} onChange={(e) => setKendala(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Opsional" /></label>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-xl border bg-slate-50">
          {preview ? <img src={preview} alt="Preview foto laporan" className="h-44 w-full object-cover" /> : <div className="grid h-44 place-items-center text-sm text-slate-400">Belum ada foto</div>}
        </div>
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"><Camera className="h-4 w-4" /> Pilih foto<input type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e.target.files?.[0])} /></label>
          {compressing && <p className="text-sm text-slate-500">Mengompresi foto...</p>}
          {photo && <p className="text-sm text-emerald-700">{formatBytes(photo.originalSize)} → {formatBytes(photo.compressedSize)} ({photo.width}×{photo.height})</p>}
          <p className="text-xs text-slate-500">Target: lebar max 1600px, quality ±0.72, ukuran 300–600KB bila memungkinkan.</p>
        </div>
      </div>
      <button disabled={saving || compressing} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan</button>
    </form>
  )
}
