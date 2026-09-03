import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { Upload, X, AlertCircle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '../../components/ui/sheet'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Textarea } from '../../components/ui/textarea'
import api from '../../api/axiosInstance'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ─── Types ────────────────────────────────────────────────────────────────────

interface Departure {
  departureId: number
  tourId: number
  tourName: string
  departureDate: string
}

interface IncidentReport {
  id: number
  tourName?: string
  departureDate?: string
  incidentType: string
  description: string
  status: string        // OPEN | REVIEWING | RESOLVED
  adminNote?: string
  createdAt: string
  severity?: string
  imageUrls?: string[]
}

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// ─── Constants ────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { value: 'WEATHER', emoji: '⛈', label: 'Thời tiết xấu' },
  { value: 'TRANSPORT', emoji: '🚌', label: 'Phương tiện gặp sự cố' },
  { value: 'HEALTH', emoji: '🏥', label: 'Khách hàng cần y tế' },
  { value: 'PASSENGER', emoji: '👥', label: 'Vấn đề hành khách' },
  { value: 'ACCOMMODATION', emoji: '🏨', label: 'Khách sạn/Nhà hàng' },
  { value: 'OTHER', emoji: '📋', label: 'Khác' },
]

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; color: string; border: string }> = {
  LOW: { label: 'Thấp', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  MEDIUM: { label: 'Trung bình', bg: '#fef9c3', color: '#ca8a04', border: '#fde047' },
  HIGH: { label: 'Cao', bg: '#ffedd5', color: '#ea580c', border: '#fdba74' },
  URGENT: { label: 'Khẩn cấp', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}

const REPORT_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OPEN: { label: 'Đang xử lý', bg: '#fef9c3', color: '#ca8a04' },
  REVIEWING: { label: 'Đang xem xét', bg: '#eaf4fb', color: '#1a5276' },
  RESOLVED: { label: 'Đã xử lý', bg: '#dcfce7', color: '#16a34a' },
}

const MAX_IMAGES = 5
const MAX_FILE_MB = 5
const MIN_DESC_LEN = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

const incidentLabel = (type: string) =>
  INCIDENT_TYPES.find(t => t.value === type)?.label ?? type

const incidentEmoji = (type: string) =>
  INCIDENT_TYPES.find(t => t.value === type)?.emoji ?? '📋'

const SeverityBadge = ({ severity }: { severity?: string }) => {
  const cfg = SEVERITY_CONFIG[severity as Severity] ?? SEVERITY_CONFIG['LOW']
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────

interface ImageUploadZoneProps {
  files: File[]
  onAdd: (newFiles: File[]) => void
  onRemove: (idx: number) => void
}

const ImageUploadZone = ({ files, onAdd, onRemove }: ImageUploadZoneProps) => {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const valid: File[] = []
    Array.from(incoming).forEach(f => {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name}: chỉ hỗ trợ ảnh`)
        return
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name}: vượt quá ${MAX_FILE_MB}MB`)
        return
      }
      valid.push(f)
    })
    const remaining = MAX_IMAGES - files.length
    if (valid.length > remaining) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh`)
      onAdd(valid.slice(0, remaining))
    } else {
      onAdd(valid)
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragging ? 'border-[#1a5276] bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
        `}
      >
        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">Kéo thả ảnh hoặc <span className="text-primary">chọn từ máy</span></p>
        <p className="text-xs text-gray-400 mt-1">Tối đa {MAX_IMAGES} ảnh, mỗi ảnh ≤ {MAX_FILE_MB}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => processFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${idx}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onRemove(idx) }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Incident Detail Sheet ────────────────────────────────────────────────────

const IncidentDetailSheet = ({
  report, open, onClose,
}: { report: IncidentReport | null; open: boolean; onClose: () => void }) => {
  if (!report) return null
  const statusCfg = REPORT_STATUS_CONFIG[report.status] ?? REPORT_STATUS_CONFIG['OPEN']

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-base font-bold text-gray-900 pr-8">
            {incidentEmoji(report.incidentType)} {incidentLabel(report.incidentType)}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-3 mt-5">
          <div className="space-y-4">
            {/* Status + severity */}
            <div className="flex flex-wrap gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
              <SeverityBadge severity={report.severity} />
            </div>

            {/* Tour info */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tour</span>
                <span className="font-semibold text-gray-900 text-right max-w-[60%]">{report.tourName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày khởi hành</span>
                <span className="font-semibold text-gray-900">
                  {report.departureDate ? dayjs(report.departureDate).format('DD/MM/YYYY') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loại sự cố</span>
                <span className="font-semibold text-gray-900">{incidentLabel(report.incidentType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian gửi</span>
                <span className="font-semibold text-gray-900">{dayjs(report.createdAt).fromNow()}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mô tả</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Images */}
            {report.imageUrls && report.imageUrls.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ảnh đính kèm</p>
                <div className="grid grid-cols-3 gap-2">
                  {report.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`incident-${i}`} className="w-full aspect-square object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin note */}
            {report.adminNote && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle size={12} /> Ghi chú từ Admin
                </p>
                <p className="text-sm text-gray-700">{report.adminNote}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const IncidentReportPage = () => {
  const queryClient = useQueryClient()

  // Form state
  const [departureId, setDepartureId] = useState('')
  const [incidentType, setIncidentType] = useState('OTHER')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('MEDIUM')
  const [images, setImages] = useState<File[]>([])

  // Filter state
  const [filterType, setFilterType] = useState('')

  // Detail sheet
  const [detailReport, setDetailReport] = useState<IncidentReport | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: departures = [] } = useQuery<Departure[]>({
    queryKey: ['staff', 'my-tours'],
    queryFn: async () => {
      const res = await api.get('/staff/my-tours')
      return res.data
    },
  })

  const { data: reports = [], isLoading: reportsLoading } = useQuery<IncidentReport[]>({
    queryKey: ['incidents', 'my'],
    queryFn: async () => {
      const res = await api.get('/incident-reports/my')
      return res.data
    },
  })

  // ── Mutation ──────────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.append('departureId', departureId)
      fd.append('incidentType', incidentType)
      fd.append('description', description)
      fd.append('severity', severity)
      images.forEach(img => fd.append('images', img))
      return api.post('/incident-reports', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success('Báo cáo đã được gửi đến Admin!')
      setDepartureId(''); setIncidentType('OTHER'); setDescription('')
      setSeverity('MEDIUM'); setImages([])
      queryClient.invalidateQueries({ queryKey: ['incidents', 'my'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!departureId) { toast.error('Vui lòng chọn chuyến đi'); return }
    if (description.trim().length < MIN_DESC_LEN) {
      toast.error(`Mô tả phải ít nhất ${MIN_DESC_LEN} ký tự`); return
    }
    submitMutation.mutate()
  }

  const addImages = useCallback((newFiles: File[]) => {
    setImages(prev => [...prev, ...newFiles])
  }, [])

  const removeImage = useCallback((idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const filteredReports = filterType
    ? reports.filter(r => r.incidentType === filterType)
    : reports

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6" >
      <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6">

        {/* ── Report form ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="font-black text-gray-900 text-base mb-5 flex items-center gap-2">
            <AlertCircle size={18} className="text-accent" />
            Báo cáo sự cố mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Select tour */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Chuyến đi đang diễn ra <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={departureId}
                  onChange={e => setDepartureId(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent bg-white pr-10"
                >
                  <option value="">— Chọn chuyến đi —</option>
                  {departures.map(d => (
                    <option key={d.departureId} value={d.departureId}>
                      {d.tourName}
                      {d.departureDate ? ` — ${dayjs(d.departureDate).format('DD/MM/YYYY')}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Incident type */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Loại sự cố <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setIncidentType(type.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${incidentType === type.value
                      ? 'border-transparent'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    style={
                      incidentType === type.value
                        ? { backgroundColor: '#eaf4fb', borderColor: '#1a5276', color: '#1a5276' }
                        : undefined
                    }
                  >
                    <span>{type.emoji}</span>
                    <span className="text-xs leading-snug">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Mô tả chi tiết sự cố xảy ra..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${description.length >= MIN_DESC_LEN ? 'text-green-600' : 'text-gray-400'}`}>
                  {description.length}/{MIN_DESC_LEN} ký tự tối thiểu
                </span>
                <span className="text-xs text-gray-400">{description.length} ký tự</span>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Ảnh đính kèm ({images.length}/{MAX_IMAGES})
              </label>
              <ImageUploadZone files={images} onAdd={addImages} onRemove={removeImage} />
            </div>

            {/* Severity */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Mức độ nghiêm trọng <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(SEVERITY_CONFIG) as Severity[]).map(sev => {
                  const cfg = SEVERITY_CONFIG[sev]
                  const active = severity === sev
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className="py-2 rounded-xl text-xs font-bold border-2 transition-all"
                      style={{
                        backgroundColor: active ? cfg.bg : 'transparent',
                        borderColor: active ? cfg.border : '#e5e7eb',
                        color: active ? cfg.color : '#9ca3af',
                      }}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-accent"
            >
              {submitMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi báo cáo'
              )}
            </button>
          </form>
        </div>

        {/* ── Incident history timeline ──────────────────────── */}
        <div>
          {/* Header + filter */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-gray-900">Lịch sử báo cáo</h2>
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none bg-white pr-8"
              >
                <option value="">Tất cả loại</option>
                {INCIDENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {reportsLoading ? (
            <div className="flex justify-center py-16">
              <span className="w-8 h-8 border-2 rounded-full animate-spin border-primary/15 border-t-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <span className="text-5xl block mb-3">📋</span>
              <p className="font-semibold text-gray-500 text-sm">Chưa có báo cáo sự cố nào</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gray-100" />

              <div className="space-y-4">
                {filteredReports.map(report => {
                  const sevCfg = SEVERITY_CONFIG[(report.severity ?? 'LOW') as Severity]
                  const statusCfg = REPORT_STATUS_CONFIG[report.status] ?? REPORT_STATUS_CONFIG['OPEN']

                  return (
                    <button
                      key={report.id}
                      onClick={() => { setDetailReport(report); setDetailOpen(true) }}
                      className="relative w-full text-left pl-14 pr-0 group"
                    >
                      {/* Dot */}
                      <span
                        className="absolute left-3.5 top-3.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: sevCfg.color }}
                      />

                      {/* Card */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              <span>{incidentEmoji(report.incidentType)}</span>
                              <span className="truncate">{report.tourName ?? 'Tour'}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {incidentLabel(report.incidentType)}
                              {report.departureDate && ` · ${dayjs(report.departureDate).format('DD/MM/YYYY')}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                            >
                              {statusCfg.label}
                            </span>
                            <SeverityBadge severity={report.severity} />
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          {dayjs(report.createdAt).fromNow()}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <IncidentDetailSheet
        report={detailReport}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}

export default IncidentReportPage
