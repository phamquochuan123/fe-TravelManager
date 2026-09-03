import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { AlertTriangle, CheckCircle, Eye, MessageSquare, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import api from '../../api/axiosInstance'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncidentReport {
  id: number
  staffName?: string
  staffEmail?: string
  tourName?: string
  departureDate?: string
  incidentType: string
  description: string
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED'
  severity?: string
  adminNote?: string
  imageUrls?: string[]
  createdAt: string
}

type Status = 'OPEN' | 'REVIEWING' | 'RESOLVED'
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// ─── Config maps ──────────────────────────────────────────────────────────────

const INCIDENT_TYPES: Record<string, { emoji: string; label: string }> = {
  WEATHER:       { emoji: '⛈',  label: 'Thời tiết xấu' },
  TRANSPORT:     { emoji: '🚌', label: 'Phương tiện' },
  HEALTH:        { emoji: '🏥', label: 'Y tế' },
  PASSENGER:     { emoji: '👥', label: 'Hành khách' },
  ACCOMMODATION: { emoji: '🏨', label: 'Lưu trú' },
  OTHER:         { emoji: '📋', label: 'Khác' },
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  OPEN:      { label: 'Đang xử lý',   bg: '#fef9c3', color: '#ca8a04' },
  REVIEWING: { label: 'Đang xem xét', bg: '#eaf4fb', color: '#0a1628' },
  RESOLVED:  { label: 'Đã xử lý',     bg: '#dcfce7', color: '#16a34a' },
}

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; color: string }> = {
  LOW:    { label: 'Thấp',       bg: '#dcfce7', color: '#16a34a' },
  MEDIUM: { label: 'Trung bình', bg: '#fef9c3', color: '#ca8a04' },
  HIGH:   { label: 'Cao',        bg: '#ffedd5', color: '#ea580c' },
  URGENT: { label: 'Khẩn cấp',  bg: '#fee2e2', color: '#dc2626' },
}

const ALL_STATUSES: Status[] = ['OPEN', 'REVIEWING', 'RESOLVED']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function incidentLabel(type: string) {
  return INCIDENT_TYPES[type]?.label ?? type
}
function incidentEmoji(type: string) {
  return INCIDENT_TYPES[type]?.emoji ?? '📋'
}

function SeverityBadge({ severity }: { severity?: string }) {
  const cfg = SEVERITY_CONFIG[(severity ?? 'LOW') as Severity] ?? SEVERITY_CONFIG.LOW
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ─── Detail + Update Sheet ────────────────────────────────────────────────────

function IncidentSheet({
  report, open, onClose, onUpdated,
}: {
  report: IncidentReport | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus]     = useState<Status>('OPEN')
  const [adminNote, setAdminNote] = useState('')

  // Sync khi mở sheet mới
  const handleOpen = (o: boolean) => {
    if (o && report) {
      setStatus(report.status)
      setAdminNote(report.adminNote ?? '')
    }
    if (!o) onClose()
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/incident-reports/${report!.id}/status`, { status, adminNote }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái sự cố')
      onUpdated()
      onClose()
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })

  if (!report) return null

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-base font-bold text-gray-900 pr-8">
            {incidentEmoji(report.incidentType)} {incidentLabel(report.incidentType)}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-3 mt-5">
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={report.status} />
              <SeverityBadge severity={report.severity} />
            </div>

            {/* Info grid */}
            <div className="bg-[#f8f5ee] rounded p-4 space-y-2 text-sm">
              {[
                ['Staff', report.staffName ?? '—'],
                ['Email', report.staffEmail ?? '—'],
                ['Tour', report.tourName ?? '—'],
                ['Ngày KH', report.departureDate ? dayjs(report.departureDate).format('DD/MM/YYYY') : '—'],
                ['Gửi lúc', dayjs(report.createdAt).fromNow()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="font-semibold text-gray-900 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Images */}
            {report.imageUrls && report.imageUrls.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Ảnh đính kèm
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {report.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`img-${i}`}
                        className="w-full aspect-square object-cover rounded border hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin update form */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Xử lý</p>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Trạng thái mới</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_STATUSES.map(s => {
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className="px-3 py-1.5 rounded text-xs font-bold border-2 transition-all"
                        style={
                          status === s
                            ? { backgroundColor: cfg.bg, borderColor: cfg.color, color: cfg.color }
                            : { borderColor: '#e5e7eb', color: '#9ca3af' }
                        }
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Ghi chú Admin</label>
                <Textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú xử lý sự cố..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full text-white bg-primary"
              >
                {updateMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle size={14} className="mr-2" />
                )}
                Lưu cập nhật
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function AdminIncidentsPage() {
  const queryClient = useQueryClient()

  const [filterStatus,   setFilterStatus]   = useState<Status | ''>('')
  const [filterSeverity, setFilterSeverity] = useState<Severity | ''>('')
  const [filterType,     setFilterType]     = useState('')

  const [selected, setSelected] = useState<IncidentReport | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: reports = [], isLoading, refetch, isFetching } = useQuery<IncidentReport[]>({
    queryKey: ['admin', 'incidents'],
    queryFn: async () => {
      const res = await api.get('/incident-reports/admin/all')
      return res.data
    },
  })

  const openSheet = (r: IncidentReport) => {
    setSelected(r)
    setSheetOpen(true)
  }

  const filtered = reports
    .filter(r => !filterStatus   || r.status === filterStatus)
    .filter(r => !filterSeverity || r.severity === filterSeverity)
    .filter(r => !filterType     || r.incidentType === filterType)
    .sort((a, b) =>
      (SEVERITY_ORDER[a.severity ?? 'LOW'] ?? 3) - (SEVERITY_ORDER[b.severity ?? 'LOW'] ?? 3)
    )

  const counts = {
    open:      reports.filter(r => r.status === 'OPEN').length,
    reviewing: reports.filter(r => r.status === 'REVIEWING').length,
    resolved:  reports.filter(r => r.status === 'RESOLVED').length,
    urgent:    reports.filter(r => r.severity === 'URGENT').length,
  }

  return (
    <div className="p-6 space-y-5" >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Báo cáo sự cố
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{reports.length} báo cáo từ staff</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Tải lại
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Đang xử lý', value: counts.open,      color: '#ca8a04', bg: '#fef9c3' },
          { label: 'Đang xem',   value: counts.reviewing, color: '#0a1628', bg: '#eaf4fb' },
          { label: 'Đã giải quyết', value: counts.resolved, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Khẩn cấp',   value: counts.urgent,    color: '#dc2626', bg: '#fee2e2' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded border p-4 text-center">
            <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as Status | '')}
          className="border border-gray-200 rounded px-3 py-2 text-xs font-medium focus:outline-none bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value as Severity | '')}
          className="border border-gray-200 rounded px-3 py-2 text-xs font-medium focus:outline-none bg-white"
        >
          <option value="">Tất cả mức độ</option>
          {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => (
            <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-xs font-medium focus:outline-none bg-white"
        >
          <option value="">Tất cả loại</option>
          {Object.entries(INCIDENT_TYPES).map(([v, { emoji, label }]) => (
            <option key={v} value={v}>{emoji} {label}</option>
          ))}
        </select>

        {(filterStatus || filterSeverity || filterType) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterType('') }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-3 py-2 transition-colors"
          >
            <X size={12} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 rounded-full animate-spin border-primary/15 border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertTriangle size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-sm">Không có báo cáo nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f5ee] border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Loại</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Staff</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tour</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Mức độ</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Thời gian</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-[#f8f5ee] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {incidentEmoji(r.incidentType)} {incidentLabel(r.incidentType)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 text-xs">{r.staffName ?? '—'}</p>
                      <p className="text-gray-400 text-xs">{r.staffEmail ?? ''}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="truncate text-gray-700">{r.tourName ?? '—'}</p>
                      {r.departureDate && (
                        <p className="text-gray-400 text-xs">{dayjs(r.departureDate).format('DD/MM/YYYY')}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {dayjs(r.createdAt).fromNow()}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openSheet(r)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
                      >
                        {r.status === 'RESOLVED'
                          ? <><Eye size={12} /> Xem</>
                          : <><MessageSquare size={12} /> Xử lý</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <IncidentSheet
        report={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'incidents'] })}
      />
    </div>
  )
}
