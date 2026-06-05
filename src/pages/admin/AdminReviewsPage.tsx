import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  Search, Star, MessageSquare, RefreshCw,
  X, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import axiosInstance from '@/api/axiosInstance'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Review {
  id: number
  authorName: string
  authorAvatar?: string
  serviceType: 'TOUR' | 'HOTEL' | 'RESTAURANT'
  serviceName: string
  rating: number
  comment: string
  images?: string[]
  adminReply?: string
  visible: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number }

const SERVICE_LABELS: Record<string, string> = {
  TOUR: 'Tour', HOTEL: 'Khách sạn', RESTAURANT: 'Nhà hàng'
}

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </span>
  )
}

// ─── ImageGallery ─────────────────────────────────────────────────────────────
function ImageGallery({
  images, initialIndex, onClose
}: {
  images: string[]
  initialIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      <button
        className="absolute left-4 text-white/70 hover:text-white p-2 disabled:opacity-20"
        disabled={idx === 0}
        onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <img
        src={images[idx]}
        alt=""
        className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      />

      <button
        className="absolute right-4 text-white/70 hover:text-white p-2 disabled:opacity-20"
        disabled={idx === images.length - 1}
        onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <div className="absolute bottom-4 text-white/60 text-sm">
        {idx + 1} / {images.length}
      </div>
    </div>
  )
}

// ─── ReplyDialog ──────────────────────────────────────────────────────────────
function ReplyDialog({
  open, onOpenChange, review, onSaved
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  review: Review | null
  onSaved: () => void
}) {
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null)

  useEffect(() => {
    if (open && review) setReply(review.adminReply ?? '')
  }, [open, review])

  const handleSave = async () => {
    if (!review) return
    setSaving(true)
    try {
      await axiosInstance.post(`/admin/reviews/${review.id}/reply`, { reply })
      toast.success('Đã lưu phản hồi')
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (!review) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" className="text-primary">
              <MessageSquare className="w-5 h-5" />
              Phản hồi đánh giá
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="space-y-4 py-2 pr-2">
              {/* Review card */}
              <div className="bg-[#f8f5ee] rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={review.authorAvatar} />
                    <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.authorName}</span>
                      <StarRating value={review.rating} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dayjs(review.createdAt).format('DD/MM/YYYY HH:mm')} · {review.serviceName}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{review.comment}</p>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-16 h-16 rounded overflow-hidden border hover:ring-2 ring-blue-400 transition-all"
                        onClick={() => setGallery({ images: review.images!, idx: i })}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Reply field */}
              <div className="space-y-1.5">
                <Label>Phản hồi của Admin</Label>
                <Textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Nhập phản hồi của bạn..."
                  rows={5}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Hủy</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !reply.trim()}
              className="bg-primary"
              className="text-white"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
              Lưu phản hồi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {gallery && (
        <ImageGallery
          images={gallery.images}
          initialIndex={gallery.idx}
          onClose={() => setGallery(null)}
        />
      )}
    </>
  )
}

const STATUS_CFG = {
  PENDING:  { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Đã duyệt',  cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Từ chối',   cls: 'bg-red-100 text-red-600' },
} as const

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [serviceType, setServiceType] = useState('ALL')
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState<Review | null>(null)
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null)
  const [actionTarget, setActionTarget] = useState<{ review: Review; type: 'approve' | 'reject' } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching } = useQuery<Page<Review>>({
    queryKey: ['admin-reviews', debouncedSearch, serviceType, ratingFilter, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE }
      if (debouncedSearch) params.search = debouncedSearch
      if (serviceType !== 'ALL') params.serviceType = serviceType
      if (ratingFilter !== 'ALL') params.rating = ratingFilter
      const res = await axiosInstance.get('/admin/reviews', { params })
      // filter client-side by status since backend doesn't have a status param yet
      const allReviews: Review[] = res.data?.content ?? []
      const filtered = statusFilter === 'ALL' ? allReviews : allReviews.filter(r => r.status === statusFilter)
      return { ...res.data, content: filtered, totalElements: filtered.length }
    }
  })

  const reviews = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const inv = () => qc.invalidateQueries({ queryKey: ['admin-reviews'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/admin/reviews/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt đánh giá'); inv(); setActionTarget(null) },
    onError: () => toast.error('Thao tác thất bại'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/admin/reviews/${id}/reject`),
    onSuccess: () => { toast.success('Đã từ chối đánh giá'); inv(); setActionTarget(null) },
    onError: () => toast.error('Thao tác thất bại'),
  })

  const serviceBadge = (type: string) => {
    const colors: Record<string, string> = {
      TOUR: 'bg-blue-100 text-blue-700',
      HOTEL: 'bg-purple-100 text-purple-700',
      RESTAURANT: 'bg-orange-100 text-orange-700'
    }
    return <Badge className={`${colors[type] ?? ''} border-0 text-xs`}>{SERVICE_LABELS[type] ?? type}</Badge>
  }

  const pendingCount = (data?.content ?? []).length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý đánh giá</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kiểm duyệt và phản hồi đánh giá của khách hàng</p>
        </div>
        {statusFilter === 'PENDING' && pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-700">{pendingCount} đánh giá chờ duyệt</span>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(s => {
          const cfg = s === 'ALL' ? { label: 'Tất cả', cls: '' } : STATUS_CFG[s]
          return (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Tìm tên khách, tên dịch vụ..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={serviceType} onValueChange={v => { setServiceType(v); setPage(0) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Dịch vụ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="TOUR">Tour</SelectItem>
            <SelectItem value="HOTEL">Khách sạn</SelectItem>
            <SelectItem value="RESTAURANT">Nhà hàng</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={v => { setRatingFilter(v); setPage(0) }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Sao" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả sao</SelectItem>
            {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{r} sao</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={inv} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f5ee] border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Người đánh giá</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Dịch vụ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Sao</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nội dung</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>{statusFilter === 'PENDING' ? 'Không có đánh giá nào đang chờ duyệt' : 'Chưa có đánh giá nào'}</p>
                  </td>
                </tr>
              ) : reviews.map(r => {
                const statusCfg = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING
                return (
                  <tr key={r.id} className={`transition-colors ${
                    r.status === 'PENDING' ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-[#f8f5ee]'
                  }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={r.authorAvatar} />
                          <AvatarFallback className="text-xs">{r.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-800 text-xs">{r.authorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {serviceBadge(r.serviceType)}
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{r.serviceName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center"><StarRating value={r.rating} /></td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-gray-700 line-clamp-2">{r.comment}</p>
                      {r.adminReply && (
                        <p className="text-xs text-blue-600 mt-1 italic line-clamp-1">↩ {r.adminReply}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${statusCfg.cls} border-0 text-xs`}>{statusCfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {dayjs(r.createdAt).format('DD/MM/YY HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {r.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold"
                              onClick={() => setActionTarget({ review: r, type: 'approve' })}>
                              Duyệt
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs font-semibold"
                              onClick={() => setActionTarget({ review: r, type: 'reject' })}>
                              Từ chối
                            </Button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-600 hover:bg-blue-50"
                              onClick={() => { setReplyTarget(r); setReplyOpen(true) }} title="Phản hồi">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="h-7 px-2 text-red-500 hover:bg-red-50 text-xs"
                              onClick={() => setActionTarget({ review: r, type: 'reject' })}>
                              Từ chối
                            </Button>
                          </>
                        )}
                        {r.status === 'REJECTED' && (
                          <Button size="sm" variant="ghost"
                            className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 text-xs"
                            onClick={() => setActionTarget({ review: r, type: 'approve' })}>
                            Duyệt lại
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Tổng: {total}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <Button key={pg} variant={pg === page ? 'default' : 'outline'} size="sm"
                    style={pg === page ? { background: '#0a1628' } : undefined}
                    onClick={() => setPage(pg)}>{pg + 1}</Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      <ReplyDialog open={replyOpen} onOpenChange={setReplyOpen} review={replyTarget} onSaved={inv} />

      {gallery && <ImageGallery images={gallery.images} initialIndex={gallery.idx} onClose={() => setGallery(null)} />}

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={v => { if (!v) setActionTarget(null) }}
        title={actionTarget?.type === 'approve' ? 'Duyệt đánh giá' : 'Từ chối đánh giá'}
        description={actionTarget?.type === 'approve'
          ? 'Đánh giá sẽ được hiển thị công khai cho người dùng.'
          : 'Đánh giá sẽ bị ẩn và không hiển thị công khai.'}
        confirmLabel={actionTarget?.type === 'approve' ? 'Duyệt' : 'Từ chối'}
        variant={actionTarget?.type === 'approve' ? 'default' : 'danger'}
        loading={approveMutation.isPending || rejectMutation.isPending}
        onConfirm={() => {
          if (!actionTarget) return
          if (actionTarget.type === 'approve') approveMutation.mutate(String(actionTarget.review.id))
          else rejectMutation.mutate(String(actionTarget.review.id))
        }}
      />
    </div>
  )
}
