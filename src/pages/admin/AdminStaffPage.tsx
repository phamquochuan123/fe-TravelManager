import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  Search, Plus, Edit, RefreshCw, Eye, EyeOff,
  UserCheck, UserX, Camera, Shuffle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import axiosInstance from '@/api/axiosInstance'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Staff {
  id: number
  fullName: string
  email: string
  phone?: string
  avatarUrl?: string
  createdAt: string
  active: boolean
  toursCount?: number
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number }

interface StaffForm {
  fullName: string
  email: string
  phone: string
  password: string
  sendEmail: boolean
  avatarFile?: File | null
  avatarPreview?: string
}

const EMPTY_FORM: StaffForm = {
  fullName: '', email: '', phone: '', password: '', sendEmail: false
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── StaffSheet ───────────────────────────────────────────────────────────────
function StaffSheet({
  open, onOpenChange, editTarget, onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: Staff | null
  onSaved: () => void
}) {
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!editTarget

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setForm({
          fullName: editTarget.fullName,
          email: editTarget.email,
          phone: editTarget.phone ?? '',
          password: '',
          sendEmail: false,
          avatarFile: null,
          avatarPreview: editTarget.avatarUrl
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setShowPass(false)
    }
  }, [open, editTarget])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setForm(f => ({ ...f, avatarFile: file, avatarPreview: preview }))
  }

  const set = (key: keyof StaffForm, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    if (!isEdit && !form.password.trim()) {
      toast.error('Vui lòng nhập mật khẩu')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('fullName', form.fullName)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      if (!isEdit) {
        fd.append('password', form.password)
        fd.append('sendEmail', String(form.sendEmail))
      }
      if (form.avatarFile) fd.append('avatar', form.avatarFile)

      if (isEdit) {
        await axiosInstance.put(`/admin/staff/${editTarget!.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Cập nhật nhân viên thành công')
      } else {
        await axiosInstance.post('/admin/staff', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Tạo nhân viên thành công')
      }
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle style={{ color: '#1a5276' }}>
            {isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={form.avatarPreview} />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                    {form.fullName.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow"
                  style={{ background: '#1a5276' }}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-xs text-gray-400">Nhấn biểu tượng để thay đổi ảnh</p>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-1.5">
              <Label>Họ và tên <span className="text-red-500">*</span></Label>
              <Input
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="staff@travelvn.com"
                disabled={isEdit}
              />
              {isEdit && <p className="text-xs text-gray-400">Email không thể thay đổi</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="0912 345 678"
              />
            </div>

            {/* Password - create only */}
            {!isEdit && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Mật khẩu <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="Mật khẩu mạnh..."
                        className="pr-9"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPass(p => !p)}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => { set('password', generatePassword()); setShowPass(true) }}
                      title="Tạo mật khẩu ngẫu nhiên"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Send email */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Gửi thông tin đăng nhập</p>
                    <p className="text-xs text-gray-500">Email sẽ được gửi đến nhân viên</p>
                  </div>
                  <Switch
                    checked={form.sendEmail}
                    onCheckedChange={v => set('sendEmail', v)}
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Hủy</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: '#1a5276' }}
            className="text-white"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo nhân viên'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminStaffPage() {
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Staff | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Staff | null>(null)
  const [toggleOpen, setToggleOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching } = useQuery<Page<Staff>>({
    queryKey: ['admin-staff', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter !== 'ALL') params.active = statusFilter === 'ACTIVE' ? 'true' : 'false'
      const res = await axiosInstance.get('/admin/staff', { params })
      return res.data
    }
  })

  const staff = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.patch(`/admin/staff/${id}/toggle-active`)
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      qc.invalidateQueries({ queryKey: ['admin-staff'] })
      setToggleOpen(false)
    },
    onError: () => toast.error('Cập nhật thất bại')
  })

  const handleEdit = (s: Staff) => { setEditTarget(s); setSheetOpen(true) }
  const handleToggle = (s: Staff) => { setToggleTarget(s); setToggleOpen(true) }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a5276' }}>Quản lý nhân viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách tài khoản nhân viên</p>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setSheetOpen(true) }}
          style={{ background: '#1a5276' }}
          className="text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Tìm tên, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Vô hiệu hóa</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => qc.invalidateQueries({ queryKey: ['admin-staff'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nhân viên</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Liên hệ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Tours phụ trách</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tạo</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy nhân viên</p>
                  </td>
                </tr>
              ) : staff.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={s.avatarUrl} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {s.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">{s.fullName}</p>
                        <p className="text-xs text-gray-400">#{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{s.email}</p>
                    {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-blue-600">{s.toursCount ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {dayjs(s.createdAt).format('DD/MM/YYYY')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.active ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Hoạt động</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200">Vô hiệu</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(s)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-8 h-8 ${s.active
                          ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }`}
                        onClick={() => handleToggle(s)}
                        title={s.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {s.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <Button
                    key={pg}
                    variant={pg === page ? 'default' : 'outline'}
                    size="sm"
                    style={pg === page ? { background: '#1a5276' } : undefined}
                    onClick={() => setPage(pg)}
                  >
                    {pg + 1}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet */}
      <StaffSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editTarget={editTarget}
        onSaved={() => qc.invalidateQueries({ queryKey: ['admin-staff'] })}
      />

      {/* Toggle active confirm */}
      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={toggleTarget?.active ? 'Vô hiệu hóa nhân viên' : 'Kích hoạt nhân viên'}
        description={toggleTarget?.active
          ? `Nhân viên "${toggleTarget?.fullName}" sẽ không thể đăng nhập.`
          : `Kích hoạt lại tài khoản cho "${toggleTarget?.fullName}"?`
        }
        confirmLabel={toggleTarget?.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
        variant="warning"
        loading={toggleMutation.isPending}
        onConfirm={() => toggleTarget && toggleMutation.mutate(toggleTarget.id)}
      />
    </div>
  )
}
