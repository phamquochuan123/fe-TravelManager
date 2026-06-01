import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  Search, Star, Eye, EyeOff, MessageSquare, RefreshCw,
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [serviceType, setServiceType] = useState('ALL')
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [visibilityFilter, setVisibilityFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState<Review | null>(null)
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null)
  const [hideTarget, setHideTarget] = useState<Review | null>(null)
  const [hideOpen, setHideOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching } = useQuery<Page<Review>>({
    queryKey: ['admin-reviews', debouncedSearch, serviceType, ratingFilter, visibilityFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE }
      if (debouncedSearch) params.search = debouncedSearch
      if (serviceType !== 'ALL') params.serviceType = serviceType
      if (ratingFilter !== 'ALL') params.rating = ratingFilter
      if (visibilityFilter !== 'ALL') params.visible = visibilityFilter === 'VISIBLE' ? 'true' : 'false'
      const res = await axiosInstance.get('/admin/reviews', { params })
      return res.data
    }
  })

  const reviews = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: number; visible: boolean }) => {
      await axiosInstance.patch(`/admin/reviews/${id}/visibility`, { visible })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật hiển thị')
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      setHideOpen(false)
    },
    onError: () => toast.error('Cập nhật thất bại')
  })

  const serviceBadge = (type: string) => {
    const colors: Record<string, string> = {
      TOUR: 'bg-blue-100 text-blue-700',
      HOTEL: 'bg-purple-100 text-purple-700',
      RESTAURANT: 'bg-orange-100 text-orange-700'
    }
    return (
      <Badge className={`${colors[type] ?? ''} border-0 text-xs`}>
        {SERVICE_LABELS[type] ?? type}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" className="text-primary">Quản lý đánh giá</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kiểm duyệt và phản hồi đánh giá của khách hàng</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Tìm tên khách, tên dịch vụ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={serviceType} onValueChange={v => { setServiceType(v); setPage(0) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Dịch vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="TOUR">Tour</SelectItem>
            <SelectItem value="HOTEL">Khách sạn</SelectItem>
            <SelectItem value="RESTAURANT">Nhà hàng</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={v => { setRatingFilter(v); setPage(0) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Xếp hạng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả sao</SelectItem>
            {[5, 4, 3, 2, 1].map(r => (
              <SelectItem key={r} value={String(r)}>{r} sao</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={v => { setVisibilityFilter(v); setPage(0) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Hiển thị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="VISIBLE">Đang hiển thị</SelectItem>
            <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => qc.invalidateQueries({ queryKey: ['admin-reviews'] })}
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Người đánh giá</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Dịch vụ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Sao</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 max-w-xs">Nội dung</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Ảnh</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Phản hồi</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">H.động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Chưa có đánh giá nào</p>
                  </td>
                </tr>
              ) : reviews.map(r => (
                <tr key={r.id} className={`hover:bg-[#f8f5ee] transition-colors ${!r.visible ? 'opacity-50' : ''}`}>
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
                  <td className="px-4 py-3 text-center">
                    <StarRating value={r.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-gray-700 line-clamp-2">{r.comment}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.images && r.images.length > 0 ? (
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 text-xs"
                        onClick={() => setGallery({ images: r.images!, idx: 0 })}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {r.images.length}
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.adminReply ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">Đã phản hồi</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-400 border-0 text-xs">Chưa</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {dayjs(r.createdAt).format('DD/MM/YY')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-blue-600 hover:bg-blue-50"
                        onClick={() => { setReplyTarget(r); setReplyOpen(true) }}
                        title="Phản hồi"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-7 h-7 ${r.visible
                          ? 'text-orange-500 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => { setHideTarget(r); setHideOpen(true) }}
                        title={r.visible ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                      >
                        {r.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
            <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
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
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      <ReplyDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        review={replyTarget}
        onSaved={() => qc.invalidateQueries({ queryKey: ['admin-reviews'] })}
      />

      {/* Image gallery */}
      {gallery && (
        <ImageGallery
          images={gallery.images}
          initialIndex={gallery.idx}
          onClose={() => setGallery(null)}
        />
      )}

      {/* Toggle visibility confirm */}
      <ConfirmDialog
        open={hideOpen}
        onOpenChange={setHideOpen}
        title={hideTarget?.visible ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
        description={hideTarget?.visible
          ? 'Đánh giá này sẽ không hiển thị cho khách hàng.'
          : 'Đánh giá này sẽ được hiển thị lại cho khách hàng.'
        }
        confirmLabel={hideTarget?.visible ? 'Ẩn' : 'Hiện'}
        variant="warning"
        loading={toggleVisibility.isPending}
        onConfirm={() => hideTarget && toggleVisibility.mutate({ id: hideTarget.id, visible: !hideTarget.visible })}
      />
    </div>
  )
}
