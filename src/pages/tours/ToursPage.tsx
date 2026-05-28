import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineFilter,
  HiX,
  HiArrowRight,
  HiOutlineStar,
  HiStar,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineAdjustments,
  HiOutlineGlobeAlt,
} from 'react-icons/hi'
import { getAllTours } from '../../api/tourApi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

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
  days: number
  tourType: string
}

const PER_PAGE = 12
const MAX_PRICE = 50_000_000
const SORT_OPTS = [
  { value: 'newest', label: 'Moi nhat' },
  { value: 'price-asc', label: 'Gia: thap den cao' },
  { value: 'price-desc', label: 'Gia: cao den thap' },
  { value: 'rating', label: 'Danh gia cao nhat' },
]
const TOUR_TYPE_LABEL: Record<string, string> = {
  DOMESTIC: 'Trong nuoc',
  INTERNATIONAL: 'Nuoc ngoai',
}
const DAYS_OPTS = [
  { label: 'Tat ca', min: 0, max: Infinity },
  { label: '1 - 3 ngay', min: 1, max: 3 },
  { label: '4 - 7 ngay', min: 4, max: 7 },
  { label: '8 - 14 ngay', min: 8, max: 14 },
  { label: 'Tren 14 ngay', min: 15, max: Infinity },
]
const fmt = (n: number) => n.toLocaleString('vi-VN') + 'd'

interface RangeProps {
  min?: number
  max?: number
  step?: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}

const DualRangeSlider = ({
  min = 0,
  max = MAX_PRICE,
  step = 500_000,
  value: [lo, hi],
  onChange,
}: RangeProps) => {
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <div>
      <div className="relative h-6 flex items-center mb-3">
        <div className="absolute left-0 right-0 h-1.5 bg-muted rounded-full">
          <div
            className="absolute h-full rounded-full bg-primary"
            style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          className="absolute w-full h-0 appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          className="absolute w-full h-0 appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card"
        />
      </div>
      <div className="flex justify-between text-xs font-semibold text-primary">
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  )
}

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(n) ? (
        <HiStar key={i} size={13} className="text-accent" />
      ) : (
        <HiOutlineStar key={i} size={13} className="text-muted" />
      )
    )}
  </div>
)

const TourCard = ({ tour }: { tour: Tour }) => {
  const navigate = useNavigate()
  const img = tour.images?.[0]

  return (
    <article
      onClick={() => navigate(`/tours/${tour.id}`)}
      className="bg-card rounded-2xl border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer group overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={img ? `data:image/jpeg;base64,${img}` : `https://picsum.photos/seed/tour-${tour.id}/480/360`}
          alt={tour.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-4 left-4 flex gap-2">
          {tour.tourType && (
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                tour.tourType === 'DOMESTIC'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-accent-foreground'
              }`}
            >
              {TOUR_TYPE_LABEL[tour.tourType]}
            </span>
          )}
        </div>
        {tour.durationDays && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              <HiOutlineClock size={14} /> {tour.durationDays} ngay
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {tour.name}
        </h3>
        {tour.destination && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <HiOutlineLocationMarker size={14} className="text-primary" />
            {tour.destination}
          </p>
        )}
        {(tour.averageRating ?? 0) > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Stars n={tour.averageRating!} />
            <span className="text-xs text-muted-foreground">{tour.averageRating?.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Gia tu</p>
            <p className="text-lg font-semibold text-accent">
              {tour.priceAdult ? fmt(tour.priceAdult) : 'Lien he'}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            Xem tour
            <HiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  )
}

const TourCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-muted rounded w-4/5" />
      <div className="h-3 bg-muted rounded w-2/5" />
      <div className="h-3 bg-muted rounded w-1/3" />
      <div className="flex justify-between items-end pt-4 border-t border-border">
        <div className="h-5 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-16" />
      </div>
    </div>
  </div>
)

const Pagination = ({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (p: number) => void
}) => {
  if (total <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <HiChevronLeft size={18} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="w-10 h-10 flex items-center justify-center text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
              current === p
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <HiChevronRight size={18} />
      </button>
    </div>
  )
}

interface SidebarProps {
  draft: Filters
  destinations: string[]
  onDraftChange: (f: Partial<Filters>) => void
  onApply: () => void
  onReset: () => void
}

const FilterSidebar = ({ draft, destinations, onDraftChange, onApply, onReset }: SidebarProps) => (
  <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
    <h3 className="font-semibold text-foreground flex items-center gap-2">
      <HiOutlineAdjustments className="text-primary" size={18} /> Bo loc
    </h3>

    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        Ten tour
      </label>
      <div className="relative">
        <HiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tim theo ten tour..."
          value={draft.search}
          onChange={(e) => onDraftChange({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        Diem den
      </label>
      <div className="relative">
        <HiOutlineLocationMarker size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <select
          value={draft.destination}
          onChange={(e) => onDraftChange({ destination: e.target.value })}
          className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent rounded-xl text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Tat ca diem den</option>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
        Khoang gia
      </label>
      <DualRangeSlider
        value={[draft.priceMin, draft.priceMax]}
        onChange={([lo, hi]) => onDraftChange({ priceMin: lo, priceMax: hi })}
      />
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        Ngay khoi hanh
      </label>
      <DatePicker
        selected={draft.date}
        onChange={(d) => onDraftChange({ date: d })}
        placeholderText="Chon ngay khoi hanh"
        minDate={new Date()}
        dateFormat="dd/MM/yyyy"
        wrapperClassName="w-full"
        className="w-full px-4 py-3 bg-secondary border border-transparent rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        isClearable
      />
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        So ngay
      </label>
      <div className="space-y-1">
        {DAYS_OPTS.map((o, i) => (
          <button
            key={i}
            onClick={() => onDraftChange({ days: i })}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              draft.days === i
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        Loai tour
      </label>
      <div className="space-y-1">
        {[
          { value: '', label: 'Tat ca' },
          { value: 'DOMESTIC', label: 'Trong nuoc' },
          { value: 'INTERNATIONAL', label: 'Nuoc ngoai' },
        ].map((o) => (
          <button
            key={o.value}
            onClick={() => onDraftChange({ tourType: o.value })}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              draft.tourType === o.value
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>

    <div className="flex gap-3 pt-2">
      <button
        onClick={onReset}
        className="flex-1 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary transition-all"
      >
        Dat lai
      </button>
      <button
        onClick={onApply}
        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
      >
        Ap dung
      </button>
    </div>
  </div>
)

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-primary/10">
      <HiOutlineGlobeAlt size={36} className="text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">Khong tim thay tour</h3>
    <p className="text-muted-foreground text-sm mb-6 max-w-xs">
      Khong co tour nao khop voi bo loc hien tai. Hay thu thay doi dieu kien tim kiem.
    </p>
    <button
      onClick={onReset}
      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
    >
      Xoa bo loc
    </button>
  </div>
)

const DEFAULT_FILTERS: Filters = {
  search: '',
  destination: '',
  priceMin: 0,
  priceMax: MAX_PRICE,
  date: null,
  days: 0,
  tourType: '',
}

const ToursPage = () => {
  const [searchParams] = useSearchParams()
  const initDest = searchParams.get('destination') ?? ''

  const [draft, setDraft] = useState<Filters>({ ...DEFAULT_FILTERS, destination: initDest })
  const [applied, setApplied] = useState<Filters>({ ...DEFAULT_FILTERS, destination: initDest })
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [sideOpen, setSideOpen] = useState(false)

  const { data: allTours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ['tours'],
    queryFn: () => getAllTours() as Promise<Tour[]>,
  })

  const destinations = useMemo(
    () => [...new Set(allTours.map((t) => t.destination).filter(Boolean) as string[])].sort(),
    [allTours]
  )

  const filtered = useMemo(() => {
    const { search, destination, priceMin, priceMax, days, tourType } = applied
    const dur = DAYS_OPTS[days]

    let result = allTours.filter((t) => {
      if (
        search &&
        !t.name?.toLowerCase().includes(search.toLowerCase()) &&
        !t.destination?.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (destination && t.destination !== destination) return false
      if (priceMin > 0 && (t.priceAdult ?? 0) < priceMin) return false
      if ((t.priceAdult ?? 0) > priceMax) return false
      if (dur.min > 0 && ((t.durationDays ?? 0) < dur.min || (t.durationDays ?? 0) > dur.max)) return false
      if (tourType && t.tourType !== tourType) return false
      return true
    })

    switch (sort) {
      case 'price-asc':
        result = [...result].sort((a, b) => (a.priceAdult ?? 0) - (b.priceAdult ?? 0))
        break
      case 'price-desc':
        result = [...result].sort((a, b) => (b.priceAdult ?? 0) - (a.priceAdult ?? 0))
        break
      case 'rating':
        result = [...result].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        break
      default:
        result = [...result].sort((a, b) => b.id - a.id)
    }

    return result
  }, [allTours, applied, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleApply = () => {
    setApplied({ ...draft })
    setPage(1)
    setSideOpen(false)
  }
  const handleReset = () => {
    setDraft(DEFAULT_FILTERS)
    setApplied(DEFAULT_FILTERS)
    setPage(1)
    setSideOpen(false)
  }
  const handleSortChange = (v: string) => {
    setSort(v)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-16 px-6 bg-primary">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-4">
            <span>Trang chu</span>
            <span>/</span>
            <span className="text-primary-foreground font-medium">Tour du lich</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-primary-foreground mb-3">
            Kham pha tour du lich
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            <span className="text-primary-foreground font-semibold">{allTours.length}</span> tour hap dan dang cho ban
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                draft={draft}
                destinations={destinations}
                onDraftChange={(p) => setDraft((d) => ({ ...d, ...p }))}
                onApply={handleApply}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <p className="text-muted-foreground text-sm">
                Tim thay <span className="font-semibold text-foreground">{filtered.length}</span> tour
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSideOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-all"
                >
                  <HiOutlineFilter size={16} /> Bo loc
                </button>

                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary transition-colors"
                >
                  {SORT_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TourCardSkeleton key={i} />
                ))}
              </div>
            ) : paged.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paged.map((t) => (
                  <TourCard key={t.id} tour={t} />
                ))}
              </div>
            )}

            <Pagination current={page} total={totalPages} onChange={(p) => setPage(p)} />
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSideOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-background p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Bo loc</h3>
              <button onClick={() => setSideOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HiX size={20} />
              </button>
            </div>
            <FilterSidebar
              draft={draft}
              destinations={destinations}
              onDraftChange={(p) => setDraft((d) => ({ ...d, ...p }))}
              onApply={handleApply}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ToursPage
