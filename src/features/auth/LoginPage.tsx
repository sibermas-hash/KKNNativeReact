import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, RefreshCcw } from 'lucide-react'
import { api } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/auth'

type Captcha = { captcha_id: string; question: string; expires_at?: string }
type LoginResponse = { user?: unknown; token?: string; redirect?: string; redirect_to?: string; url?: string }
type ApiError = { response?: { status?: number; data?: { error?: { code?: string; message?: string; errors?: Record<string, string[] | string | number>; challenge_token?: string } } }; message?: string }

function getError(error: unknown) {
  const err = error as ApiError
  const apiError = err.response?.data?.error
  const first = apiError?.errors ? Object.values(apiError.errors).flat()[0] : undefined
  return String(first || apiError?.message || err.message || 'Login gagal. Silakan coba lagi.')
}

export function LoginPage() {
  const { refresh } = useAuth()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<Captcha | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const refreshCooldown = useRef(false)

  const fetchCaptcha = async (force = false) => {
    if (refreshCooldown.current && !force) return
    refreshCooldown.current = true
    window.setTimeout(() => { refreshCooldown.current = false }, 3000)
    setCaptchaLoading(true)
    try {
      const data = await api.get<Captcha>('/auth/captcha').then((r) => r.data)
      if (data?.captcha_id) {
        setCaptcha(data)
        setCaptchaAnswer('')
      }
    } catch {
      setErrors(['Gagal memuat CAPTCHA'])
    } finally {
      setCaptchaLoading(false)
    }
  }

  const refetchCaptchaSoon = () => {
    refreshCooldown.current = false
    setCaptcha(null)
    setCaptchaAnswer('')
    window.setTimeout(() => { void fetchCaptcha(true) }, 100)
  }

  useEffect(() => { void fetchCaptcha(true) }, [])

  useEffect(() => {
    if (!captcha?.expires_at) return
    const timeout = Math.max(5_000, new Date(captcha.expires_at).getTime() - Date.now())
    const timer = window.setTimeout(() => { void fetchCaptcha(true) }, timeout)
    return () => window.clearTimeout(timer)
  }, [captcha?.expires_at])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrors([])
    if (!captcha?.captcha_id) {
      setErrors(['CAPTCHA belum siap. Silakan muat ulang.'])
      refetchCaptchaSoon()
      return
    }
    setLoading(true)
    try {
      const payload = {
        login: login.trim(),
        password,
        captcha_id: captcha.captcha_id,
        captcha_answer: captchaAnswer.trim(),
      }
      const data = await api.post<LoginResponse>('/auth/login', payload).then((r) => r.data)
      if (data?.user) await refresh()
      window.location.href = data?.redirect || data?.redirect_to || data?.url || '/mahasiswa'
    } catch (error) {
      const err = error as ApiError
      const apiError = err.response?.data?.error
      if (err.response?.status === 423 && apiError?.code === 'TWO_FACTOR_REQUIRED') {
        const token = apiError.challenge_token || (typeof apiError.errors?.challenge_token === 'string' ? apiError.errors.challenge_token : undefined)
        if (token) {
          try { sessionStorage.setItem('sibermas_2fa_challenge', token) } catch { /* ignore */ }
          window.location.href = '/login/2fa'
          return
        }
      }
      if (err.response?.status === 422 && apiError?.code === 'CAPTCHA_INVALID') {
        setErrors(['Verifikasi keamanan kedaluwarsa atau salah.'])
        refetchCaptchaSoon()
      } else if (err.response?.status === 422 && apiError?.code === 'CREDENTIALS_INVALID') {
        setErrors(['NIM/NIP/username atau kata sandi salah'])
        refetchCaptchaSoon()
      } else {
        setErrors([getError(error)])
        refetchCaptchaSoon()
      }
    } finally {
      setLoading(false)
    }
  }

  const captchaQuestion = (captcha?.question || '...').replace(/Berapa\s+hasil\s+/i, '').replace(/\?$/, '').trim()

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[36rem] w-[36rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <a href="/" className="mx-auto mb-4 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:bg-white/10">Kembali ke Beranda Utama</a>
        <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500 text-2xl font-black text-white shadow-lg">S</div>
            <h1 className="text-2xl font-black text-white">Login SIBERMAS</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200/80">Sistem Informasi KKN</p>
          </div>

          <label className="mb-4 block text-xs font-black uppercase tracking-widest text-slate-300">NIM / NIP / Username
            <input value={login} onChange={(e) => setLogin(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 placeholder:text-slate-500 focus:ring-2" autoComplete="username" required autoFocus />
          </label>

          <label className="mb-4 block text-xs font-black uppercase tracking-widest text-slate-300">Kata Sandi
            <div className="mt-2 flex rounded-2xl border border-white/10 bg-slate-950/70 focus-within:ring-2 focus-within:ring-cyan-400/40">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 text-sm text-white outline-none" autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="px-3 text-slate-400 hover:text-white" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>

          <label className="mb-4 block text-xs font-black uppercase tracking-widest text-slate-300">Captcha
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-lg font-black tracking-widest text-cyan-100">{captchaQuestion}</div>
              <button type="button" onClick={() => fetchCaptcha(true)} disabled={captchaLoading} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 hover:bg-white/10" aria-label="Muat ulang captcha"><RefreshCcw size={18} className={captchaLoading ? 'animate-spin' : ''} /></button>
            </div>
            <input value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 focus:ring-2" autoComplete="off" required />
          </label>

          {errors.map((error) => <div key={error} className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-100">{error}</div>)}

          <button disabled={loading || !captcha} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60">
            {loading && <LoaderCircle size={18} className="animate-spin" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  )
}
