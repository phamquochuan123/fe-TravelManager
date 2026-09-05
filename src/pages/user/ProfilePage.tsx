import { useState, useRef, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import 'react-datepicker/dist/react-datepicker.css'
import {
  User, Lock, ShoppingBag, Heart, Bell, LogOut, Camera,
  Eye, EyeOff, Shield, CheckCircle2, Info, BadgeCheck, AlertTriangle, CreditCard,
  MapPin, Clock, Star, Trash2, Hotel, UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axiosInstance'
import { getMyFavoriteTours, toggleTourFavorite } from '@/api/tourApi'
import { getMyFavoriteHotels, toggleHotelFavorite } from '@/api/hotelApi'
import { getMyFavoriteRestaurants, toggleRestaurantFavorite } from '@/api/restaurantApi'
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
import { useAuthStore, type AuthState } from '@/stores/authStore'
import { AppContext } from '@/context/appContextObject'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'info' | 'password' | 'orders' | 'payments' | 'favorites' | 'notifications' | 'security'

interface IAppContext { logout: () => void }

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
  { key: 'favorites',     icon: <Heart size={15} />,       label: 'Yêu thích' },
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
  user: AuthState['user']
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
                    onChange={(d: Date | null) => { setBirthPicker(d); field.onChange(d ? dayjs(d).format('YYYY-MM-DD') : '') }}
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

// ─── FavoritesSection ─────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}

function FavTourGrid({ tours, onRemove }: { tours: any[]; onRemove: (id: number) => void }) {
  if (tours.length === 0) {
    return (
      <div className="text-center py-14">
        <Heart size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-400">Chưa có tour yêu thích nào</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tours.map((tour: any) => {
        const img = tour.images?.[0]
        const rawImg = typeof img === 'string' ? img : img?.photo
        const imgSrc = resolveBase64Image(rawImg, 'https://placehold.co/400x200?text=Tour')
        return (
          <div key={tour.id} className="group rounded overflow-hidden bg-white border border-gray-100 flex flex-col"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Link to={`/tours/${tour.id}`} className="relative h-40 overflow-hidden bg-gray-100 shrink-0 block">
              <img src={imgSrc} alt={tour.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
              {tour.tourType && (
                <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${tour.tourType === 'DOMESTIC' ? 'bg-[#0a1628]' : 'bg-violet-600'}`}>
                  {tour.tourType === 'DOMESTIC' ? 'Trong nước' : 'Nước ngoài'}
                </span>
              )}
              {tour.destination && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <MapPin size={11} className="text-white/80" />
                  <span className="text-white/80 text-xs font-semibold">{tour.destination}</span>
                </div>
              )}
            </Link>
            <div className="p-4 flex flex-col flex-1">
              <Link to={`/tours/${tour.id}`} className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#0a1628] transition-colors mb-2">{tour.name}</Link>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                {tour.durationDays > 0 && <span className="flex items-center gap-1"><Clock size={11} />{tour.durationDays} ngày</span>}
                {(tour.averageRating ?? 0) > 0 && (
                  <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" />{Number(tour.averageRating).toFixed(1)}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Giá từ</p>
                  <p className="font-black text-base leading-none" style={{ color: '#c9a84c' }}>{fmt(Number(tour.priceAdult))}</p>
                </div>
                <button onClick={() => onRemove(tour.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
                  <Trash2 size={13} /> Bỏ lưu
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const HOTEL_CITY_PHOTOS: Record<string, string[]> = {
  'nha trang': ['https://images.unsplash.com/photo-1540541338537-71beef4c41ba?w=600&q=80','https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600&q=80','https://images.unsplash.com/photo-1551882547-ff40c242b0e0?w=600&q=80'],
  'hà nội':    ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  'hồ chí minh':['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  'đà nẵng':   ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80','https://images.unsplash.com/photo-1540541338537-71beef4c41ba?w=600&q=80'],
  'phú quốc':  ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80','https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&q=80'],
  'đà lạt':    ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80','https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80'],
}
const DEFAULT_HOTEL_PHOTOS = ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80','https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80','https://images.unsplash.com/photo-1551882547-ff40c242b0e0?w=600&q=80']

function hotelFallbackImg(hotel: any): string {
  const cityKey = (hotel.city ?? '').toLowerCase().trim()
  const pool = Object.entries(HOTEL_CITY_PHOTOS).find(([key]) => cityKey.includes(key))?.[1] ?? DEFAULT_HOTEL_PHOTOS
  return pool[hotel.id % pool.length]
}

function getHotelImg(hotel: any): string {
  if (hotel.photo) return resolveBase64Image(hotel.photo, hotelFallbackImg(hotel))
  return hotelFallbackImg(hotel)
}

function FavHotelGrid({ hotels, onRemove }: { hotels: any[]; onRemove: (id: number) => void }) {
  if (hotels.length === 0) {
    return (
      <div className="text-center py-14">
        <Hotel size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-400">Chưa có khách sạn yêu thích nào</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {hotels.map((hotel: any) => {
          const imgSrc = getHotelImg(hotel)
        return (
          <div key={hotel.id} className="group rounded overflow-hidden bg-white border border-gray-100 flex flex-col"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Link to={`/hotels/${hotel.id}`} className="relative h-40 overflow-hidden bg-gray-100 shrink-0 block">
              <img src={imgSrc} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
              {hotel.starRating > 0 && (
                <div className="absolute top-2 left-2 flex items-center gap-0.5">
                  {Array.from({ length: hotel.starRating }).map((_: unknown, i: number) => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
              {hotel.city && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <MapPin size={11} className="text-white/80" />
                  <span className="text-white/80 text-xs font-semibold">{hotel.city}</span>
                </div>
              )}
            </Link>
            <div className="p-4 flex flex-col flex-1">
              <Link to={`/hotels/${hotel.id}`} className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#0a1628] transition-colors mb-2">{hotel.name}</Link>
              {hotel.address && <p className="text-xs text-gray-400 line-clamp-1 mb-3">{hotel.address}</p>}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{hotel.hotelType ?? 'Khách sạn'}</span>
                <button onClick={() => onRemove(hotel.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
                  <Trash2 size={13} /> Bỏ lưu
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const CUISINE_PHOTO_POOL: Record<string, string[]> = {
  VIETNAMESE: ['https://images.unsplash.com/photo-1583394293214-de4ac99970b8?w=600&q=80','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80'],
  ASIAN:      ['https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=600&q=80','https://images.unsplash.com/photo-1540189549336-e6e99eff19e1?w=600&q=80'],
  WESTERN:    ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80','https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80'],
  SEAFOOD:    ['https://images.unsplash.com/photo-1565557623262-b51531de0193?w=600&q=80','https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80'],
  BBQ:        ['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80','https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80'],
  VEGETARIAN: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80','https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80'],
  FUSION:     ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80','https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'],
  OTHER:      ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80'],
}
const DEFAULT_RESTAURANT_PHOTOS = ['https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80','https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80']

function getRestaurantImg(r: any): string {
  if (r.photo) { const s = resolveBase64Image(r.photo, ''); if (s) return s }
  const pool = CUISINE_PHOTO_POOL[r.cuisineType ?? '']
  if (pool?.length) return pool[r.id % pool.length]
  return DEFAULT_RESTAURANT_PHOTOS[r.id % DEFAULT_RESTAURANT_PHOTOS.length]
}

function FavRestaurantGrid({ restaurants, onRemove }: { restaurants: any[]; onRemove: (id: number) => void }) {
  if (restaurants.length === 0) {
    return (
      <div className="text-center py-14">
        <UtensilsCrossed size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-400">Chưa có nhà hàng yêu thích nào</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {restaurants.map((r: any) => (
        <div key={r.id} className="group rounded overflow-hidden bg-white border border-gray-100 flex flex-col"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <Link to={`/restaurants/${r.id}`} className="relative h-40 overflow-hidden bg-gray-100 shrink-0 block">
            <img src={getRestaurantImg(r)} alt={r.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
            {r.cuisineType && (
              <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full text-white bg-orange-500">
                {r.cuisineType === 'VIETNAMESE' ? 'Việt Nam' : r.cuisineType === 'SEAFOOD' ? 'Hải sản' : r.cuisineType === 'WESTERN' ? 'Âu Mỹ' : r.cuisineType === 'ASIAN' ? 'Châu Á' : r.cuisineType === 'BBQ' ? 'BBQ' : r.cuisineType === 'VEGETARIAN' ? 'Chay' : r.cuisineType === 'FUSION' ? 'Fusion' : 'Khác'}
              </span>
            )}
            {r.city && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <MapPin size={11} className="text-white/80" />
                <span className="text-white/80 text-xs font-semibold">{r.city}</span>
              </div>
            )}
          </Link>
          <div className="p-4 flex flex-col flex-1">
            <Link to={`/restaurants/${r.id}`}
              className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#0a1628] transition-colors mb-2">{r.name}</Link>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              {r.address && <span className="flex items-center gap-1 line-clamp-1"><MapPin size={11} />{r.address}</span>}
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">{r.priceRange ?? '—'}</span>
              <button onClick={() => onRemove(r.id)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
                <Trash2 size={13} /> Bỏ lưu
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FavoritesSection() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'tours' | 'hotels' | 'restaurants'>('tours')
  const removingRef = useState<Set<number>>(() => new Set())[0]

  const { data: tours = [], isLoading: loadingTours } = useQuery<any[]>({
    queryKey: ['my-favorite-tours'],
    queryFn: getMyFavoriteTours,
    staleTime: 30 * 1000,
  })

  const { data: hotels = [], isLoading: loadingHotels } = useQuery<any[]>({
    queryKey: ['my-favorite-hotels'],
    queryFn: getMyFavoriteHotels,
    staleTime: 30 * 1000,
  })

  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery<any[]>({
    queryKey: ['my-favorite-restaurants'],
    queryFn: getMyFavoriteRestaurants,
    staleTime: 30 * 1000,
  })

  const removeTour = async (id: number) => {
    if (removingRef.has(id)) return
    removingRef.add(id)
    try {
      await toggleTourFavorite(id)
      qc.invalidateQueries({ queryKey: ['my-favorite-tours'] })
      toast.success('Đã bỏ khỏi danh sách yêu thích')
    } finally { removingRef.delete(id) }
  }

  const removeHotel = async (id: number) => {
    if (removingRef.has(id)) return
    removingRef.add(id)
    try {
      await toggleHotelFavorite(id)
      qc.invalidateQueries({ queryKey: ['my-favorite-hotels'] })
      toast.success('Đã bỏ khỏi danh sách yêu thích')
    } finally { removingRef.delete(id) }
  }

  const removeRestaurant = async (id: number) => {
    if (removingRef.has(id)) return
    removingRef.add(id)
    try {
      await toggleRestaurantFavorite(id)
      qc.invalidateQueries({ queryKey: ['my-favorite-restaurants'] })
      toast.success('Đã bỏ khỏi danh sách yêu thích')
    } finally { removingRef.delete(id) }
  }

  const isLoading = tab === 'tours' ? loadingTours : tab === 'hotels' ? loadingHotels : loadingRestaurants

  return (
    <div>
      <h2 className="font-bold text-gray-900 text-lg mb-5">Yêu thích</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        <button
          onClick={() => setTab('tours')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'tours' ? 'border-[#c9a84c] text-[#0a1628]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}>
          <Heart size={14} /> Tour
          {tours.length > 0 && <span className="ml-1 text-xs bg-[#c9a84c] text-white rounded-full px-1.5 py-0.5 leading-none">{tours.length}</span>}
        </button>
        <button
          onClick={() => setTab('hotels')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'hotels' ? 'border-[#c9a84c] text-[#0a1628]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}>
          <Hotel size={14} /> Khách sạn
          {hotels.length > 0 && <span className="ml-1 text-xs bg-[#c9a84c] text-white rounded-full px-1.5 py-0.5 leading-none">{hotels.length}</span>}
        </button>
        <button
          onClick={() => setTab('restaurants')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'restaurants' ? 'border-[#c9a84c] text-[#0a1628]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}>
          <UtensilsCrossed size={14} /> Nhà hàng
          {restaurants.length > 0 && <span className="ml-1 text-xs bg-[#c9a84c] text-white rounded-full px-1.5 py-0.5 leading-none">{restaurants.length}</span>}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded overflow-hidden bg-gray-100 animate-pulse h-52" />)}
        </div>
      ) : tab === 'tours' ? (
        <FavTourGrid tours={tours} onRemove={removeTour} />
      ) : tab === 'hotels' ? (
        <FavHotelGrid hotels={hotels} onRemove={removeHotel} />
      ) : (
        <FavRestaurantGrid restaurants={restaurants} onRemove={removeRestaurant} />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate  = useNavigate()
  const { user, setUser } = useAuthStore()
  const { logout } = useContext(AppContext) as IAppContext
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
    window.location.href = '/login'
  }

  const handleNavClick = (item: typeof NAV[number]) => {
    if (item.navigate) { navigate(item.navigate); return }
    setSection(item.key)
  }

  if (!user) return null

  const initials = user.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'var(--font-sans)' }}>
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
              {section === 'favorites' && <FavoritesSection />}
              {section === 'notifications' && <PlaceholderSection icon={<Bell size={28} />} title="Thông báo" description="Bạn chưa có thông báo nào mới" />}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
