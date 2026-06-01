import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  Search, Lock, Unlock, Eye, RefreshCw, Users,
  Phone, Mail, Calendar, ShieldOff, Shield, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import axiosInstance from '@/api/axiosInstance'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Customer {
  id: number
  fullName: string
  email: string
  phone?: string
  avatarUrl?: string
  createdAt: string
  status: 'ACTIVE' | 'LOCKED'
  bookingsCount?: number
  totalSpent?: number
  lockReason?: string
  lockedUntil?: string | null
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number }

// ─── LockDialog ──────────────────────────────────────────────────────────────
function LockDialog({
  open, onOpenChange, customer, onConfirm, loading
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  customer: Customer | null
  onConfirm: (reason: string, type: 'TEMPORARY' | 'PERMANENT', days?: number) => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')
  const [lockType, setLockType] = useState<'TEMPORARY' | 'PERMANENT'>('TEMPORARY')
  const [days, setDays] = useState(7)

  useEffect(() => {
    if (open) { setReason(''); setLockType('TEMPORARY'); setDays(7) }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldOff className="w-5 h-5" />
            Khóa tài khoản
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {customer && (
            <div className="flex items-center gap-3 p-3 bg-[#f8f5ee] rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={customer.avatarUrl} />
                <AvatarFallback>{customer.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{customer.fullName}</p>
                <p className="text-xs text-gray-500">{customer.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Lý do khóa <span className="text-red-500">*</span></Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do khóa tài khoản..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Loại khóa</Label>
            <div className="flex gap-3">
              {(['TEMPORARY', 'PERMANENT'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="lockType"
                    value={t}
                    checked={lockType === t}
                    onChange={() => setLockType(t)}
                    className="accent-red-600"
                  />
                  <span className="text-sm">{t === 'TEMPORARY' ? 'Tạm thời' : 'Vĩnh viễn'}</span>
                </label>
              ))}
            </div>
          </div>

          {lockType === 'TEMPORARY' && (
            <div className="space-y-2">
              <Label>Số ngày khóa</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={e => setDays(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
          <Button
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason, lockType, lockType === 'TEMPORARY' ? days : undefined)}
            style={{ background: '#dc2626' }}
            className="text-white"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
            Khóa tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── CustomerDetailSheet ─────────────────────────────────────────────────────
function CustomerDetailSheet({
  open, onOpenChange, customer, onLock, onUnlock
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  customer: Customer | null
  onLock: (c: Customer) => void
  onUnlock: (c: Customer) => void
}) {
  if (!customer) return null

  const isLocked = customer.status === 'LOCKED'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Chi tiết khách hàng</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 py-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={customer.avatarUrl} />
                <AvatarFallback className="text-2xl">{customer.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{customer.fullName}</h3>
                <Badge className={isLocked
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-green-100 text-green-700 border-green-200'
                }>
                  {isLocked ? 'Đã khóa' : 'Hoạt động'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Contact info */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Thông tin liên hệ</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Tham gia {dayjs(customer.createdAt).format('DD/MM/YYYY')}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Thống kê</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{customer.bookingsCount ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Đơn đặt</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold" className="text-accent">
                    {((customer.totalSpent ?? 0) / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Chi tiêu (VNĐ)</p>
                </div>
              </div>
            </div>

            {/* Lock info */}
            {isLocked && customer.lockReason && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-red-500 uppercase tracking-wide flex items-center gap-2">
                    <ShieldOff className="w-4 h-4" /> Thông tin khóa
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                    <p className="text-sm text-red-700">{customer.lockReason}</p>
                    {customer.lockedUntil && (
                      <p className="text-xs text-red-500">
                        Đến: {dayjs(customer.lockedUntil).format('DD/MM/YYYY HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action footer */}
        <div className="px-6 py-4 border-t flex gap-2">
          {isLocked ? (
            <Button
              className="flex-1"
              className="bg-primary"
              onClick={() => onUnlock(customer)}
            >
              <Shield className="w-4 h-4 mr-2" /> Mở khóa
            </Button>
          ) : (
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onLock(customer)}
            >
              <ShieldOff className="w-4 h-4 mr-2" /> Khóa tài khoản
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  // Dialogs/sheets state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null)
  const [lockOpen, setLockOpen] = useState(false)
  const [lockTarget, setLockTarget] = useState<Customer | null>(null)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [unlockTarget, setUnlockTarget] = useState<Customer | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Query ──
  const { data, isLoading, isFetching } = useQuery<Page<Customer>>({
    queryKey: ['admin-customers', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await axiosInstance.get('/admin/customers', { params })
      return res.data
    }
  })

  const customers = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  // ── Lock mutation ──
  const lockMutation = useMutation({
    mutationFn: async ({ id, reason, lockType, days }: { id: number; reason: string; lockType: string; days?: number }) => {
      await axiosInstance.patch(`/admin/customers/${id}/lock`, { reason, lockType, days })
    },
    onSuccess: () => {
      toast.success('Đã khóa tài khoản')
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
      setLockOpen(false)
      setDetailOpen(false)
    },
    onError: () => toast.error('Không thể khóa tài khoản')
  })

  // ── Unlock mutation ──
  const unlockMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.patch(`/admin/customers/${id}/unlock`)
    },
    onSuccess: () => {
      toast.success('Đã mở khóa tài khoản')
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
      setUnlockOpen(false)
      setDetailOpen(false)
    },
    onError: () => toast.error('Không thể mở khóa tài khoản')
  })

  const handleLock = (c: Customer) => { setLockTarget(c); setLockOpen(true) }
  const handleUnlock = (c: Customer) => { setUnlockTarget(c); setUnlockOpen(true) }
  const handleView = (c: Customer) => { setSelectedUser(c); setDetailOpen(true) }

  const statusBadge = (status: string) => {
    if (status === 'LOCKED') return <Badge className="bg-red-100 text-red-700 border-red-200">Đã khóa</Badge>
    return <Badge className="bg-green-100 text-green-700 border-green-200">Hoạt động</Badge>
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" className="text-primary">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách khách hàng đã đăng ký</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{total} khách hàng</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Tìm tên, email, số điện thoại..."
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
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="LOCKED">Đã khóa</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => qc.invalidateQueries({ queryKey: ['admin-customers'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f5ee] border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Khách hàng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Liên hệ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Đơn đặt</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Chi tiêu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày đăng ký</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy khách hàng</p>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-[#f8f5ee] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={c.avatarUrl} />
                        <AvatarFallback className="text-xs">{c.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">{c.fullName}</p>
                        <p className="text-xs text-gray-400">#{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{c.email}</p>
                    {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{c.bookingsCount ?? 0}</td>
                  <td className="px-4 py-3 text-right font-medium" className="text-accent">
                    {((c.totalSpent ?? 0) / 1_000_000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {dayjs(c.createdAt).format('DD/MM/YYYY')}
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleView(c)}
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {c.status === 'LOCKED' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleUnlock(c)}
                          title="Mở khóa"
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleLock(c)}
                          title="Khóa tài khoản"
                        >
                          <Lock className="w-4 h-4" />
                        </Button>
                      )}
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
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Trước
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <Button
                    key={pg}
                    variant={pg === page ? 'default' : 'outline'}
                    size="sm"
                    style={pg === page ? { background: '#0a1628' } : undefined}
                    onClick={() => setPage(pg)}
                  >
                    {pg + 1}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <CustomerDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        customer={selectedUser}
        onLock={c => { setDetailOpen(false); handleLock(c) }}
        onUnlock={c => { setDetailOpen(false); handleUnlock(c) }}
      />

      {/* Lock Dialog */}
      <LockDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        customer={lockTarget}
        loading={lockMutation.isPending}
        onConfirm={(reason, lockType, days) => {
          if (!lockTarget) return
          lockMutation.mutate({ id: lockTarget.id, reason, lockType, days })
        }}
      />

      {/* Unlock Confirm */}
      <ConfirmDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        title="Mở khóa tài khoản"
        description={`Bạn có chắc muốn mở khóa tài khoản "${unlockTarget?.fullName}"?`}
        confirmLabel="Mở khóa"
        variant="warning"
        loading={unlockMutation.isPending}
        onConfirm={() => unlockTarget && unlockMutation.mutate(unlockTarget.id)}
      />
    </div>
  )
}
