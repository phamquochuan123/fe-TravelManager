import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdArrowForward, MdArrowBack, MdErrorOutline, MdFlight,
  MdRefresh, MdCheckCircle,
} from 'react-icons/md'
import api from '../../api/axiosInstance'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
})
type Step1Data = z.infer<typeof step1Schema>

const step2Schema = z.object({
  otp: z.string().min(1, 'Vui lòng nhập mã OTP').max(6, 'OTP tối đa 6 ký tự'),
  newPassword: z.string().min(8, 'Mật khẩu ít nhất 8 ký tự'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})
type Step2Data = z.infer<typeof step2Schema>

// ─── UI helpers ───────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean, extraRight = false) =>
  `block w-full pl-11 ${extraRight ? 'pr-12' : 'pr-4'} py-3.5 bg-gray-50 border-2 rounded-2xl
   text-sm font-medium text-gray-700 placeholder-gray-400
   focus:bg-white focus:outline-none focus:ring-4 transition-all
   ${hasError
     ? 'border-red-400 focus:border-red-500 focus:ring-red-50'
     : 'border-transparent focus:border-[#1a5276] focus:ring-[#1a5276]/10'}`

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-xs text-red-500 font-medium mt-1">
      <MdErrorOutline size={13} /> {msg}
    </p>
  ) : null

// ─── Page ─────────────────────────────────────────────────────────────────────

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [sentEmail, setSentEmail] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const onSendOtp = async (data: Step1Data) => {
    try {
      await api.post(`/send-reset-otp?email=${encodeURIComponent(data.email)}`)
      setSentEmail(data.email)
      setStep(2)
      startCountdown()
      toast.success(`Mã OTP đã gửi về ${data.email}`)
    } catch (err: any) {
      const msg: string = err?.message ?? 'Không thể gửi mã. Vui lòng thử lại.'
      if (msg.toLowerCase().includes('email') || msg.includes('không tồn tại')) {
        form1.setError('email', { message: msg })
      } else {
        form1.setError('email', { message: msg })
      }
    }
  }

  const onResend = async () => {
    if (countdown > 0) return
    try {
      await api.post(`/send-reset-otp?email=${encodeURIComponent(sentEmail)}`)
      startCountdown()
      toast.success(`Đã gửi lại mã OTP về ${sentEmail}`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể gửi lại mã.')
    }
  }

  const onResetPassword = async (data: Step2Data) => {
    try {
      await api.post('/reset-password', { email: sentEmail, otp: data.otp, newPassword: data.newPassword })
      toast.success('Đặt lại mật khẩu thành công!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      const msg: string = err?.message ?? 'Không thể đặt lại mật khẩu.'
      if (msg.includes('hết hạn') || msg.includes('không đúng') || msg.toLowerCase().includes('otp')) {
        form2.setError('otp', { message: msg })
      } else {
        form2.setError('otp', { message: msg })
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: '#f8fafc' }}
    >
      {/* Background */}
      <div
        className="absolute top-0 left-0 right-0 h-72"
        style={{ background: 'linear-gradient(160deg, #1a5276 0%, #2980b9 100%)' }}
      />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-white" />

      {/* Logo */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2.5 group z-10">
        <div
          className="p-2 rounded-xl backdrop-blur bg-white/20 group-hover:rotate-12 transition-transform"
          style={{ border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <MdFlight className="text-white" size={18} />
        </div>
        <span className="font-black text-lg text-white tracking-tight">
          Travel<span style={{ color: '#e67e22' }}>VN</span>
        </span>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mt-16">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10">

          {step === 1 ? (
            /* ── Step 1: Email ─────────────────────────────────────────────── */
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#eaf4fb' }}
                >
                  <MdEmail size={32} style={{ color: '#1a5276' }} />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quên mật khẩu?</h2>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                </p>
              </div>

              <form onSubmit={form1.handleSubmit(onSendOtp)} noValidate className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">Email</label>
                  <div className="relative group">
                    <MdEmail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                                 text-gray-400 group-focus-within:text-[#1a5276] transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      {...form1.register('email')}
                      className={inputCls(!!form1.formState.errors.email)}
                    />
                  </div>
                  <FieldError msg={form1.formState.errors.email?.message} />
                </div>

                <button
                  type="submit"
                  disabled={form1.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold
                             py-3.5 rounded-2xl transition-all active:scale-95 hover:opacity-90
                             disabled:opacity-60 disabled:cursor-not-allowed group"
                  style={{
                    background: 'linear-gradient(135deg, #1a5276, #2980b9)',
                    boxShadow: '0 8px 24px rgba(26,82,118,0.28)',
                  }}
                >
                  {form1.formState.isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Gửi mã xác nhận
                      <MdArrowForward size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#1a5276] transition-colors"
                >
                  <MdArrowBack size={16} /> Quay lại đăng nhập
                </Link>
              </div>
            </>
          ) : (
            /* ── Step 2: OTP + New Password ────────────────────────────────── */
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
                >
                  <MdArrowBack size={18} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Đặt lại mật khẩu</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mã OTP đã gửi về{' '}
                    <span className="font-bold text-[#1a5276]">{sentEmail}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={form2.handleSubmit(onResetPassword)} noValidate className="space-y-4">

                {/* OTP */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">Mã OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    {...form2.register('otp')}
                    className={`block w-full px-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm font-mono
                               text-center tracking-[0.5em] placeholder-gray-400
                               focus:bg-white focus:outline-none focus:ring-4 transition-all
                               ${form2.formState.errors.otp
                                 ? 'border-red-400 focus:border-red-500 focus:ring-red-50'
                                 : 'border-transparent focus:border-[#1a5276] focus:ring-[#1a5276]/10'}`}
                  />
                  <div className="flex items-start justify-between mt-1">
                    <FieldError msg={form2.formState.errors.otp?.message} />
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={countdown > 0}
                      className="flex items-center gap-1 text-xs font-bold text-[#1a5276]
                                 hover:text-[#e67e22] disabled:text-gray-400 disabled:cursor-not-allowed
                                 transition-colors shrink-0 ml-auto"
                    >
                      <MdRefresh size={13} />
                      {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">Mật khẩu mới</label>
                  <div className="relative group">
                    <MdLock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                                 text-gray-400 group-focus-within:text-[#1a5276] transition-colors"
                    />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...form2.register('newPassword')}
                      className={inputCls(!!form2.formState.errors.newPassword, true)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a5276] transition-colors"
                    >
                      {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                  <FieldError msg={form2.formState.errors.newPassword?.message} />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative group">
                    <MdLock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                                 text-gray-400 group-focus-within:text-[#1a5276] transition-colors"
                    />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...form2.register('confirmPassword')}
                      className={inputCls(!!form2.formState.errors.confirmPassword, true)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a5276] transition-colors"
                    >
                      {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                  <FieldError msg={form2.formState.errors.confirmPassword?.message} />
                </div>

                <button
                  type="submit"
                  disabled={form2.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold
                             py-3.5 rounded-2xl transition-all active:scale-95 hover:opacity-90
                             disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #1a5276, #2980b9)',
                    boxShadow: '0 8px 24px rgba(26,82,118,0.28)',
                  }}
                >
                  {form2.formState.isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <MdCheckCircle size={18} />
                      Đặt lại mật khẩu
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
