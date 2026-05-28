import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  MdPerson, MdEmail, MdLock, MdPhone,
  MdVisibility, MdVisibilityOff, MdArrowForward, MdErrorOutline, MdCheckCircle,
} from 'react-icons/md'
import api from '../../api/axiosInstance'
import AuthLayout from '../../components/layout/AuthLayout'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z
      .string()
      .min(2, 'Họ tên ít nhất 2 ký tự')
      .max(50, 'Họ tên tối đa 50 ký tự'),
    email: z
      .string()
      .min(1, 'Email là bắt buộc')
      .email('Email không hợp lệ'),
    passWord: z
      .string()
      .min(8, 'Mật khẩu ít nhất 8 ký tự')
      .regex(/[a-zA-Z]/, 'Phải chứa ít nhất 1 chữ cái')
      .regex(/\d/, 'Phải chứa ít nhất 1 chữ số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    phone: z
      .string()
      .regex(/^0[35789]\d{8}$/, 'Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09)'),
  })
  .refine(d => d.passWord === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean, withRight = false) =>
  `block w-full pl-11 ${withRight ? 'pr-12' : 'pr-4'} py-3.5 bg-gray-50 border-2 rounded-2xl
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

// Password strength meter
const getStrength = (pw: string): { level: number; label: string; color: string } => {
  let score = 0
  if (pw.length >= 8)    score++
  if (/[A-Z]/.test(pw))  score++
  if (/[0-9]/.test(pw))  score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  const map = [
    { level: 0, label: '',        color: 'bg-gray-200' },
    { level: 1, label: 'Yếu',    color: 'bg-red-400'  },
    { level: 2, label: 'Trung bình', color: 'bg-amber-400' },
    { level: 3, label: 'Khá',    color: 'bg-blue-400'  },
    { level: 4, label: 'Mạnh',   color: 'bg-emerald-500' },
  ]
  return map[score]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const navigate = useNavigate()
  const [showPw,      setShowPw]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const pwValue    = watch('passWord', '')
  const strength   = getStrength(pwValue)
  const strengthBars = 4

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/register', {
        name:     data.name,
        email:    data.email,
        passWord: data.passWord,
        phone:    data.phone,
      })
      localStorage.setItem('pendingVerifyEmail', data.email)
      toast.success('Đăng ký thành công! Vui lòng xác thực email.')
      navigate('/verify-email')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đăng ký thất bại')
    }
  }

  return (
    <AuthLayout
      imageSeed="vietnam-rice-terraces"
      quote="Mỗi hành trình bắt đầu bằng một bước đầu tiên nhỏ bé."
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">

        <div className="mb-7">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tạo tài khoản</h2>
          <p className="text-gray-500 mt-1.5 text-sm">Miễn phí và chỉ mất 1 phút</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Họ tên */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Họ và tên</label>
            <div className="relative group">
              <MdPerson
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                           text-gray-400 group-focus-within:text-[#1a5276] transition-colors"
              />
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                {...register('name')}
                className={inputCls(!!errors.name)}
              />
            </div>
            <FieldError msg={errors.name?.message} />
          </div>

          {/* Email */}
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
                placeholder="example@email.com"
                autoComplete="email"
                {...register('email')}
                className={inputCls(!!errors.email)}
              />
            </div>
            <FieldError msg={errors.email?.message} />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Số điện thoại</label>
            <div className="relative group">
              <MdPhone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                           text-gray-400 group-focus-within:text-[#1a5276] transition-colors"
              />
              <input
                type="tel"
                placeholder="0912 345 678"
                autoComplete="tel"
                {...register('phone')}
                className={inputCls(!!errors.phone)}
              />
            </div>
            <FieldError msg={errors.phone?.message} />
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Mật khẩu</label>
            <div className="relative group">
              <MdLock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                           text-gray-400 group-focus-within:text-[#1a5276] transition-colors"
              />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự, có chữ + số"
                autoComplete="new-password"
                {...register('passWord')}
                className={inputCls(!!errors.passWord, true)}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPw(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-[#1a5276] transition-colors"
              >
                {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            <FieldError msg={errors.passWord?.message} />

            {/* Strength meter */}
            {pwValue && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: strengthBars }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < strength.level ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className={`text-xs font-medium ${
                    strength.level <= 1 ? 'text-red-500'
                    : strength.level === 2 ? 'text-amber-500'
                    : strength.level === 3 ? 'text-blue-500'
                    : 'text-emerald-600'
                  }`}>
                    Độ mạnh: {strength.label}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
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
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={inputCls(!!errors.confirmPassword, true)}
              />
              {/* Match indicator */}
              {watch('confirmPassword') && !errors.confirmPassword && (
                <MdCheckCircle
                  size={18}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500"
                />
              )}
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-[#1a5276] transition-colors"
              >
                {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            <FieldError msg={errors.confirmPassword?.message} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 text-white font-bold
                       py-3.5 rounded-2xl transition-all active:scale-95 hover:opacity-90
                       disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
            style={{
              background: 'linear-gradient(135deg, #1a5276, #2980b9)',
              boxShadow: '0 8px 24px rgba(26,82,118,0.30)',
            }}
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Tạo tài khoản
                <MdArrowForward size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">hoặc</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <p className="text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-black text-[#1a5276] hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
