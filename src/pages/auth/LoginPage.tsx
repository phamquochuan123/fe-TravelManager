import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdArrowForward, MdErrorOutline,
} from 'react-icons/md'
import { AppContext } from '../../context/AppContext'
import api from '../../api/axiosInstance'
import AuthLayout from '../../components/layout/AuthLayout'
import type { User } from '../../types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email:      z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  passWord:   z.string().min(8, 'Mật khẩu ít nhất 8 ký tự'),
  rememberMe: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean, extraRight = false) =>
  `block w-full pl-11 ${extraRight ? 'pr-12' : 'pr-4'} py-3.5 bg-[#f8f5ee] border-2 rounded
   text-sm font-medium text-gray-700 placeholder-gray-400
   focus:bg-white focus:outline-none focus:ring-4 transition-all
   ${hasError
     ? 'border-red-400 focus:border-red-500 focus:ring-red-50'
     : 'border-transparent focus:[border-color:#0a1628] focus:ring-4 focus:[--tw-ring-color:rgba(10,22,40,0.1)]'}`

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-xs text-red-500 font-medium mt-1">
      <MdErrorOutline size={13} /> {msg}
    </p>
  ) : null

// ─── Page ─────────────────────────────────────────────────────────────────────

const LoginPage = () => {
  const navigate = useNavigate()
  const { setIsLoggedIn, getUserData } = useContext(AppContext)
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { rememberMe: false } })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/login', { email: data.email, passWord: data.passWord })
      setIsLoggedIn(true)
      const user: User | null = await getUserData()
      if (!user) throw new Error('Không lấy được thông tin người dùng')

      toast.success(`Chào mừng trở lại, ${user.name}!`)

      if      (user.roleName === 'ADMIN') navigate('/admin',  { replace: true })
      else if (user.roleName === 'STAFF') navigate('/staff',  { replace: true })
      else                                navigate('/',        { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    }
  }

  return (
    <AuthLayout
      imageSeed="vietnam-mountain-fog"
      quote="Mỗi chuyến đi là một câu chuyện mới đang chờ được viết."
    >
      <div className="bg-white rounded-sm border border-gray-100 p-8 md:p-10" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Chào mừng trở lại</h2>
          <p className="text-gray-500 mt-1.5 text-sm">Đăng nhập để tiếp tục khám phá</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* Email */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Email</label>
            <div className="relative group">
              <MdEmail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                           text-gray-400 group-focus-within:text-primary transition-colors"
              />
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register('email')}
                className={inputCls(!!errors.email)}
              />
            </div>
            <FieldError msg={errors.email?.message} />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Mật khẩu</label>
            <div className="relative group">
              <MdLock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none
                           text-gray-400 group-focus-within:text-primary transition-colors"
              />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('passWord')}
                className={inputCls(!!errors.passWord, true)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-primary transition-colors"
              >
                {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            <FieldError msg={errors.passWord?.message} />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded cursor-pointer accent-[#0a1628]"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                Ghi nhớ đăng nhập
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-bold text-[#0a1628] hover:text-[#c9a84c] transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 text-white font-black
                       py-4 rounded transition-all active:scale-95 hover:opacity-90
                       disabled:opacity-60 disabled:cursor-not-allowed group mt-1"
            style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 6px 20px rgba(10,22,40,0.35)' }}
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Đăng nhập
                <MdArrowForward size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">hoặc</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <p className="text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-black text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
