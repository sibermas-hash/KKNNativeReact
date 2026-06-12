import { useState } from 'react'
import { api } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/auth'

export function LoginPage() {
  const { refresh } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/login', { identifier, email: identifier, username: identifier, password })
      await refresh()
      window.location.href = '/mahasiswa'
    } catch (err) {
      setError('Login gagal. Periksa akun, password, captcha/2FA sesuai konfigurasi backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-600 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-emerald-800">PORTAL SIBERMAS</h1>
          <p className="mt-1 text-sm text-slate-500">Beta SPA — kontrak API sama</p>
        </div>
        <label className="mb-4 block text-sm font-medium text-slate-700">Email/NIM/Username
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none ring-emerald-500 focus:ring-2" autoComplete="username" required />
        </label>
        <label className="mb-4 block text-sm font-medium text-slate-700">Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none ring-emerald-500 focus:ring-2" autoComplete="current-password" required />
        </label>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{loading ? 'Masuk...' : 'Masuk'}</button>
        <p className="mt-4 text-xs text-slate-500">Catatan: login final harus dibuat pixel-identical dengan Next lama, termasuk captcha/2FA.</p>
      </form>
    </main>
  )
}
