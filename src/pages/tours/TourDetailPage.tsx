import { useContext, useEffect, useRef, useState } from 'react'
import { resolveBase64Image } from '@/lib/utils'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  MdLocationOn, MdAccessTime, MdPeople, MdStar, MdStarBorder,
  MdFavorite, MdFavoriteBorder, MdArrowForward, MdArrowBack,
  MdCalendarMonth, MdAdd, MdRemove, MdMap, MdHotel, MdRestaurant,
  MdRateReview, MdCheckCircle, MdPerson, MdChildCare,
  MdKeyboardArrowLeft, MdKeyboardArrowRight,
} from 'react-icons/md'
import { getTourById, getTourReviews } from '../../api/tourApi'
import { AppContext } from '../../context/AppContext'
import { Skeleton } from '../../components/ui/skeleton'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourImage { id?: number; photo: string }
interface Departure { id: number; departureDate: string; availableSlots: number }
interface Itinerary {
  id: number; dayNumber: number; title: string
  description?: string; activities?: string
}
interface TourReview {
  id: number; userName: string; rating: number
  comment?: string; createdAt: string
}
interface TourDetail {
  id: number
  name: string
  destination?: string
  departure?: string
  durationDays?: number
  priceAdult: number
  priceChild?: number
  tourType?: 'DOMESTIC' | 'INTERNATIONAL'
  maxSlots?: number
  description?: string
  averageRating?: number
  totalReviews?: number
  images?: TourImage[]
  itineraries?: Itinerary[]
  departures?: Departure[]
  includedServices?: string
  cancellationPolicy?: string
}

const TOUR_TYPE: Record<string, { label: string; bg: string; color: string }> = {
  DOMESTIC:      { label: 'Trong nước', bg: 'rgba(10,22,40,0.12)', color: '#0a1628' },
  INTERNATIONAL: { label: 'Nước ngoài', bg: 'rgba(109,40,217,0.12)', color: '#6d28d9' },
}
const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

// ─── Stars ────────────────────────────────────────────────────────────────────

const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(n)
        ? <MdStar key={i} size={size} className="text-[#c9a84c]" />
        : <MdStarBorder key={i} size={size} className="text-gray-300" />
    )}
  </div>
)

// ─── Counter ──────────────────────────────────────────────────────────────────

const Counter = ({ label, sub, icon, value, min = 0, max = 20, onChange }: {
  label: string; sub?: string; icon: React.ReactNode
  value: number; min?: number; max?: number; onChange: (v: number) => void
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded flex items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2.5">
      <button disabled={value <= min} onClick={() => onChange(value - 1)}
        className="w-8 h-8 flex items-center justify-center rounded border-2 border-gray-200 text-gray-500 hover:border-[#0a1628] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <MdRemove size={14} />
      </button>
      <span className="w-7 text-center font-black text-base text-gray-900">{value}</span>
      <button disabled={value >= max} onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center rounded border-2 border-gray-200 text-gray-500 hover:border-[#0a1628] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <MdAdd size={14} />
      </button>
    </div>
  </div>
)

// ─── Image Gallery ────────────────────────────────────────────────────────────

const ImageGallery = ({ images, name, tourId }: { images: TourImage[]; name: string; tourId: number }) => {
  const [idx, setIdx] = useState(0)
  const current = images[idx]

  return (
    <div className="overflow-hidden rounded-sm" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
      {/* Main image */}
      <div className="relative overflow-hidden group" style={{ height: 'clamp(280px, 50vh, 520px)' }}>
        {current ? (
          <img
            src={resolveBase64Image(current.photo, '')}
            alt={name}
            key={idx}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <img
              src={`https://picsum.photos/seed/tour-${tourId}/1200/600`}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
              <MdKeyboardArrowLeft size={22} />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
              <MdKeyboardArrowRight size={22} />
            </button>
            <span
              className="absolute top-4 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
              {idx + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 p-3 overflow-x-auto bg-[#06101e]">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-16 h-14 rounded overflow-hidden transition-all duration-200 ${
                i === idx ? 'ring-2 ring-[#c9a84c] opacity-100 scale-105' : 'opacity-40 hover:opacity-70'
              }`}>
              <img src={resolveBase64Image(img.photo, '')} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey = 'itinerary' | 'includes' | 'hotels' | 'restaurants' | 'reviews'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'itinerary',   label: 'Lịch trình',  icon: <MdCalendarMonth size={16} /> },
  { key: 'hotels',      label: 'Khách sạn',   icon: <MdHotel size={16} /> },
  { key: 'restaurants', label: 'Nhà hàng',    icon: <MdRestaurant size={16} /> },
  { key: 'reviews',     label: 'Đánh giá',    icon: <MdRateReview size={16} /> },
]

const ItineraryTab = ({ itineraries }: { itineraries: Itinerary[] }) => {
  if (!itineraries.length) return (
    <p className="text-center text-gray-400 text-sm py-10">Chưa có lịch trình chi tiết</p>
  )
  const sorted = [...itineraries].sort((a, b) => a.dayNumber - b.dayNumber)
  return (
    <div className="space-y-0">
      {sorted.map((it, i) => (
        <div key={it.id} className="flex gap-5 pb-7 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className="w-11 h-11 rounded flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 12px rgba(10,22,40,0.3)' }}>
              {it.dayNumber}
            </div>
            {i < sorted.length - 1 && (
              <div className="w-0.5 flex-1 mt-3 min-h-[20px]"
                style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.3), transparent)' }} />
            )}
          </div>
          <div className="flex-1 pt-1.5 pb-2">
            <h4 className="font-bold text-gray-900 mb-2 text-base">{it.title}</h4>
            {it.description && (
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{it.description}</p>
            )}
            {it.activities && (
              <div className="flex items-start gap-2.5 px-4 py-2.5 rounded text-sm"
                style={{ background: 'rgba(10,22,40,0.06)', color: '#0a1628' }}>
                <MdCheckCircle size={15} className="mt-0.5 shrink-0 text-[#0a1628]" />
                <span>{it.activities}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const EmptyTab = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex flex-col items-center py-14 text-center">
    <div className="w-16 h-16 rounded flex items-center justify-center mb-4 text-gray-400"
      style={{ background: 'rgba(10,22,40,0.06)' }}>
      {icon}
    </div>
    <p className="text-gray-400 text-sm">{text}</p>
  </div>
)

const ReviewCard = ({ r }: { r: TourReview }) => (
  <div className="rounded p-5 hover:shadow-md transition-shadow border border-gray-100"
    style={{ background: '#fff' }}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
          style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
          {r.userName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{r.userName}</p>
          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
      <Stars n={r.rating} size={14} />
    </div>
    {r.comment && <p className="text-sm text-gray-500 leading-relaxed">{r.comment}</p>}
  </div>
)

// ─── Booking Sidebar ──────────────────────────────────────────────────────────

interface BookingProps { tour: TourDetail }
const BookingSidebar = ({ tour }: BookingProps) => {
  const navigate     = useNavigate()
  const { userData } = useContext(AppContext)
  const [selectedDep, setSelectedDep] = useState<number | ''>('')
  const [adults,   setAdults]   = useState(2)
  const [children, setChildren] = useState(0)
  const [favorite, setFavorite] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favTours') || '[]').includes(tour.id) } catch { return false }
  })

  const activeDeps = (tour.departures ?? []).filter(d => d.availableSlots > 0)
  const total      = adults * tour.priceAdult + children * (tour.priceChild ?? 0)

  const toggleFavorite = () => {
    const favs: number[] = JSON.parse(localStorage.getItem('favTours') || '[]')
    const next = favorite ? favs.filter(id => id !== tour.id) : [...favs, tour.id]
    localStorage.setItem('favTours', JSON.stringify(next))
    setFavorite(!favorite)
    toast.success(favorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích')
  }

  const handleBook = () => {
    if (!userData) { toast.error('Vui lòng đăng nhập để đặt tour'); navigate('/login'); return }
    if (!selectedDep) { toast.error('Vui lòng chọn ngày khởi hành'); return }
    const dep = activeDeps.find(d => d.id === selectedDep)
    navigate(`/tours/${tour.id}/book`, { state: { departureId: selectedDep, adults, children, departureDate: dep?.departureDate } })
  }

  return (
    <div className="sticky top-24 space-y-4">
      {/* Main booking card */}
      <div className="rounded-sm bg-white border border-gray-100 p-6"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

        {/* Price row */}
        <div className="flex items-end justify-between mb-5 pb-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Giá từ</p>
            <p className="font-black leading-none" style={{ fontSize: '2rem', color: '#c9a84c' }}>
              {fmt(tour.priceAdult)}
            </p>
            <p className="text-xs text-gray-400 mt-1">/ người lớn</p>
          </div>
          <button
            onClick={toggleFavorite}
            title={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            className={`w-11 h-11 flex items-center justify-center rounded border-2 transition-all hover:scale-110 active:scale-95 ${
              favorite
                ? 'border-[#c9a84c] text-[#c9a84c]'
                : 'border-gray-200 text-gray-400 hover:border-[#c9a84c] hover:text-[#c9a84c]'
            }`}
            style={favorite ? { background: 'rgba(201,168,76,0.08)' } : {}}>
            {favorite ? <MdFavorite size={20} /> : <MdFavoriteBorder size={20} />}
          </button>
        </div>

        {tour.priceChild && (
          <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
            <MdChildCare size={14} />
            Trẻ em: <span className="font-bold text-gray-700">{fmt(tour.priceChild)}</span>
          </p>
        )}

        {/* Departure picker */}
        <div className="mb-5">
          <p className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
            <MdCalendarMonth size={16} style={{ color: '#0a1628' }} />
            Ngày khởi hành
          </p>
          {activeDeps.length === 0 ? (
            <div className="text-center py-4 rounded text-sm text-gray-400 bg-[#f8f5ee]">
              Chưa có lịch khởi hành
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {(tour.departures ?? []).map(dep => {
                const avail = dep.availableSlots > 0
                const isSelected = selectedDep === dep.id
                return (
                  <button
                    key={dep.id}
                    disabled={!avail}
                    onClick={() => setSelectedDep(dep.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded border-2 text-sm transition-all ${
                      isSelected
                        ? 'text-white'
                        : avail
                          ? 'border-gray-200 text-gray-700 hover:border-[#0a1628]/40 bg-white'
                          : 'border-gray-100 text-gray-300 cursor-not-allowed bg-[#f8f5ee]'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', borderColor: 'transparent' } : {}}>
                    <span className="font-bold">
                      {new Date(dep.departureDate).toLocaleDateString('vi-VN')}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : avail
                          ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {avail ? `${dep.availableSlots} chỗ` : 'Hết chỗ'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Counters */}
        <div className="rounded border border-gray-100 px-4 mb-5 divide-y divide-gray-100">
          <Counter label="Người lớn" sub="≥ 12 tuổi" icon={<MdPerson size={16} />}
            value={adults} min={1} onChange={setAdults} />
          <Counter label="Trẻ em" sub="2 – 11 tuổi" icon={<MdChildCare size={16} />}
            value={children} onChange={setChildren} />
        </div>

        {/* Total */}
        {selectedDep && (
          <div className="flex items-center justify-between mb-5 px-4 py-3.5 rounded"
            style={{ background: 'rgba(10,22,40,0.06)' }}>
            <span className="text-sm font-bold text-gray-700">Tổng cộng</span>
            <span className="text-xl font-black" style={{ color: '#0a1628' }}>{fmt(total)}</span>
          </div>
        )}

        {/* Book button */}
        <button
          onClick={handleBook}
          disabled={activeDeps.length === 0}
          className="w-full flex items-center justify-center gap-2.5 text-white font-black py-4 rounded transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)', boxShadow: '0 6px 20px rgba(201,168,76,0.4)' }}>
          <MdCalendarMonth size={20} /> Đặt tour ngay
        </button>
      </div>

      {/* Quick info card */}
      <div className="rounded-sm bg-white border border-gray-100 p-5"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        <p className="font-black text-gray-900 mb-4 text-sm">Thông tin nhanh</p>
        <div className="space-y-3">
          {[
            { icon: <MdAccessTime size={14} />, label: 'Thời gian',   value: `${tour.durationDays} ngày` },
            { icon: <MdPeople size={14} />,      label: 'Tối đa',      value: `${tour.maxSlots ?? '—'} người` },
            { icon: <MdCalendarMonth size={14} />, label: 'Còn chỗ',  value: `${activeDeps.length} lịch` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <span style={{ color: '#0a1628' }}>{icon}</span>
                {label}
              </div>
              <span className="font-bold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TourDetailPage = () => {
  const { tourId }  = useParams<{ tourId: string }>()
  const navigate    = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('itinerary')
  const tabsRef = useRef<HTMLDivElement>(null)

  const { data: tour, isLoading, isError } = useQuery<TourDetail>({
    queryKey: ['tour', tourId],
    queryFn: () => getTourById(tourId) as Promise<TourDetail>,
    enabled: !!tourId,
  })

  const { data: reviews = [] } = useQuery<TourReview[]>({
    queryKey: ['tour-reviews', tourId],
    queryFn: () => getTourReviews(tourId) as Promise<TourReview[]>,
    enabled: !!tourId,
  })

  useEffect(() => {
    if (!isLoading && !tour) navigate('/tours')
  }, [isLoading, tour, navigate])

  if (isLoading) return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <Navbar />
      {/* Hero skeleton */}
      <div className="pt-24 pb-16 px-6" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0a1628 60%, #0a1929 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-3.5 w-48 mb-6 bg-white/10" />
          <Skeleton className="h-9 w-2/3 mb-4 bg-white/10" />
          <Skeleton className="h-4 w-80 bg-white/10" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[420px] w-full rounded-sm" />
            <div className="rounded-sm bg-white border border-gray-100 p-7">
              <Skeleton className="h-6 w-40 mb-5" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="rounded-sm bg-white border border-gray-100 p-7">
              <div className="flex gap-6 mb-7 border-b border-gray-100 pb-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-20" />)}
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-5 mb-7">
                  <Skeleton className="h-11 w-11 shrink-0 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[360px] w-full rounded-sm" />
            <Skeleton className="h-[140px] w-full rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  )

  if (isError) return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 rounded flex items-center justify-center mb-5"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <MdMap size={36} style={{ color: '#dc2626' }} />
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-2">Không thể tải thông tin tour</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
          Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.
        </p>
        <button onClick={() => navigate('/tours')}
          className="flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
          <MdArrowBack size={14} /> Quay lại danh sách tour
        </button>
      </div>
    </div>
  )

  if (!tour) return null

  const images   = tour.images ?? []
  const typeMeta = tour.tourType ? TOUR_TYPE[tour.tourType] : null

  const tabsWithCount: typeof TABS = TABS.map(t =>
    t.key === 'reviews' ? { ...t, label: `Đánh giá (${reviews.length})` } : t
  )

  return (
    <div className="min-h-screen bg-[#f8f5ee] animate-fade-in-up" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <div
        className="relative overflow-hidden pt-24 pb-12 px-6"
        style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0a1628 60%, #0a1929 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(https://picsum.photos/seed/tour-${tour.id}/1920/400)` }} />
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-[#f8f5ee]"
          style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="flex items-center gap-2 text-white/40 text-sm mb-5">
            <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span>/</span>
            <button onClick={() => navigate('/tours')} className="hover:text-white transition-colors">Tour</button>
            <span>/</span>
            <span className="text-white/70 font-medium line-clamp-1 max-w-xs">{tour.name}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-4">
                {typeMeta && (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.color}30` }}>
                    {typeMeta.label}
                  </span>
                )}
              </div>
              <h1 className="font-black text-white tracking-tight mb-4" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)' }}>
                {tour.name}
              </h1>
              <div className="flex flex-wrap items-center gap-5 text-white/60 text-sm">
                {tour.destination && (
                  <span className="flex items-center gap-1.5">
                    <MdLocationOn size={15} className="text-[#c9a84c]" />{tour.destination}
                  </span>
                )}
                {tour.durationDays && (
                  <span className="flex items-center gap-1.5">
                    <MdAccessTime size={15} className="text-[#c9a84c]" />{tour.durationDays} ngày
                  </span>
                )}
                {(tour.averageRating ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Stars n={tour.averageRating!} size={14} />
                    <span className="text-white font-semibold">{tour.averageRating?.toFixed(1)}</span>
                    <span>({reviews.length} đánh giá)</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/tours')}
              className="flex items-center gap-2 px-5 py-2.5 rounded text-white text-sm font-bold hover:scale-105 active:scale-95 transition-all shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <MdArrowBack size={16} /> Quay lại
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            <ImageGallery images={images} name={tour.name} tourId={tour.id} />

            {/* Info summary */}
            <div className="rounded-sm bg-white border border-gray-100 p-7"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              <h2 className="font-black text-gray-900 text-xl mb-5">Thông tin tour</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: <MdLocationOn size={18} />,   label: 'Điểm đến',  value: tour.destination ?? '—' },
                  { icon: <MdArrowForward size={18} />, label: 'Xuất phát', value: tour.departure ?? '—' },
                  { icon: <MdAccessTime size={18} />,   label: 'Thời gian', value: `${tour.durationDays} ngày` },
                  { icon: <MdPeople size={18} />,       label: 'Tối đa',    value: `${tour.maxSlots ?? '—'} người` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-4 rounded"
                    style={{ background: 'rgba(10,22,40,0.05)' }}>
                    <span className="mt-0.5" style={{ color: '#0a1628' }}>{icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {tour.description && (
                <p className="text-gray-500 text-sm leading-relaxed">{tour.description}</p>
              )}
            </div>

            {/* Tabs section */}
            <div className="rounded-sm bg-white border border-gray-100 overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }} ref={tabsRef}>

              {/* Sticky tab header */}
              <div className="flex border-b border-gray-100 overflow-x-auto sticky top-[64px] bg-white z-10">
                {tabsWithCount.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap shrink-0 transition-all ${
                      activeTab === t.key
                        ? 'border-[#c9a84c] text-[#0a1628]'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              <div className="p-7">
                {activeTab === 'itinerary' && <ItineraryTab itineraries={tour.itineraries ?? []} />}
                {activeTab === 'hotels' && (
                  <EmptyTab icon={<MdHotel size={32} />} text="Thông tin khách sạn đang được cập nhật" />
                )}
                {activeTab === 'restaurants' && (
                  <EmptyTab icon={<MdRestaurant size={32} />} text="Thông tin nhà hàng đang được cập nhật" />
                )}
                {activeTab === 'reviews' && (
                  reviews.length === 0 ? (
                    <EmptyTab icon={<MdRateReview size={32} />} text="Chưa có đánh giá nào. Hãy là người đầu tiên!" />
                  ) : (
                    <div>
                      {/* Rating overview */}
                      <div className="flex items-center gap-6 p-5 rounded mb-6"
                        style={{ background: 'rgba(10,22,40,0.04)' }}>
                        <div className="text-center shrink-0">
                          <p className="font-black leading-none mb-2" style={{ fontSize: '3rem', color: '#c9a84c' }}>
                            {tour.averageRating?.toFixed(1) ?? '—'}
                          </p>
                          <Stars n={tour.averageRating ?? 0} />
                          <p className="text-xs text-gray-400 mt-1">{reviews.length} đánh giá</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5,4,3,2,1].map(s => {
                            const count = reviews.filter(r => Math.round(r.rating) === s).length
                            const pct   = reviews.length ? (count / reviews.length) * 100 : 0
                            return (
                              <div key={s} className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-3">{s}</span>
                                <MdStar size={12} className="text-[#c9a84c]" />
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9a84c, #b8960e)' }} />
                                </div>
                                <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {reviews.map(r => <ReviewCard key={r.id} r={r} />)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right (booking sidebar) */}
          <div>
            <BookingSidebar tour={tour} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default TourDetailPage
