import { useContext, useEffect, useMemo, useState } from 'react'
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

const TOUR_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  DOMESTIC:      { label: 'Trong nước',  color: '#1a5276', bg: '#eaf4fb' },
  INTERNATIONAL: { label: 'Nước ngoài',  color: '#7c3aed', bg: '#f3e8ff' },
}
const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

// ─── Stars ────────────────────────────────────────────────────────────────────

const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(n)
        ? <MdStar key={i} size={size} style={{ color: '#e67e22' }} />
        : <MdStarBorder key={i} size={size} className="text-gray-300" />
    )}
  </div>
)

// ─── Counter ──────────────────────────────────────────────────────────────────

const Counter = ({ label, sub, icon, value, min = 0, max = 20, onChange }: {
  label: string; sub?: string; icon: React.ReactNode
  value: number; min?: number; max?: number; onChange: (v: number) => void
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: '#eaf4fb', color: '#1a5276' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button disabled={value <= min} onClick={() => onChange(value - 1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500
                   hover:border-[#1a5276] hover:text-[#1a5276] disabled:opacity-30 disabled:cursor-not-allowed transition">
        <MdRemove size={14} />
      </button>
      <span className="w-6 text-center font-bold text-sm text-gray-900">{value}</span>
      <button disabled={value >= max} onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500
                   hover:border-[#1a5276] hover:text-[#1a5276] disabled:opacity-30 disabled:cursor-not-allowed transition">
        <MdAdd size={14} />
      </button>
    </div>
  </div>
)

// ─── Image Gallery ────────────────────────────────────────────────────────────

const ImageGallery = ({ images, name }: { images: TourImage[]; name: string }) => {
  const [idx, setIdx] = useState(0)
  const current = images[idx]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Main image */}
      <div className="relative h-72 sm:h-96 bg-gray-100 group overflow-hidden">
        {current ? (
          <img src={`data:image/jpeg;base64,${current.photo}`}
            alt={name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MdMap size={64} className="text-gray-200" />
          </div>
        )}

        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center
                         rounded-full bg-black/40 text-white hover:bg-black/60 transition opacity-0 group-hover:opacity-100">
              <MdKeyboardArrowLeft size={20} />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center
                         rounded-full bg-black/40 text-white hover:bg-black/60 transition opacity-0 group-hover:opacity-100">
              <MdKeyboardArrowRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: i === idx ? '#e67e22' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          </>
        )}

        {/* Count badge */}
        {images.length > 1 && (
          <span className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {idx + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all ring-2 ${
                i === idx ? 'ring-[#e67e22] opacity-100' : 'ring-transparent opacity-50 hover:opacity-80'
              }`}>
              <img src={`data:image/jpeg;base64,${img.photo}`}
                alt="" className="w-full h-full object-cover" />
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
  { key: 'itinerary',   label: 'Lịch trình',   icon: <MdCalendarMonth size={16} /> },
  { key: 'hotels',      label: 'Khách sạn',    icon: <MdHotel size={16} /> },
  { key: 'restaurants', label: 'Nhà hàng',     icon: <MdRestaurant size={16} /> },
  { key: 'reviews',     label: 'Đánh giá',     icon: <MdRateReview size={16} /> },
]

const ItineraryTab = ({ itineraries }: { itineraries: Itinerary[] }) => {
  if (!itineraries.length) return (
    <p className="text-center text-gray-400 text-sm py-10">Chưa có lịch trình chi tiết</p>
  )
  const sorted = [...itineraries].sort((a, b) => a.dayNumber - b.dayNumber)
  return (
    <div className="space-y-0">
      {sorted.map((it, idx) => (
        <div key={it.id} className="flex gap-4 pb-6 last:pb-0">
          {/* Timeline */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)' }}>
              {it.dayNumber}
            </div>
            {idx < sorted.length - 1 && (
              <div className="w-0.5 flex-1 mt-2 min-h-[16px]" style={{ backgroundColor: '#d1e8f5' }} />
            )}
          </div>
          <div className="flex-1 pb-2">
            <h4 className="font-bold text-gray-900 mb-1">{it.title}</h4>
            {it.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{it.description}</p>
            )}
            {it.activities && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: '#eaf4fb', color: '#1a5276' }}>
                <MdCheckCircle size={15} className="mt-0.5 shrink-0" />
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
  <div className="flex flex-col items-center py-12 text-center">
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-gray-300"
      style={{ backgroundColor: '#f1f5f9' }}>
      {icon}
    </div>
    <p className="text-gray-400 text-sm">{text}</p>
  </div>
)

const ReviewCard = ({ r }: { r: TourReview }) => (
  <div className="border border-gray-100 rounded-2xl p-4 hover:border-blue-100 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)' }}>
          {r.userName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{r.userName}</p>
          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
      <Stars n={r.rating} size={14} />
    </div>
    {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
  </div>
)

// ─── Booking Sidebar ──────────────────────────────────────────────────────────

interface BookingProps { tour: TourDetail }
const BookingSidebar = ({ tour }: BookingProps) => {
  const navigate   = useNavigate()
  const { userData } = useContext(AppContext)
  const [selectedDep, setSelectedDep] = useState<number | ''>('')
  const [adults,   setAdults]   = useState(2)
  const [children, setChildren] = useState(0)
  const [favorite, setFavorite] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favTours') || '[]').includes(tour.id) } catch { return false }
  })

  const activeDeps = (tour.departures ?? []).filter(d => d.availableSlots > 0)
  const chosenDep  = tour.departures?.find(d => d.id === selectedDep)
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
    navigate(`/tours/${tour.id}/book`, { state: { departureId: selectedDep, adults, children } })
  }

  return (
    <div className="space-y-4">
      {/* Price + book card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
        {/* Price */}
        <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Giá từ</p>
            <p className="text-3xl font-black" style={{ color: '#e67e22' }}>{fmt(tour.priceAdult)}</p>
            <p className="text-xs text-gray-400">/ người lớn</p>
          </div>
          <button onClick={toggleFavorite} title={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all"
            style={favorite
              ? { borderColor: '#e67e22', backgroundColor: '#fef5ec', color: '#e67e22' }
              : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
            {favorite ? <MdFavorite size={20} /> : <MdFavoriteBorder size={20} />}
          </button>
        </div>

        {tour.priceChild && (
          <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
            <MdChildCare size={14} className="text-gray-400" />
            Trẻ em: <span className="font-bold text-gray-700">{fmt(tour.priceChild)}</span>
          </p>
        )}

        {/* Departure select */}
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
            <MdCalendarMonth size={16} style={{ color: '#1a5276' }} />
            Ngày khởi hành
          </p>
          {activeDeps.length === 0 ? (
            <div className="text-center py-3 bg-gray-50 rounded-xl text-sm text-gray-400">
              Chưa có lịch khởi hành
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {(tour.departures ?? []).map(dep => {
                const avail = dep.availableSlots > 0
                return (
                  <button key={dep.id} disabled={!avail}
                    onClick={() => setSelectedDep(dep.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all
                                ${selectedDep === dep.id
                                  ? 'border-[#1a5276] text-[#1a5276]'
                                  : avail
                                    ? 'border-gray-200 text-gray-700 hover:border-[#1a5276]/50'
                                    : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-50'}`}
                    style={selectedDep === dep.id ? { backgroundColor: '#eaf4fb' } : {}}>
                    <span className="font-semibold">
                      {new Date(dep.departureDate).toLocaleDateString('vi-VN')}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      avail ? '' : 'bg-gray-100 text-gray-400'
                    }`} style={avail ? { backgroundColor: '#eaf4fb', color: '#1a5276' } : {}}>
                      {avail ? `${dep.availableSlots} chỗ` : 'Hết chỗ'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Person counters */}
        <div className="border border-gray-100 rounded-xl px-3 mb-4 divide-y divide-gray-100">
          <Counter label="Người lớn" sub="≥ 12 tuổi" icon={<MdPerson size={16} />}
            value={adults} min={1} onChange={setAdults} />
          <Counter label="Trẻ em" sub="2 – 11 tuổi" icon={<MdChildCare size={16} />}
            value={children} onChange={setChildren} />
        </div>

        {/* Total */}
        {selectedDep && (
          <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: '#eaf4fb' }}>
            <span className="text-sm font-semibold text-gray-700">Tổng cộng</span>
            <span className="text-lg font-black" style={{ color: '#1a5276' }}>{fmt(total)}</span>
          </div>
        )}

        {/* Book button */}
        <button onClick={handleBook}
          disabled={activeDeps.length === 0}
          className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl
                     transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)', boxShadow: '0 8px 24px rgba(26,82,118,0.3)' }}>
          <MdCalendarMonth size={18} /> Đặt tour ngay
        </button>
      </div>

      {/* Quick info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-bold text-gray-900 mb-3 text-sm">Thông tin nhanh</p>
        <div className="space-y-2.5">
          {[
            { icon: <MdAccessTime size={14} />, text: `${tour.durationDays} ngày` },
            { icon: <MdPeople size={14} />,     text: `Tối đa ${tour.maxSlots ?? '—'} người` },
            { icon: <MdCalendarMonth size={14} />, text: `${activeDeps.length} lịch còn chỗ` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-gray-600">
              <span className="text-[#1a5276]">{icon}</span>{text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TourDetailPage = () => {
  const { tourId } = useParams<{ tourId: string }>()
  const navigate   = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('itinerary')

  const { data: tour, isLoading } = useQuery<TourDetail>({
    queryKey: ['tour', tourId],
    queryFn: () => getTourById(tourId) as Promise<TourDetail>,
    enabled: !!tourId,
  })

  const { data: reviews = [] } = useQuery<TourReview[]>({
    queryKey: ['tour-reviews', tourId],
    queryFn: () => getTourReviews(tourId) as Promise<TourReview[]>,
    enabled: !!tourId,
  })

  // Redirect to list on 404
  useEffect(() => {
    if (!isLoading && !tour) navigate('/tours')
  }, [isLoading, tour, navigate])

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-10 h-10 border-2 border-t-[#1a5276] rounded-full animate-spin"
          style={{ borderColor: 'rgba(26,82,118,0.2)', borderTopColor: '#1a5276' }} />
      </div>
    </div>
  )
  if (!tour) return null

  const images  = tour.images ?? []
  const typeMeta = tour.tourType ? TOUR_TYPE[tour.tourType] : null

  const tabsWithCount: typeof TABS = TABS.map(t =>
    t.key === 'reviews' ? { ...t, label: `Đánh giá (${reviews.length})` } : t
  )

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Navbar />

      {/* ── Hero bar ──────────────────────────────────────────────────── */}
      <div className="pt-24 pb-10 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 70%, #1a7847 100%)' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-4">
            <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span>/</span>
            <button onClick={() => navigate('/tours')} className="hover:text-white transition-colors">Tour</button>
            <span>/</span>
            <span className="text-white font-semibold line-clamp-1">{tour.name}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {typeMeta && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}>
                    {typeMeta.label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">{tour.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/75 text-sm">
                {tour.destination && (
                  <span className="flex items-center gap-1.5">
                    <MdLocationOn size={15} style={{ color: '#e67e22' }} />{tour.destination}
                  </span>
                )}
                {tour.durationDays && (
                  <span className="flex items-center gap-1.5">
                    <MdAccessTime size={15} style={{ color: '#e67e22' }} />{tour.durationDays} ngày
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

            <button onClick={() => navigate('/tours')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 border border-white/25
                         text-white text-sm font-semibold hover:bg-white/25 transition-all shrink-0">
              <MdArrowBack size={16} /> Quay lại
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left (main) ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Gallery */}
            <ImageGallery images={images} name={tour.name} />

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 text-xl mb-4">Thông tin tour</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: <MdLocationOn size={18} />, label: 'Điểm đến', value: tour.destination ?? '—' },
                  { icon: <MdArrowForward size={18} />, label: 'Xuất phát', value: tour.departure ?? '—' },
                  { icon: <MdAccessTime size={18} />, label: 'Thời gian', value: `${tour.durationDays} ngày` },
                  { icon: <MdPeople size={18} />, label: 'Tối đa', value: `${tour.maxSlots ?? '—'} người` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ backgroundColor: '#f8fafc' }}>
                    <span className="mt-0.5" style={{ color: '#1a5276' }}>{icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {tour.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{tour.description}</p>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabsWithCount.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors
                                ${activeTab === t.key
                                  ? 'border-[#1a5276] text-[#1a5276]'
                                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'itinerary' && (
                  <ItineraryTab itineraries={tour.itineraries ?? []} />
                )}
                {activeTab === 'hotels' && (
                  <EmptyTab icon={<MdHotel size={32} />}
                    text="Thông tin khách sạn đang được cập nhật" />
                )}
                {activeTab === 'restaurants' && (
                  <EmptyTab icon={<MdRestaurant size={32} />}
                    text="Thông tin nhà hàng đang được cập nhật" />
                )}
                {activeTab === 'reviews' && (
                  reviews.length === 0 ? (
                    <EmptyTab icon={<MdRateReview size={32} />}
                      text="Chưa có đánh giá nào. Hãy là người đầu tiên!" />
                  ) : (
                    <div className="space-y-3">
                      {/* Summary */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl mb-5"
                        style={{ backgroundColor: '#f8fafc' }}>
                        <div className="text-center">
                          <p className="text-4xl font-black" style={{ color: '#e67e22' }}>
                            {tour.averageRating?.toFixed(1) ?? '—'}
                          </p>
                          <Stars n={tour.averageRating ?? 0} />
                          <p className="text-xs text-gray-400 mt-1">{reviews.length} đánh giá</p>
                        </div>
                        <div className="flex-1">
                          {[5,4,3,2,1].map(s => {
                            const count = reviews.filter(r => Math.round(r.rating) === s).length
                            const pct   = reviews.length ? (count / reviews.length) * 100 : 0
                            return (
                              <div key={s} className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500 w-3">{s}</span>
                                <MdStar size={12} style={{ color: '#e67e22' }} />
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: '#e67e22' }} />
                                </div>
                                <span className="text-xs text-gray-400 w-5">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {reviews.map(r => <ReviewCard key={r.id} r={r} />)}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ── Right (sidebar) ─────────────────────────────────────── */}
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
