import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiArrowRight,
  HiExclamationCircle,
} from 'react-icons/hi'
import { AppContext } from '../../context/AppContext'
import api from '../../api/axiosInstance'
import AuthLayout from '../../components/layout/AuthLayout'
import type { User } from '../../types'

const schema = z.object({
  email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
  passWord: z.string().min(8, 'Mat khau it nhat 8 ky tu'),
  rememberMe: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-2">
      <HiExclamationCircle size={14} /> {msg}
    </p>
  ) : null

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
      if (!user) throw new Error('Khong lay duoc thong tin nguoi dung')

      toast.success(`Chao mung tro lai, ${user.name}!`)

      if (user.roleName === 'ADMIN') navigate('/admin', { replace: true })
      else if (user.roleName === 'STAFF') navigate('/staff', { replace: true })
      else navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dang nhap that bai')
    }
  }

  return (
    <AuthLayout
      imageSeed="vietnam-mountain-fog"
      quote="Moi chuyen di la mot cau chuyen moi dang cho duoc viet."
    >
      <div className="bg-card rounded-2xl border border-border p-8 md:p-10 shadow-xl shadow-primary/5">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-semibold text-foreground">Chao mung tro lai</h2>
          <p className="text-muted-foreground mt-2 text-sm">Dang nhap de tiep tuc kham pha</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Email</label>
            <div className="relative group">
              <HiOutlineMail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register('email')}
                className={`w-full pl-11 pr-4 py-3.5 bg-secondary border-2 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none transition-all ${
                  errors.email
                    ? 'border-destructive focus:border-destructive'
                    : 'border-transparent focus:border-primary'
                }`}
              />
            </div>
            <FieldError msg={errors.email?.message} />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Mat khau</label>
            <div className="relative group">
              <HiOutlineLockClosed
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('passWord')}
                className={`w-full pl-11 pr-12 py-3.5 bg-secondary border-2 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none transition-all ${
                  errors.passWord
                    ? 'border-destructive focus:border-destructive'
                    : 'border-transparent focus:border-primary'
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
            <FieldError msg={errors.passWord?.message} />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded cursor-pointer accent-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Ghi nho dang nhap
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:text-accent transition-colors"
            >
              Quen mat khau?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Dang nhap
                <HiArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">hoac</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Chua co tai khoan?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-accent transition-colors">
            Dang ky ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
