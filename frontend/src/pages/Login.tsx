import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, LogIn, BarChart3 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

export default function Login() {
  const { t } = useTranslation()

  const loginSchema = z.object({
    email: z.string().min(1, t('login.emailRequired')).email(t('login.emailInvalid')),
    password: z.string().min(1, t('login.passwordRequired')).min(6, t('login.passwordMinLength')),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const navigate = useNavigate()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const [error, setError] = React.useState('')

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || t('login.invalidCredentials'))
      }
      const result = await res.json()
      localStorage.setItem('token', result.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || t('login.loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('login.title')}</h1>
            <p className="mt-1 text-sm text-gray-400">{t('login.subtitle')}</p>
          </div>

          {/* Form */}
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('login.emailPlaceholder')}
                {...register('email')}
                className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-white/10 hover:border-white/20'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('login.passwordPlaceholder')}
                  {...register('password')}
                  className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <a
                href="#"
                className="text-sm text-blue-400 transition hover:text-blue-300 hover:underline"
              >
                {t('login.forgotPassword')}
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  {t('login.signIn')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          {t('login.copyright')}
        </p>
      </div>
    </div>
  )
}
