import { useMemo, useState, useEffect, useRef } from 'react'
import { resolveBase64Image } from '@/lib/utils'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MdSearch, MdFilterList, MdClose, MdLocationOn, MdAccessTime,
  MdStar, MdStarBorder, MdSort, MdKeyboardArrowLeft, MdKeyboardArrowRight,
  MdMap, MdArrowForward, MdVerified, MdTune, MdWarning,
} from 'react-icons/md'
import { getAllTours } from '../../api/tourApi'
import { Skeleton } from '../../components/ui/skeleton'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tour {
  id: number
  name: string
  destination?: string
  durationDays?: number
  priceAdult?: number
  tourType?: 'DOMESTIC' | 'INTERNATIONAL'
  averageRating?: number
  images?: string[]
}

interface Filters {
  search: string
  destination: string
  priceMin: number
  priceMax: number
  days: number
  tourType: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE  = 12

// Chỉ dùng photo ID đã verify 100% hoạt động
const V = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80`

// Mỗi destination có ảnh UNIQUE — không trùng bất kỳ cặp nào
const DEST_PHOTOS: [string, string][] = [
  ['ha long',   V('photo-1528127269322-539801943592')], // Vịnh Hạ Long đá vôi
  ['cat ba',    V('photo-1596701062351-8c2c14d1fdd0')], // Đảo Cát Bà biển xanh
  ['hoi an',    V('photo-1592595896616-c37162298647')], // Phố cổ Hội An đèn lồng
  ['da nang',   V('photo-1571896349842-33c89424de2d')], // Beach resort Đà Nẵng
  ['hue',       V('photo-1542314831-068cd1dbfeeb')],    // Cố đô Huế kiến trúc
  ['sa pa',     V('photo-1501555088652-021faa106b9b')], // Ruộng bậc thang Sa Pa
  ['fansipan',  V('photo-1464822759023-fed622ff2c3b')], // Đỉnh Fansipan núi cao
  ['bac ha',    V('photo-1506905925346-21bda4d32df4')], // Chợ phiên Bắc Hà
  ['ninh binh', V('photo-1568456537803-be2f5b77b1cf')], // Chèo thuyền Tam Cốc
  ['trang an',  V('photo-1445019980597-93fa8acb246c')], // Tràng An xanh mướt
  ['da lat',    V('photo-1611892440504-42a792e24d32')], // Đà Lạt sương mù
  ['nha trang', V('photo-1540541338537-71beef4c41ba')], // Biển Nha Trang
  ['phu quoc',  V('photo-1615880484746-a134be9a6ecf')], // Biển Phú Quốc trong veo
  ['mui ne',    V('photo-1551882547-ff40c242b0e0')],    // Mũi Né đồi cát
  ['phan thiet',V('photo-1565082508778-efce12d30e17')], // Phan Thiết di sản văn hoá
  ['con dao',   V('photo-1582719478250-c89cae4dc85b')], // Côn Đảo hoang sơ
  ['can tho',   V('photo-1520250497591-112f2f40a3f4')], // Cần Thơ chợ nổi
  ['ben tre',   V('photo-1564501049412-61c2a3083791')], // Bến Tre dừa nước
  ['phong nha', V('photo-1566073771259-6a8506099945')], // Phong Nha hang động
  ['ha noi',    V('photo-1571003123894-1f0594d2b5d9')], // Hà Nội đô thị
  ['bangkok',   V('photo-1508009603885-50cf7c579365')], // Bangkok đền thờ
  ['pattaya',   'https://picsum.photos/seed/pattaya-beach-vn/600/400'],  // Pattaya bãi biển
  ['thai lan',  'https://picsum.photos/seed/thailand-nature-vn/600/400'], // Thái Lan thiên nhiên
]

// DEFAULT: dùng picsum (seed cố định) → luôn unique, không bao giờ trùng DEST_PHOTOS
const P = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`
const DEFAULT_TOUR_PHOTOS = [
  P('tour-vn-package-1'), // tour nội địa tổng hợp
  P('tour-vn-package-2'),
  P('tour-vn-package-3'),
  P('tour-vn-package-4'),
  P('tour-vn-package-5'),
  P('tour-vn-package-6'),
  P('tour-vn-package-7'),
  P('tour-vn-package-8'),
]

function getTourImage(tour: Tour): string {
  if (tour.images?.[0]) return resolveBase64Image(tour.images[0], '')
  const dest = (tour.destination ?? tour.name ?? '').toLowerCase()
  const match = DEST_PHOTOS.find(([key]) => dest.includes(key))
  if (match) return match[1]
  return DEFAULT_TOUR_PHOTOS[tour.id % DEFAULT_TOUR_PHOTOS.length]
}
const MAX_PRICE = 50_000_000
const SORT_OPTS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'price-asc',  label: 'Giá: thấp đến cao' },
  { value: 'price-desc', label: 'Giá: cao đến thấp' },
  { value: 'rating',     label: 'Đánh giá cao nhất' },
]
const TOUR_TYPE_LABEL: Record<string, string> = {
  DOMESTIC:      'Trong nước',
  INTERNATIONAL: 'Nước ngoài',
}
const DAYS_OPTS = [
  { label: 'Tất cả',       min: 0,  max: Infinity },
  { label: '1 – 3 ngày',   min: 1,  max: 3 },
  { label: '4 – 7 ngày',   min: 4,  max: 7 },
  { label: '8 – 14 ngày',  min: 8,  max: 14 },
  { label: 'Trên 14 ngày', min: 15, max: Infinity },
]
const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ'
const fmtShort = fmt

const DEFAULT_FILTERS: Filters = {
  search: '', destination: '', priceMin: 0, priceMax: MAX_PRICE,
  days: 0, tourType: '',
}

// ─── DualRangeSlider ──────────────────────────────────────────────────────────

interface RangeProps {
  min?: number; max?: number; step?: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}
const DualRangeSlider = ({ min = 0, max = MAX_PRICE, step = 500_000, value: [lo, hi], onChange }: RangeProps) => {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const thumbCls = `absolute w-full h-0 appearance-none pointer-events-none
    [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white`

  return (
    <div>
      <div className="relative h-5 flex items-center mb-3">
        <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full">
          <div
            className="absolute h-full rounded-full"
            style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%`, background: 'linear-gradient(90deg, #0a1628, #c9a84c)' }}
          />
        </div>
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          className={`${thumbCls} [&::-webkit-slider-thumb]:bg-[#0a1628]`} />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          className={`${thumbCls} [&::-webkit-slider-thumb]:bg-[#c9a84c]`} />
      </div>
      <div className="flex justify-between text-xs font-bold" style={{ color: '#0a1628' }}>
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(n)
        ? <MdStar key={i} size={13} className="text-[#c9a84c]" />
        : <MdStarBorder key={i} size={13} className="text-gray-300" />
    )}
  </div>
)

// ─── TourCard ─────────────────────────────────────────────────────────────────

const TourCard = ({ tour }: { tour: Tour }) => {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <article
      onClick={() => navigate(`/tours/${tour.id}`)}
      className="group cursor-pointer overflow-hidden rounded flex flex-col transition-all duration-200 ease-in-out hover:scale-[1.02] hover:-translate-y-0.5"
      style={{ boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.18)' : '0 2px 16px rgba(0,0,0,0.10)', background: '#fff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100 shrink-0">
        <img
          src={getTourImage(tour)}
          alt={tour.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)' }} />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {tour.tourType && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white shadow ${
              tour.tourType === 'DOMESTIC'
                ? 'bg-[#0a1628]'
                : 'bg-violet-600'
            }`}>
              {TOUR_TYPE_LABEL[tour.tourType]}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shadow"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#b8960e)' }}>
            <MdVerified size={10} className="inline mr-0.5" />Nổi bật
          </span>
        </div>

        {/* Duration top-right */}
        {tour.durationDays && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-white text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
              <MdAccessTime size={11} />{tour.durationDays} ngày
            </span>
          </div>
        )}

        {/* Destination bottom */}
        {tour.destination && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <MdLocationOn size={12} className="text-white/80" />
            <span className="text-white/80 text-xs font-semibold">{tour.destination}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#0a1628] transition-colors">
          {tour.name}
        </h3>

        {(tour.averageRating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Stars n={tour.averageRating!} />
            <span className="text-xs text-gray-400">{tour.averageRating?.toFixed(1)}</span>
          </div>
        )}

        <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Giá từ</p>
            <p className="text-lg font-black leading-none" style={{ color: '#c9a84c' }}>
              {tour.priceAdult ? fmtShort(tour.priceAdult) : 'Liên hệ'}
            </p>
          </div>
          <span className={`flex items-center gap-1 text-xs font-bold transition-all duration-200 ${hovered ? 'text-[#0a1628]' : 'text-gray-400'}`}>
            Xem tour <MdArrowForward size={13} className={`transition-transform duration-200 ${hovered ? 'translate-x-0.5' : ''}`} />
          </span>
        </div>
      </div>
    </article>
  )
}

const TourCardSkeleton = () => (
  <div className="rounded overflow-hidden bg-white" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
    <Skeleton className="h-52 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3 w-2/5" />
      <div className="flex justify-between items-end pt-3 border-t border-gray-100">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
)

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null
  const pages: (number | '...')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-12">
      <button disabled={current === 1} onClick={() => onChange(current - 1)}
        className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-[#0a1628] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <MdKeyboardArrowLeft size={18} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold transition-all ${
              current === p
                ? 'text-white shadow-lg'
                : 'border border-gray-200 text-gray-700 hover:border-[#0a1628] hover:text-[#0a1628]'
            }`}
            style={current === p ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' } : {}}>
            {p}
          </button>
        )
      )}
      <button disabled={current === total} onClick={() => onChange(current + 1)}
        className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-[#0a1628] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <MdKeyboardArrowRight size={18} />
      </button>
    </div>
  )
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

interface SidebarProps {
  draft: Filters
  destinations: string[]
  onDraftChange: (f: Partial<Filters>) => void
  onApply: () => void
  onReset: () => void
}

const FilterSidebar = ({ draft, destinations, onDraftChange, onApply, onReset }: SidebarProps) => {
  const [openSections, setOpenSections] = useState({ search: true, dest: true, price: true, days: true, type: true })
  const toggle = (k: keyof typeof openSections) => setOpenSections(s => ({ ...s, [k]: !s[k] }))

  const labelCls = 'w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 cursor-pointer hover:text-[#0a1628] transition-colors'
  const inputCls = 'w-full px-3.5 py-2.5 rounded border-2 border-gray-100 text-sm text-gray-800 focus:outline-none focus:border-[#0a1628] focus:ring-4 focus:ring-[#0a1628]/10 transition-all bg-[#f8f5ee] focus:bg-white'

  return (
    <div className="rounded-sm border border-gray-100 bg-white p-6 space-y-6"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
          <MdTune className="text-white" size={16} />
        </div>
        <h3 className="font-black text-gray-900">Bộ lọc</h3>
      </div>

      {/* Search */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('search')}>
          Tên tour <span>{openSections.search ? '−' : '+'}</span>
        </button>
        {openSections.search && (
          <div className="relative">
            <MdSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm theo tên tour..." value={draft.search}
              onChange={e => onDraftChange({ search: e.target.value })}
              className={`${inputCls} pl-10`} />
          </div>
        )}
      </div>

      {/* Destination */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('dest')}>
          Điểm đến <span>{openSections.dest ? '−' : '+'}</span>
        </button>
        {openSections.dest && (
          <div className="relative">
            <MdLocationOn size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={draft.destination} onChange={e => onDraftChange({ destination: e.target.value })}
              className={`${inputCls} pl-10 appearance-none`}>
              <option value="">Tất cả điểm đến</option>
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Price range */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('price')}>
          Khoảng giá <span>{openSections.price ? '−' : '+'}</span>
        </button>
        {openSections.price && (
          <DualRangeSlider
            value={[draft.priceMin, draft.priceMax]}
            onChange={([lo, hi]) => onDraftChange({ priceMin: lo, priceMax: hi })}
          />
        )}
      </div>

      {/* Duration */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('days')}>
          Số ngày <span>{openSections.days ? '−' : '+'}</span>
        </button>
        {openSections.days && (
          <div className="space-y-1">
            {DAYS_OPTS.map((o, i) => (
              <button key={i} onClick={() => onDraftChange({ days: i })}
                className={`w-full text-left px-3.5 py-2.5 rounded text-sm font-semibold transition-all ${
                  draft.days === i
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-[#f8f5ee]'
                }`}
                style={draft.days === i ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' } : {}}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tour type */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('type')}>
          Loại tour <span>{openSections.type ? '−' : '+'}</span>
        </button>
        {openSections.type && (
          <div className="space-y-1">
            {[{ value: '', label: 'Tất cả' }, { value: 'DOMESTIC', label: 'Trong nước' }, { value: 'INTERNATIONAL', label: 'Nước ngoài' }].map(o => (
              <button key={o.value} onClick={() => onDraftChange({ tourType: o.value })}
                className={`w-full text-left px-3.5 py-2.5 rounded text-sm font-semibold transition-all ${
                  draft.tourType === o.value
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-[#f8f5ee]'
                }`}
                style={draft.tourType === o.value ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' } : {}}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={onReset}
          className="flex-1 py-2.5 rounded border-2 border-gray-200 text-gray-600 text-sm font-bold hover:border-[#0a1628] hover:text-[#0a1628] transition-all">
          Đặt lại
        </button>
        <button onClick={onApply}
          className="flex-1 py-2.5 rounded text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
          Áp dụng
        </button>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 rounded flex items-center justify-center mb-5"
      style={{ background: 'rgba(10,22,40,0.06)', border: '1px solid rgba(10,22,40,0.12)' }}>
      <MdMap size={36} style={{ color: '#0a1628' }} />
    </div>
    <h3 className="text-xl font-black text-gray-800 mb-2">Chưa có tour nào phù hợp</h3>
    <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
      Thử thay đổi điều kiện tìm kiếm hoặc xem tất cả tour có sẵn.
    </p>
    <button onClick={onReset}
      className="flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
      <MdArrowForward size={14} /> Xem tất cả tour
    </button>
  </div>
)

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 rounded flex items-center justify-center mb-5"
      style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
      <MdWarning size={36} style={{ color: '#dc2626' }} />
    </div>
    <h3 className="text-xl font-black text-gray-800 mb-2">Không thể tải danh sách tour</h3>
    <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
      Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.
    </p>
    <button onClick={onRetry}
      className="flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
      Thử lại
    </button>
  </div>
)

// ─── Filter Chip ──────────────────────────────────────────────────────────────

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
    style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c', borderColor: 'rgba(201,168,76,0.25)' }}>
    {label}
    <button onClick={onRemove} className="hover:opacity-60 transition-opacity">
      <MdClose size={12} />
    </button>
  </span>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

const ToursPage = () => {
  const [searchParams] = useSearchParams()
  const initDest = searchParams.get('destination') ?? ''

  const [draft,    setDraft]    = useState<Filters>({ ...DEFAULT_FILTERS, destination: initDest })
  const [applied,  setApplied]  = useState<Filters>({ ...DEFAULT_FILTERS, destination: initDest })
  const [sort,     setSort]     = useState('newest')
  const [page,     setPage]     = useState(1)
  const [sideOpen, setSideOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const top = gridRef.current.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [page])

  const { data: allTours = [], isLoading, isError, refetch } = useQuery<Tour[]>({
    queryKey: ['tours'],
    queryFn: () => getAllTours() as Promise<Tour[]>,
  })

  const destinations = useMemo(() =>
    [...new Set(allTours.map(t => t.destination).filter(Boolean) as string[])].sort(),
    [allTours]
  )

  const filtered = useMemo(() => {
    const { search, destination, priceMin, priceMax, days, tourType } = applied
    const dur = DAYS_OPTS[days]
    let result = allTours.filter(t => {
      if (search && !t.name?.toLowerCase().includes(search.toLowerCase()) &&
          !t.destination?.toLowerCase().includes(search.toLowerCase())) return false
      if (destination && t.destination !== destination) return false
      if (priceMin > 0 && (t.priceAdult ?? 0) < priceMin) return false
      if ((t.priceAdult ?? 0) > priceMax) return false
      if (dur.min > 0 && ((t.durationDays ?? 0) < dur.min || (t.durationDays ?? 0) > dur.max)) return false
      if (tourType && t.tourType !== tourType) return false
      return true
    })
    switch (sort) {
      case 'price-asc':  result = [...result].sort((a, b) => (a.priceAdult ?? 0) - (b.priceAdult ?? 0)); break
      case 'price-desc': result = [...result].sort((a, b) => (b.priceAdult ?? 0) - (a.priceAdult ?? 0)); break
      case 'rating':     result = [...result].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)); break
      default:           result = [...result].sort((a, b) => b.id - a.id)
    }
    return result
  }, [allTours, applied, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleApply  = () => { setApplied({ ...draft }); setPage(1); setSideOpen(false) }
  const handleReset  = () => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); setPage(1); setSideOpen(false) }
  const handleSort   = (v: string) => { setSort(v); setPage(1) }

  const hasActiveFilters = applied.search || applied.destination || applied.tourType || applied.days > 0 ||
    applied.priceMin > 0 || applied.priceMax < MAX_PRICE

  return (
    <div className="min-h-screen bg-[#e8eef8]">
      <Navbar />

      {/* ── Hero: full-brightness nature photo, centered like Wix template ── */}
      <section
        className="relative overflow-hidden -mt-16"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Nature background – high visibility, image is the star */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-[1.03] transition-transform duration-[8s]"
          style={{ backgroundImage: `url(https://picsum.photos/id/1039/1920/1080)` }}
        />

        {/* Very light vignette – just enough so white text pops */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.04) 48%, rgba(0,0,0,0.18) 100%)' }}
        />

        {/* Bottom: seamless fade into dark content section */}
        <div className="absolute bottom-0 left-0 right-0 h-36"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #e8eef8 100%)' }}
        />

        {/* ── Content: centered, bold, text-shadow for readability ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-40 text-center">

          {/* Big title – template style */}
          <h1
            className="font-black text-white leading-[1.0] tracking-tight mb-6 max-w-3xl"
            style={{
              fontSize: 'clamp(3rem, 6.5vw, 5.5rem)',
              textShadow: '0 2px 24px rgba(0,0,0,0.55), 0 0 80px rgba(0,0,0,0.25)',
            }}
          >
            Khám Phá Tour<br />Du Lịch Việt Nam
          </h1>

          {/* Subtitle */}
          <p
            className="text-white/75 text-xl font-semibold mb-12"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}
          >
            Tour hấp dẫn đang chờ bạn
          </p>

          {/* Pill search — exact template pattern */}
          <div
            className="flex items-center bg-white/96 backdrop-blur-sm rounded-full p-2 w-full shadow-[0_8px_40px_rgba(0,0,0,0.30)]"
            style={{ maxWidth: '560px' }}
          >
            <MdSearch size={20} className="text-gray-400 ml-4 shrink-0" />
            <input
              type="text"
              value={draft.search}
              onChange={e => setDraft(d => ({ ...d, search: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              placeholder="Tìm điểm đến hoặc tên tour..."
              className="flex-1 px-4 py-3.5 bg-transparent text-gray-700 text-[15px] focus:outline-none placeholder-gray-400 font-semibold"
            />
            <button
              onClick={handleApply}
              className="shrink-0 text-white font-extrabold px-8 py-3.5 rounded-full text-[15px] transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #1a7a50, #22c55e)' }}
            >
              Tìm kiếm
            </button>
          </div>

        </div>
      </section>

      {/* ── Content section – dark navy matching hero ── */}
      <div className="bg-[#e8eef8] animate-fade-in-up">
        {/* Section header bar */}
        <div className="border-b border-gray-200/80 bg-[#e8eef8]/95 backdrop-blur-sm sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSideOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(10,22,40,0.08)', color: '#0a1628', border: '1.5px solid rgba(10,22,40,0.2)' }}
              >
                <MdFilterList size={16} /> Bộ lọc
              </button>
              <div
                className="flex items-center gap-2 px-3.5 py-2 rounded border border-gray-200 bg-white text-sm font-semibold text-gray-700"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <MdSort size={15} className="text-gray-400" />
                <select value={sort} onChange={e => handleSort(e.target.value)}
                  className="focus:outline-none appearance-none bg-transparent cursor-pointer">
                  {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">

            {/* Sidebar (desktop) */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-28">
                <FilterSidebar draft={draft} destinations={destinations}
                  onDraftChange={p => setDraft(d => ({ ...d, ...p }))}
                  onApply={handleApply} onReset={handleReset} />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {applied.search && <Chip label={`"${applied.search}"`} onRemove={() => { setApplied(a => ({ ...a, search: '' })); setDraft(d => ({ ...d, search: '' })) }} />}
                {applied.destination && <Chip label={applied.destination} onRemove={() => { setApplied(a => ({ ...a, destination: '' })); setDraft(d => ({ ...d, destination: '' })) }} />}
                {applied.tourType && <Chip label={TOUR_TYPE_LABEL[applied.tourType]} onRemove={() => { setApplied(a => ({ ...a, tourType: '' })); setDraft(d => ({ ...d, tourType: '' })) }} />}
                {applied.days > 0 && <Chip label={DAYS_OPTS[applied.days].label} onRemove={() => { setApplied(a => ({ ...a, days: 0 })); setDraft(d => ({ ...d, days: 0 })) }} />}
                {(applied.priceMin > 0 || applied.priceMax < MAX_PRICE) && (
                  <Chip label={`${fmt(applied.priceMin)} – ${fmt(applied.priceMax)}`}
                    onRemove={() => { setApplied(a => ({ ...a, priceMin: 0, priceMax: MAX_PRICE })); setDraft(d => ({ ...d, priceMin: 0, priceMax: MAX_PRICE })) }} />
                )}
              </div>
            )}

            {/* Grid */}
            <div ref={gridRef} />
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={i} />)}
              </div>
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : filtered.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paged.map(t => <TourCard key={t.id} tour={t} />)}
                </div>
                <Pagination current={page} total={totalPages}
                  onChange={p => { setPage(p) }} />
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="font-black text-gray-900">Bộ lọc</span>
              <button onClick={() => setSideOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 transition-colors">
                <MdClose size={18} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar draft={draft} destinations={destinations}
                onDraftChange={p => setDraft(d => ({ ...d, ...p }))}
                onApply={handleApply} onReset={handleReset} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ToursPage
