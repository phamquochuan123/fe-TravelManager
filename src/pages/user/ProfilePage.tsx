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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { cn, resolveBase64Image } from '@/lib/utils'
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
  { key: 'info',          icon: <User size={16} />,        label: 'Thông tin cá nhân' },
  { key: 'password',      icon: <Lock size={16} />,        label: 'Đổi mật khẩu' },
  { key: 'security',      icon: <Shield size={16} />,      label: 'Bảo mật tài khoản' },
  { key: 'orders',        icon: <ShoppingBag size={16} />, label: 'Đơn hàng của tôi',      navigate: '/my-orders'       },
  { key: 'payments',      icon: <CreditCard size={16} />,  label: 'Lịch sử thanh toán',   navigate: '/payment/history'  },
  { key: 'favorites',     icon: <Heart size={16} />,       label: 'Tour yêu thích' },
  { key: 'notifications', icon: <Bell size={16} />,        label: 'Thông báo' },
]

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', USER: 'Khách hàng',
}

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
    defaultValues: {
      firstName,
      lastName,
      phone:     user?.phone ?? '',
      birthDate: '',
      gender:    '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      const name = `${data.firstName} ${data.lastName}`.trim()
      return api.put('/profile', { name, phone: data.phone, birthDate: data.birthDate, gender: data.gender })
        .then(r => r.data)
    },
    onSuccess: (data) => {
      onUpdate(data)
      toast.success('Cập nhật thông tin thành công!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Không thể cập nhật thông tin')
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Thông tin cá nhân</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Cập nhật thông tin tài khoản của bạn</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem>
                <FormLabel>Họ</FormLabel>
                <FormControl><Input {...field} placeholder="Nguyễn" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FormLabel>Tên</FormLabel>
                <FormControl><Input {...field} placeholder="Văn A" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Email readonly */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Email
            </label>
            <div className="relative">
              <Input value={user?.email ?? ''} readOnly className="bg-muted pr-36 text-muted-foreground" />
              <Badge className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-muted-foreground/10 text-muted-foreground border-0">
                Không thể thay đổi
              </Badge>
            </div>
          </div>

          {/* Phone */}
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl><Input {...field} placeholder="0912 345 678" type="tel" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Birth date + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="birthDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày sinh</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={birthPicker}
                    onChange={d => {
                      setBirthPicker(d)
                      field.onChange(d ? dayjs(d).format('YYYY-MM-DD') : '')
                    }}
                    maxDate={new Date()}
                    showYearDropdown
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Giới tính</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
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

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
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
      api.post('/profile/change-password', {
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      }).then(r => r.data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      form.reset()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Mật khẩu hiện tại không đúng')
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Đổi mật khẩu</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Bảo mật tài khoản của bạn</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5 max-w-md">

          {/* Current password */}
          <FormField control={form.control} name="currentPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu hiện tại</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={show.current ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* New password */}
          <FormField control={form.control} name="newPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu mới</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={show.new ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />

              {/* Strength bar */}
              {watchNew && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors duration-300',
                          i <= strength.level ? STRENGTH_COLOR[strength.level] : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn('text-xs font-medium', STRENGTH_TEXT[strength.level])}>
                    Độ mạnh: {strength.label}
                  </p>
                </div>
              )}
            </FormItem>
          )} />

          {/* Confirm password */}
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={show.confirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
          >
            {mutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </form>
      </Form>

      {/* Security tips */}
      <div className="mt-8 bg-muted/50 rounded-xl p-4 max-w-md">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Shield size={13} /> Mẹo bảo mật
        </p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {[
            'Dùng ít nhất 8 ký tự gồm chữ hoa, chữ thường và số',
            'Không dùng lại mật khẩu từ tài khoản khác',
            'Không chia sẻ mật khẩu với bất kỳ ai',
            'Thay đổi mật khẩu định kỳ 3–6 tháng một lần',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <CheckCircle2 size={12} className="text-primary shrink-0 mt-0.5" />
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
    onSuccess: () => {
      setDialogOpen(true)
      setOtpValue('')
      setOtpError('')
      toast.success('Mã OTP đã gửi về email của bạn')
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Không thể gửi mã OTP')
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: (otp: string) => api.post('/verify-otp', { otp }).then((r: any) => r.data),
    onSuccess: () => {
      if (user) setUser({ ...user, isAccountVerified: true })
      setDialogOpen(false)
      toast.success('Email đã được xác minh thành công!')
    },
    onError: (err: any) => {
      setOtpError(err?.message ?? 'Mã OTP không đúng hoặc đã hết hạn')
    },
  })

  const handleVerify = () => {
    if (!otpValue.trim()) { setOtpError('Vui lòng nhập mã OTP'); return }
    setOtpError('')
    verifyOtpMutation.mutate(otpValue)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Bảo mật tài khoản</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý xác minh và bảo mật tài khoản của bạn</p>
      </div>

      {/* Verification status banner */}
      {!user?.isAccountVerified ? (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Email chưa xác minh – tài khoản bị giới hạn tính năng
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Xác minh email để mở khóa đầy đủ các tính năng của tài khoản
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => sendOtpMutation.mutate()}
            disabled={sendOtpMutation.isPending}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-0 text-xs h-8"
          >
            {sendOtpMutation.isPending && (
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
            )}
            Xác minh ngay
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Email đã được xác minh</p>
            <p className="text-xs text-emerald-600 mt-0.5">{user?.email}</p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-muted/50 rounded-xl p-4 max-w-md">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Shield size={13} /> Mẹo bảo mật
        </p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {[
            'Xác minh email giúp bảo vệ tài khoản khỏi bị xâm phạm',
            'Thay đổi mật khẩu định kỳ để tăng cường bảo mật',
            'Không chia sẻ thông tin đăng nhập với bất kỳ ai',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <CheckCircle2 size={12} className="text-primary shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* OTP Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác minh email</DialogTitle>
            <DialogDescription>
              Nhập mã OTP 6 chữ số đã gửi về{' '}
              <span className="font-semibold text-foreground">{user?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              value={otpValue}
              autoFocus
              onChange={e => {
                setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))
                setOtpError('')
              }}
              className={`block w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-base font-mono
                         text-center tracking-[0.5em] focus:outline-none focus:ring-2 transition-all
                         ${otpError
                           ? 'border-red-400 focus:border-red-500 focus:ring-red-50'
                           : 'border-transparent focus:border-primary focus:ring-primary/10'}`}
            />
            {otpError && (
              <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <Info size={12} /> {otpError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleVerify}
              disabled={verifyOtpMutation.isPending || !otpValue}
            >
              {verifyOtpMutation.isPending ? 'Đang xác minh...' : 'Xác minh'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Placeholder sections ─────────────────────────────────────────────────────

function PlaceholderSection({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string
}) {
  return (
    <div className="text-center py-16">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
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
      const res = await api.patch('/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Banner */}
      <div
        className="h-52"
        style={{ background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)' }}
      />

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Card pulls up over banner */}
        <div className="flex flex-col lg:flex-row gap-6 -mt-20 relative z-10">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Avatar section */}
              <div className="flex flex-col items-center pt-8 pb-5 px-5">
                <div className="relative group mb-4">
                  {/* Avatar circle */}
                  <div className="size-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-primary/10 flex items-center justify-center">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">{initials}</span>
                    )}
                  </div>

                  {/* Camera overlay */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200"
                  >
                    <Camera
                      size={22}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Upload preview action */}
                {pendingFile && (
                  <div className="flex gap-2 mb-3">
                    <Button size="sm" onClick={handleAvatarUpload} disabled={uploading} className="text-xs h-7">
                      {uploading ? 'Đang tải...' : 'Lưu ảnh'}
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="text-xs h-7"
                      onClick={() => { setPreview(null); setPendingFile(null) }}
                    >
                      Hủy
                    </Button>
                  </div>
                )}

                <h3 className="font-bold text-lg text-center leading-tight">{user.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>

                {user.roleName && (
                  <Badge className="mt-2 text-xs" variant="secondary">
                    <BadgeCheck size={11} className="mr-1" />
                    {ROLE_LABEL[user.roleName] ?? user.roleName}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Nav */}
              <nav className="p-3 space-y-0.5">
                {NAV.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                      section === item.key && !item.navigate
                        ? 'bg-primary/5 text-primary border-l-2 border-primary rounded-l-none'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span className={section === item.key && !item.navigate ? 'text-primary' : 'text-muted-foreground'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </nav>

              <Separator />

              <div className="p-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 min-h-96 animate-in fade-in duration-300">
              {section === 'info' && (
                <InfoSection
                  user={user}
                  onUpdate={(data) => {
                    if (data && user) setUser({ ...user, name: data.name ?? user.name, phone: data.phone ?? user.phone })
                  }}
                />
              )}
              {section === 'password'  && <PasswordSection />}
              {section === 'security'  && <SecuritySection />}
              {section === 'favorites' && (
                <PlaceholderSection
                  icon={<Heart size={28} />}
                  title="Tour yêu thích"
                  description="Các tour bạn đã yêu thích sẽ hiển thị ở đây"
                />
              )}
              {section === 'notifications' && (
                <PlaceholderSection
                  icon={<Bell size={28} />}
                  title="Thông báo"
                  description="Bạn chưa có thông báo nào mới"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
