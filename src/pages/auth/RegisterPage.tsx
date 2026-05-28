import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiArrowRight,
  HiExclamationCircle,
  HiCheckCircle,
} from 'react-icons/hi'
import api from '../../api/axiosInstance'
import AuthLayout from '../../components/layout/AuthLayout'

const schema = z
  .object({
    name: z.string().min(2, 'Ho ten it nhat 2 ky tu').max(50, 'Ho ten toi da 50 ky tu'),
    email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
    passWord: z
      .string()
      .min(8, 'Mat khau it nhat 8 ky tu')
      .regex(/[a-zA-Z]/, 'Phai chua it nhat 1 chu cai')
      .regex(/\d/, 'Phai chua it nhat 1 chu so'),
    confirmPassword: z.string().min(1, 'Vui long xac nhan mat khau'),
    phone: z.string().regex(/^0[35789]\d{8}$/, 'So dien thoai khong hop le (10 so, dau 03/05/07/08/09)'),
  })
  .refine((d) => d.passWord === d.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-2">
      <HiExclamationCircle size={14} /> {msg}
    </p>
  ) : null

const getStrength = (pw: string): { level: number; label: string; color: string } => {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  const map = [
    { level: 0, label: '', color: 'bg-muted' },
    { level: 1, label: 'Yeu', color: 'bg-destructive' },
    { level: 2, label: 'Trung binh', color: 'bg-amber-500' },
    { level: 3, label: 'Kha', color: 'bg-primary' },
    { level: 4, label: 'Manh', color: 'bg-accent' },
  ]
  return map[score]
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const pwValue = watch('passWord', '')
  const strength = getStrength(pwValue)
  const strengthBars = 4

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/register', {
        name: data.name,
        email: data.email,
        passWord: data.passWord,
        phone: data.phone,
      })
      localStorage.setItem('pendingVerifyEmail', data.email)
      toast.success('Dang ky thanh cong! Vui long xac thuc email.')
      navigate('/verify-email')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dang ky that bai')
    }
  }

  const inputClass = (hasError?: boolean, withRight = false) =>
    `w-full pl-11 ${withRight ? 'pr-12' : 'pr-4'} py-3.5 bg-secondary border-2 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none transition-all ${
      hasError ? 'border-destructive focus:border-destructive' : 'border-transparent focus:border-primary'
    }`

  return (
    <AuthLayout
      imageSeed="vietnam-rice-terraces"
      quote="Moi hanh trinh bat dau bang mot buoc dau tien nho be."
    >
      <div className="bg-card rounded-2xl border border-border p-8 md:p-10 shadow-xl shadow-primary/5">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-semibold text-foreground">Tao tai khoan</h2>
          <p className="text-muted-foreground mt-2 text-sm">Mien phi va chi mat 1 phut</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Ho va ten</label>
            <div className="relative group">
              <HiOutlineUser
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type="text"
                placeholder="Nguyen Van A"
                autoComplete="name"
                {...register('name')}
                className={inputClass(!!errors.name)}
              />
            </div>
            <FieldError msg={errors.name?.message} />
          </div>

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
                placeholder="example@email.com"
                autoComplete="email"
                {...register('email')}
                className={inputClass(!!errors.email)}
              />
            </div>
            <FieldError msg={errors.email?.message} />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">So dien thoai</label>
            <div className="relative group">
              <HiOutlinePhone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type="tel"
                placeholder="0912 345 678"
                autoComplete="tel"
                {...register('phone')}
                className={inputClass(!!errors.phone)}
              />
            </div>
            <FieldError msg={errors.phone?.message} />
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
                placeholder="Toi thieu 8 ky tu, co chu + so"
                autoComplete="new-password"
                {...register('passWord')}
                className={inputClass(!!errors.passWord, true)}
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

            {/* Strength meter */}
            {pwValue && (
              <div className="mt-3">
                <div className="flex gap-1.5 mb-2">
                  {Array.from({ length: strengthBars }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < strength.level ? strength.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p
                    className={`text-xs font-medium ${
                      strength.level <= 1
                        ? 'text-destructive'
                        : strength.level === 2
                          ? 'text-amber-500'
                          : strength.level === 3
                            ? 'text-primary'
                            : 'text-accent'
                    }`}
                  >
                    Do manh: {strength.label}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Xac nhan mat khau</label>
            <div className="relative group">
              <HiOutlineLockClosed
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={inputClass(!!errors.confirmPassword, true)}
              />
              {watch('confirmPassword') && !errors.confirmPassword && (
                <HiCheckCircle
                  size={18}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-accent"
                />
              )}
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
            <FieldError msg={errors.confirmPassword?.message} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Tao tai khoan
                <HiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
          Da co tai khoan?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-accent transition-colors">
            Dang nhap
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
