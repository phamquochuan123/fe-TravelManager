import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import {
  MdSearch, MdFilterList, MdClose, MdLocationOn, MdAccessTime,
  MdStar, MdStarBorder, MdSort, MdKeyboardArrowLeft, MdKeyboardArrowRight,
  MdMap, MdArrowForward, MdVerified, MdTune,
} from 'react-icons/md'
import { getAllTours } from '../../api/tourApi'
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
  date: Date | null
  days: number   // 0 = all
  tourType: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE   = 12
const MAX_PRICE  = 50_000_000
const SORT_OPTS  = [
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
  { label: 'Tất cả',      min: 0,  max: Infinity },
  { label: '1 – 3 ngày',  min: 1,  max: 3 },
  { label: '4 – 7 ngày',  min: 4,  max: 7 },
  { label: '8 – 14 ngày', min: 8,  max: 14 },
  { label: 'Trên 14 ngày',min: 15, max: Infinity },
]
const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

// ─── Dual Range Slider ────────────────────────────────────────────────────────

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
    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow
    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white`

  return (
    <div>
      <div className="relative h-5 flex items-center mb-3">
        <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full">
          <div
            className="absolute h-full rounded-full"
            style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%`, backgroundColor: '#1a5276' }}
          />
        </div>
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          className={`${thumbCls} [&::-webkit-slider-thumb]:bg-[#1a5276]`}
        />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          className={`${thumbCls} [&::-webkit-slider-thumb]:bg-[#e67e22]`}
        />
      </div>
      <div className="flex justify-between text-xs font-semibold" style={{ color: '#1a5276' }}>
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  )
}

// ─── TourCard ─────────────────────────────────────────────────────────────────

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(n)
        ? <MdStar key={i} size={13} style={{ color: '#e67e22' }} />
        : <MdStarBorder key={i} size={13} className="text-gray-300" />
    )}
  </div>
)

const TourCard = ({ tour }: { tour: Tour }) => {
  const navigate = useNavigate()
  const img = tour.images?.[0]

  return (
    <article
      onClick={() => navigate(`/tours/${tour.id}`)}
      className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-blue-100/30
                 hover:-translate-y-2 transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100 shrink-0">
        {img ? (
          <img
            src={`data:image/jpeg;base64,${img}`}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={`https://picsum.photos/seed/tour-${tour.id}/480/320`}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {tour.tourType && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow text-white"
              style={{ backgroundColor: tour.tourType === 'DOMESTIC' ? '#1a5276' : '#7c3aed' }}>
              {TOUR_TYPE_LABEL[tour.tourType]}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow text-white"
            style={{ backgroundColor: '#e67e22' }}>
            <MdVerified size={10} className="inline mr-0.5" />Nổi bật
          </span>
        </div>
        {tour.durationDays && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2 py-1 rounded-full shadow">
              <MdAccessTime size={11} />{tour.durationDays} ngày
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2
                       group-hover:text-[#1a5276] transition-colors">
          {tour.name}
        </h3>
        {tour.destination && (
          <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MdLocationOn size={13} style={{ color: '#1a5276' }} />{tour.destination}
          </p>
        )}
        {(tour.averageRating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars n={tour.averageRating!} />
            <span className="text-xs text-gray-400">{tour.averageRating?.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Giá từ</p>
            <p className="text-base font-black" style={{ color: '#e67e22' }}>
              {tour.priceAdult ? fmt(tour.priceAdult) : 'Liên hệ'}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#1a5276' }}>
            Xem tour <MdArrowForward size={13} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  )
}

const TourCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3.5 bg-gray-200 rounded w-4/5" />
      <div className="h-3 bg-gray-100 rounded w-2/5" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="flex justify-between items-end pt-3 border-t border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
    </div>
  </div>
)

// ─── Custom Pagination ────────────────────────────────────────────────────────

const Pagination = ({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  const btnBase = `w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all`

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button disabled={current === 1} onClick={() => onChange(current - 1)}
        className={`${btnBase} border border-gray-200 hover:border-[#1a5276] hover:text-[#1a5276] disabled:opacity-40 disabled:cursor-not-allowed`}>
        <MdKeyboardArrowLeft size={18} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            className={`${btnBase} ${current === p
              ? 'text-white shadow-md'
              : 'border border-gray-200 text-gray-600 hover:border-[#1a5276] hover:text-[#1a5276]'
            }`}
            style={current === p ? { backgroundColor: '#1a5276' } : {}}>
            {p}
          </button>
        )
      )}

      <button disabled={current === total} onClick={() => onChange(current + 1)}
        className={`${btnBase} border border-gray-200 hover:border-[#1a5276] hover:text-[#1a5276] disabled:opacity-40 disabled:cursor-not-allowed`}>
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
  const labelCls = 'text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block'
  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700
                    focus:outline-none focus:border-[#1a5276] focus:ring-2 focus:ring-[#1a5276]/10 transition`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <MdTune style={{ color: '#1a5276' }} /> Bộ lọc
      </h3>

      {/* Search */}
      <div>
        <label className={labelCls}>Tên tour</label>
        <div className="relative">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm theo tên tour..." value={draft.search}
            onChange={e => onDraftChange({ search: e.target.value })}
            className={`${inputCls} pl-9`} />
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className={labelCls}>Điểm đến</label>
        <div className="relative">
          <MdLocationOn size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={draft.destination} onChange={e => onDraftChange({ destination: e.target.value })}
            className={`${inputCls} pl-9 appearance-none`}>
            <option value="">Tất cả điểm đến</option>
            {destinations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className={labelCls}>Khoảng giá</label>
        <DualRangeSlider
          value={[draft.priceMin, draft.priceMax]}
          onChange={([lo, hi]) => onDraftChange({ priceMin: lo, priceMax: hi })}
        />
      </div>

      {/* Departure date */}
      <div>
        <label className={labelCls}>Ngày khởi hành</label>
        <div className="relative">
          <DatePicker
            selected={draft.date}
            onChange={d => onDraftChange({ date: d })}
            placeholderText="Chọn ngày khởi hành"
            minDate={new Date()}
            dateFormat="dd/MM/yyyy"
            wrapperClassName="w-full"
            className={inputCls}
            isClearable
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className={labelCls}>Số ngày</label>
        <div className="space-y-1">
          {DAYS_OPTS.map((o, i) => (
            <button key={i} onClick={() => onDraftChange({ days: i })}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all
                          ${draft.days === i
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-50'}`}
              style={draft.days === i ? { backgroundColor: '#1a5276' } : {}}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tour type */}
      <div>
        <label className={labelCls}>Loại tour</label>
        <div className="space-y-1">
          {[{ value: '', label: 'Tất cả' }, { value: 'DOMESTIC', label: 'Trong nước' }, { value: 'INTERNATIONAL', label: 'Nước ngoài' }].map(o => (
            <button key={o.value} onClick={() => onDraftChange({ tourType: o.value })}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all
                          ${draft.tourType === o.value ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              style={draft.tourType === o.value ? { backgroundColor: '#1a5276' } : {}}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onReset}
          className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:border-gray-300 transition-all">
          Đặt lại
        </button>
        <button onClick={onApply}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#1a5276' }}>
          Áp dụng
        </button>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#eaf4fb' }}>
      <MdMap size={36} style={{ color: '#1a5276' }} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy tour</h3>
    <p className="text-gray-500 text-sm mb-6 max-w-xs">
      Không có tour nào khớp với bộ lọc hiện tại. Hãy thử thay đổi điều kiện tìm kiếm.
    </p>
    <button onClick={onReset}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
      style={{ backgroundColor: '#1a5276' }}>
      Xóa bộ lọc
    </button>
  </div>
)

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS: Filters = {
  search: '', destination: '', priceMin: 0, priceMax: MAX_PRICE,
  date: null, days: 0, tourType: '',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ToursPage = () => {
  const [searchParams] = useSearchParams()
  const initDest = searchParams.get('destination') ?? ''

  const [draft,   setDraft]   = useState<Filters>({ ...DEFAULT_FILTERS, destination: initDest })
  const [applied, setApplied] = useState<Filters>({ ...DEFAULT_FILTERS, destination: initDest })
  const [sort,    setSort]    = useState('newest')
  const [page,    setPage]    = useState(1)
  const [sideOpen, setSideOpen] = useState(false)

  // Fetch
  const { data: allTours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ['tours'],
    queryFn: () => getAllTours() as Promise<Tour[]>,
  })

  // Unique destinations for select
  const destinations = useMemo(() =>
    [...new Set(allTours.map(t => t.destination).filter(Boolean) as string[])].sort(),
    [allTours]
  )

  // Apply filters + sort
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

  const handleApply = () => { setApplied({ ...draft }); setPage(1); setSideOpen(false) }
  const handleReset = () => {
    setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); setPage(1); setSideOpen(false)
  }
  const handleSortChange = (v: string) => { setSort(v); setPage(1) }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-14 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 60%, #1a7847 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'url(https://picsum.photos/seed/tours-hero/1920/400)', backgroundSize: 'cover' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-4">
            <span>Trang chủ</span>
            <span>/</span>
            <span className="text-white font-semibold">Tour du lịch</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            Khám phá tour du lịch
          </h1>
          <p className="text-white/70 text-lg">
            <span className="text-white font-bold">{allTours.length}</span> tour hấp dẫn đang chờ bạn
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-7">

          {/* ── Sidebar (desktop) ─────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                draft={draft} destinations={destinations}
                onDraftChange={p => setDraft(d => ({ ...d, ...p }))}
                onApply={handleApply} onReset={handleReset}
              />
            </div>
          </aside>

          {/* ── Main ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <p className="text-gray-600 text-sm">
                Tìm thấy <span className="font-bold text-gray-900">{filtered.length}</span> tour
                {applied.destination && <> tại <span className="font-bold" style={{ color: '#1a5276' }}>{applied.destination}</span></>}
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setSideOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#1a5276] hover:text-[#1a5276] transition"
                >
                  <MdFilterList size={16} /> Bộ lọc
                </button>
                <div className="flex items-center gap-1.5">
                  <MdSort size={16} className="text-gray-400" />
                  <select value={sort} onChange={e => handleSortChange(e.target.value)}
                    className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1a5276] appearance-none bg-white cursor-pointer">
                    {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {(applied.search || applied.destination || applied.tourType || applied.days > 0 ||
              applied.priceMin > 0 || applied.priceMax < MAX_PRICE) && (
              <div className="flex flex-wrap gap-2 mb-4">
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
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paged.map(t => <TourCard key={t.id} tour={t} />)}
                </div>
                <Pagination current={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSideOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">Bộ lọc</span>
              <button onClick={() => setSideOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                draft={draft} destinations={destinations}
                onDraftChange={p => setDraft(d => ({ ...d, ...p }))}
                onApply={handleApply} onReset={handleReset}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
    style={{ backgroundColor: '#1a5276' }}>
    {label}
    <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
      <MdClose size={12} />
    </button>
  </span>
)

export default ToursPage
