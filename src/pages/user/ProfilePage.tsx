import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import 'react-datepicker/dist/react-datepicker.css'
import {
  User, Lock, ShoppingBag, Heart, Bell, LogOut, Camera,
  Eye, EyeOff, Shield, CheckCircle2, Info, BadgeCheck, AlertTriangle, CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import api from '@/api/axiosInstance'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { resolveBase64Image } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'info' | 'password' | 'orders' | 'payments' | 'favorites' | 'notifications' | 'security'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ'),
  lastName:  z.string().min(1, 'Vui lòng nhập tên'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại gồm đúng 10 chữ số').or(z.literal('')),
  birthDate: z.string().optional(),
  gender:    z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string()
    .min(8, 'Tối thiểu 8 ký tự')
    .regex(/[A-Za-z]/, 'Phải có ít nhất 1 chữ cái')
    .regex(/[0-9]/, 'Phải có ít nhất 1 chữ số'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { level: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length >= 12) score++
  if (score <= 2) return { level: 1, label: 'Yếu' }
  if (score <= 3) return { level: 2, label: 'Trung bình' }
  return { level: 3, label: 'Mạnh' }
}

const STRENGTH_COLOR = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-500']
const STRENGTH_TEXT  = ['', 'text-red-500', 'text-amber-500', 'text-emerald-600']

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV: Array<{ key: Section; icon: React.ReactNode; label: string; navigate?: string }> = [
  { key: 'info',          icon: <User size={15} />,        label: 'Thông tin cá nhân' },
  { key: 'password',      icon: <Lock size={15} />,        label: 'Đổi mật khẩu' },
  { key: 'security',      icon: <Shield size={15} />,      label: 'Bảo mật tài khoản' },
  { key: 'orders',        icon: <ShoppingBag size={15} />, label: 'Đơn hàng của tôi',    navigate: '/my-orders'      },
  { key: 'payments',      icon: <CreditCard size={15} />,  label: 'Lịch sử thanh toán',  navigate: '/payment/history' },
  { key: 'favorites',     icon: <Heart size={15} />,       label: 'Tour yêu thích' },
  { key: 'notifications', icon: <Bell size={15} />,        label: 'Thông báo' },
]

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', USER: 'Khách hàng',
}
const ROLE_GRADIENT: Record<string, string> = {
  ADMIN: 'linear-gradient(135deg, #ef4444, #dc2626)',
  STAFF: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  USER:  'linear-gradient(135deg, #10b981, #059669)',
}

// ─── Input shared class ───────────────────────────────────────────────────────

const inputCls = 'w-full px-3.5 py-2.5 bg-[#f8f5ee] border-2 border-transparent rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0a1628] transition-all'

// ─── InfoSection ──────────────────────────────────────────────────────────────

function InfoSection({ user, onUpdate }: {
  user: ReturnType<typeof useAuthStore>['user']
  onUpdate: (u: any) => void
}) {
  const nameParts = (user?.name ?? '').trim().split(/\s+/)
  const lastName  = nameParts.pop() ?? ''
  const firstName = nameParts.join(' ')

  const [birthPicker, setBirthPicker] = useState<Date | null>(null)

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName, lastName, phone: user?.phone ?? '', birthDate: '', gender: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      const name = `${data.firstName} ${data.lastName}`.trim()
      return api.put('/profile', { name, phone: data.phone, birthDate: data.birthDate, gender: data.gender }).then(r => r.data)
    },
    onSuccess: data => { onUpdate(data); toast.success('Cập nhật thông tin thành công!') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Không thể cập nhật thông tin'),
  })

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">Thông tin cá nhân</h2>
      <p className="text-sm text-gray-400 mb-7">Cập nhật thông tin tài khoản của bạn</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-gray-700">Họ</FormLabel>
                <FormControl><input className={inputCls} placeholder="Nguyễn" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-gray-700">Tên</FormLabel>
                <FormControl><input className={inputCls} placeholder="Văn A" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Email</label>
            <div className="relative">
              <input value={user?.email ?? ''} readOnly
                className="w-full px-3.5 py-2.5 bg-gray-100 border-2 border-transparent rounded text-sm text-gray-400 cursor-not-allowed" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                Không thể thay đổi
              </span>
            </div>
          </div>

          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold text-gray-700">Số điện thoại</FormLabel>
              <FormControl><input className={inputCls} placeholder="0912 345 678" type="tel" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="birthDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-gray-700">Ngày sinh</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={birthPicker}
                    onChange={d => { setBirthPicker(d); field.onChange(d ? dayjs(d).format('YYYY-MM-DD') : '') }}
                    maxDate={new Date()}
                    showYearDropdown
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    className={inputCls}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-gray-700">Giới tính</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="rounded border-2 border-transparent bg-[#f8f5ee] focus:border-[#0a1628]">
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <button type="submit" disabled={mutation.isPending}
            className="px-8 py-3 rounded text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}>
            {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </Form>
    </div>
  )
}

// ─── PasswordSection ──────────────────────────────────────────────────────────

function PasswordSection() {
  const [show, setShow] = useState({ current: false, new: false, confirm: false })

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const watchNew = form.watch('newPassword')
  const strength = getStrength(watchNew)

  const mutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post('/profile/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword }).then(r => r.data),
    onSuccess: () => { toast.success('Đổi mật khẩu thành công!'); form.reset() },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Mật khẩu hiện tại không đúng'),
  })

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">Đổi mật khẩu</h2>
      <p className="text-sm text-gray-400 mb-7">Bảo mật tài khoản của bạn</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5 max-w-md">

          {[
            { name: 'currentPassword' as const, label: 'Mật khẩu hiện tại', key: 'current' as const },
            { name: 'newPassword'     as const, label: 'Mật khẩu mới',       key: 'new'     as const },
            { name: 'confirmPassword' as const, label: 'Xác nhận mật khẩu',  key: 'confirm' as const },
          ].map(({ name, label, key }) => (
            <FormField key={name} control={form.control} name={name} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-gray-700">{label}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <input {...field} type={show[key] ? 'text' : 'password'} placeholder="••••••••"
                      className={`${inputCls} pr-11`} />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0a1628] transition-colors">
                      {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                {name === 'newPassword' && watchNew && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= strength.level ? STRENGTH_COLOR[strength.level] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${STRENGTH_TEXT[strength.level]}`}>
                      Độ mạnh: {strength.label}
                    </p>
                  </div>
                )}
              </FormItem>
            )} />
          ))}

          <button type="submit" disabled={mutation.isPending}
            className="px-8 py-3 rounded text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}>
            {mutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </Form>

      <div className="mt-8 rounded p-5 max-w-md" style={{ background: 'rgba(10,22,40,0.05)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Shield size={12} style={{ color: '#0a1628' }} /> Mẹo bảo mật
        </p>
        <ul className="space-y-2">
          {[
            'Dùng ít nhất 8 ký tự gồm chữ hoa, chữ thường và số',
            'Không dùng lại mật khẩu từ tài khoản khác',
            'Không chia sẻ mật khẩu với bất kỳ ai',
            'Thay đổi mật khẩu định kỳ 3–6 tháng một lần',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: '#0a1628' }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── SecuritySection ──────────────────────────────────────────────────────────

function SecuritySection() {
  const { user, setUser } = useAuthStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [otpValue, setOtpValue]     = useState('')
  const [otpError, setOtpError]     = useState('')

  const sendOtpMutation = useMutation({
    mutationFn: () => api.post('/send-otp').then((r: any) => r.data),
    onSuccess: () => { setDialogOpen(true); setOtpValue(''); setOtpError(''); toast.success('Mã OTP đã gửi về email của bạn') },
    onError: (err: any) => toast.error(err?.message ?? 'Không thể gửi mã OTP'),
  })

  const verifyOtpMutation = useMutation({
    mutationFn: (otp: string) => api.post('/verify-otp', { otp }).then((r: any) => r.data),
    onSuccess: () => {
      if (user) setUser({ ...user, isAccountVerified: true })
      setDialogOpen(false)
      toast.success('Email đã được xác minh thành công!')
    },
    onError: (err: any) => setOtpError(err?.message ?? 'Mã OTP không đúng hoặc đã hết hạn'),
  })

  const handleVerify = () => {
    if (!otpValue.trim()) { setOtpError('Vui lòng nhập mã OTP'); return }
    setOtpError('')
    verifyOtpMutation.mutate(otpValue)
  }

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">Bảo mật tài khoản</h2>
      <p className="text-sm text-gray-400 mb-7">Quản lý xác minh và bảo mật tài khoản của bạn</p>

      {!user?.isAccountVerified ? (
        <div className="flex items-start gap-4 rounded p-5 mb-6 border border-amber-200"
          style={{ background: 'rgba(245,158,11,0.06)' }}>
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">Email chưa xác minh – tài khoản bị giới hạn tính năng</p>
            <p className="text-xs text-amber-600 mt-0.5">Xác minh email để mở khóa đầy đủ các tính năng của tài khoản</p>
          </div>
          <button
            onClick={() => sendOtpMutation.mutate()}
            disabled={sendOtpMutation.isPending}
            className="shrink-0 text-xs font-bold px-4 py-2 rounded text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {sendOtpMutation.isPending ? '...' : 'Xác minh ngay'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded p-5 mb-6 border border-emerald-200"
          style={{ background: 'rgba(16,185,129,0.06)' }}>
          <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
          <div>
            <p className="text-sm font-bold text-emerald-800">Email đã được xác minh</p>
            <p className="text-xs text-emerald-600 mt-0.5">{user?.email}</p>
          </div>
        </div>
      )}

      <div className="rounded p-5 max-w-md" style={{ background: 'rgba(10,22,40,0.05)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Shield size={12} style={{ color: '#0a1628' }} /> Mẹo bảo mật
        </p>
        <ul className="space-y-2">
          {[
            'Xác minh email giúp bảo vệ tài khoản khỏi bị xâm phạm',
            'Thay đổi mật khẩu định kỳ để tăng cường bảo mật',
            'Không chia sẻ thông tin đăng nhập với bất kỳ ai',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: '#0a1628' }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác minh email</DialogTitle>
            <DialogDescription>
              Nhập mã OTP 6 chữ số đã gửi về{' '}
              <span className="font-bold text-gray-900">{user?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <input
              type="text" inputMode="numeric" placeholder="123456" maxLength={6}
              value={otpValue} autoFocus
              onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError('') }}
              className={`block w-full px-4 py-3.5 bg-[#f8f5ee] border-2 rounded text-base font-mono text-center tracking-[0.5em] focus:outline-none transition-all ${
                otpError ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#0a1628]'
              }`}
            />
            {otpError && (
              <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <Info size={12} /> {otpError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleVerify} disabled={verifyOtpMutation.isPending || !otpValue}
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
              {verifyOtpMutation.isPending ? 'Đang xác minh...' : 'Xác minh'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Placeholder ──────────────────────────────────────────────────────────────

function PlaceholderSection({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string
}) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-5 text-gray-400"
        style={{ background: 'rgba(10,22,40,0.07)' }}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate  = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const [section, setSection] = useState<Section>('info')

  const fileRef = useRef<HTMLInputElement>(null)
  const [preview,     setPreview]     = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading,   setUploading]   = useState(false)

  const avatarSrc = preview
    ?? (user?.avatar ? resolveBase64Image(user.avatar, '') : null)
    ?? null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return }
    setPendingFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      const res = await api.patch('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (user) setUser({ ...user, avatar: res.data?.avatar ?? user.avatar })
      setPendingFile(null)
      toast.success('Cập nhật ảnh đại diện thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không thể tải ảnh lên')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleLogout = async () => {
    try { await api.post('/logout') } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const handleNavClick = (item: typeof NAV[number]) => {
    if (item.navigate) { navigate(item.navigate); return }
    setSection(item.key)
  }

  if (!user) return null

  const initials = user.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <Navbar />

      {/* Hero banner */}
      <div
        className="h-56 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0a1628 60%, #0a1929 100%)' }}
      >
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-[#f8f5ee]"
          style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
        {/* decorative blobs */}
        <div className="absolute top-4 right-20 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: '#c9a84c' }} />
        <div className="absolute bottom-4 left-10 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: '#1a3a5c' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-7 -mt-16 relative z-10">

          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="rounded-sm bg-white border border-gray-100 overflow-hidden"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

              {/* Avatar */}
              <div className="flex flex-col items-center pt-8 pb-6 px-5">
                <div className="relative group mb-5">
                  <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', background: 'rgba(10,22,40,0.1)' }}>
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black" style={{ color: '#0a1628' }}>{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/45 flex items-center justify-center transition-all duration-200">
                    <Camera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </div>

                {pendingFile && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={handleAvatarUpload} disabled={uploading}
                      className="text-xs font-bold px-4 py-1.5 rounded text-white disabled:opacity-60 transition-all"
                      style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
                      {uploading ? 'Đang tải...' : 'Lưu ảnh'}
                    </button>
                    <button onClick={() => { setPreview(null); setPendingFile(null) }}
                      className="text-xs font-bold px-4 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                      Hủy
                    </button>
                  </div>
                )}

                <h3 className="font-black text-lg text-gray-900 text-center leading-tight">{user.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5 truncate max-w-full">{user.email}</p>
                {user.roleName && (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white"
                    style={{ background: ROLE_GRADIENT[user.roleName] ?? ROLE_GRADIENT.USER }}>
                    <BadgeCheck size={11} />
                    {ROLE_LABEL[user.roleName] ?? user.roleName}
                  </span>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* Nav */}
              <nav className="p-3 space-y-0.5">
                {NAV.map(item => {
                  const isActive = section === item.key && !item.navigate
                  return (
                    <button key={item.key} onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all text-left ${
                        isActive ? 'text-white' : 'text-gray-600 hover:bg-[#f8f5ee] hover:text-gray-900'
                      }`}
                      style={isActive ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' } : {}}>
                      <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              <div className="border-t border-gray-100 mx-3" />

              <div className="p-3">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={15} /> Đăng xuất
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-sm bg-white border border-gray-100 p-7 sm:p-9 min-h-96"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              {section === 'info'      && <InfoSection user={user} onUpdate={d => { if (d && user) setUser({ ...user, name: d.name ?? user.name, phone: d.phone ?? user.phone }) }} />}
              {section === 'password'  && <PasswordSection />}
              {section === 'security'  && <SecuritySection />}
              {section === 'favorites' && <PlaceholderSection icon={<Heart size={28} />} title="Tour yêu thích" description="Các tour bạn đã yêu thích sẽ hiển thị ở đây" />}
              {section === 'notifications' && <PlaceholderSection icon={<Bell size={28} />} title="Thông báo" description="Bạn chưa có thông báo nào mới" />}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
