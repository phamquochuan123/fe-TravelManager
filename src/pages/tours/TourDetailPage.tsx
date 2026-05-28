import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiStar,
  HiOutlineHeart,
  HiHeart,
  HiArrowRight,
  HiArrowLeft,
  HiOutlineCalendar,
  HiPlus,
  HiMinus,
  HiOutlineGlobeAlt,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineChatAlt2,
  HiOutlineCheck,
  HiOutlineUser,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi'
import { getTourById, getTourReviews } from '../../api/tourApi'
import { AppContext } from '../../context/AppContext'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

interface TourImage {
  id?: number
  photo: string
}
interface Departure {
  id: number
  departureDate: string
  availableSlots: number
}
interface Itinerary {
  id: number
  dayNumber: number
  title: string
  description?: string
  activities?: string
}
interface TourReview {
  id: number
  userName: string
  rating: number
  comment?: string
  createdAt: string
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

const TOUR_TYPE: Record<string, { label: string; className: string }> = {
  DOMESTIC: { label: 'Trong nuoc', className: 'bg-primary text-primary-foreground' },
  INTERNATIONAL: { label: 'Nuoc ngoai', className: 'bg-accent text-accent-foreground' },
}
const fmt = (n: number) => n.toLocaleString('vi-VN') + 'd'

const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < Math.round(n) ? (
        <HiStar key={i} size={size} className="text-accent" />
      ) : (
        <HiOutlineStar key={i} size={size} className="text-muted" />
      )
    )}
  </div>
)

const Counter = ({
  label,
  sub,
  icon,
  value,
  min = 0,
  max = 20,
  onChange,
}: {
  label: string
  sub?: string
  icon: React.ReactNode
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <HiMinus size={14} />
      </button>
      <span className="w-6 text-center font-semibold text-sm text-foreground">{value}</span>
      <button
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <HiPlus size={14} />
      </button>
    </div>
  </div>
)

const ImageGallery = ({ images, name }: { images: TourImage[]; name: string }) => {
  const [idx, setIdx] = useState(0)
  const current = images[idx]

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="relative aspect-[16/9] bg-muted group overflow-hidden">
        {current ? (
          <img
            src={`data:image/jpeg;base64,${current.photo}`}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineGlobeAlt size={64} className="text-muted-foreground/30" />
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-sm text-foreground hover:bg-card transition-all opacity-0 group-hover:opacity-100"
            >
              <HiChevronLeft size={20} />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-sm text-foreground hover:bg-card transition-all opacity-0 group-hover:opacity-100"
            >
              <HiChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === idx ? 'bg-accent w-6' : 'bg-card/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {images.length > 1 && (
          <span className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            {idx + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all ring-2 ${
                i === idx ? 'ring-accent opacity-100' : 'ring-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={`data:image/jpeg;base64,${img.photo}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type TabKey = 'itinerary' | 'hotels' | 'restaurants' | 'reviews'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'itinerary', label: 'Lich trinh', icon: <HiOutlineCalendar size={16} /> },
  { key: 'hotels', label: 'Khach san', icon: <HiOutlineHome size={16} /> },
  { key: 'restaurants', label: 'Nha hang', icon: <HiOutlineSparkles size={16} /> },
  { key: 'reviews', label: 'Danh gia', icon: <HiOutlineChatAlt2 size={16} /> },
]

const ItineraryTab = ({ itineraries }: { itineraries: Itinerary[] }) => {
  if (!itineraries.length)
    return <p className="text-center text-muted-foreground text-sm py-12">Chua co lich trinh chi tiet</p>
  const sorted = [...itineraries].sort((a, b) => a.dayNumber - b.dayNumber)
  return (
    <div className="space-y-0">
      {sorted.map((it, idx) => (
        <div key={it.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-primary text-primary-foreground shrink-0">
              {it.dayNumber}
            </div>
            {idx < sorted.length - 1 && <div className="w-0.5 flex-1 mt-2 min-h-[16px] bg-border" />}
          </div>
          <div className="flex-1 pb-2">
            <h4 className="font-semibold text-foreground mb-1">{it.title}</h4>
            {it.description && <p className="text-sm text-muted-foreground leading-relaxed mb-2">{it.description}</p>}
            {it.activities && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm">
                <HiOutlineCheck size={15} className="mt-0.5 shrink-0" />
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
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-muted text-muted-foreground">
      {icon}
    </div>
    <p className="text-muted-foreground text-sm">{text}</p>
  </div>
)

const ReviewCard = ({ r }: { r: TourReview }) => (
  <div className="border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold shrink-0">
          {r.userName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{r.userName}</p>
          <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
      <Stars n={r.rating} size={14} />
    </div>
    {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
  </div>
)

interface BookingProps {
  tour: TourDetail
}

const BookingSidebar = ({ tour }: BookingProps) => {
  const navigate = useNavigate()
  const { userData } = useContext(AppContext)
  const [selectedDep, setSelectedDep] = useState<number | ''>('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [favorite, setFavorite] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favTours') || '[]').includes(tour.id)
    } catch {
      return false
    }
  })

  const activeDeps = (tour.departures ?? []).filter((d) => d.availableSlots > 0)
  const total = adults * tour.priceAdult + children * (tour.priceChild ?? 0)

  const toggleFavorite = () => {
    const favs: number[] = JSON.parse(localStorage.getItem('favTours') || '[]')
    const next = favorite ? favs.filter((id) => id !== tour.id) : [...favs, tour.id]
    localStorage.setItem('favTours', JSON.stringify(next))
    setFavorite(!favorite)
    toast.success(favorite ? 'Da bo yeu thich' : 'Da them vao yeu thich')
  }

  const handleBook = () => {
    if (!userData) {
      toast.error('Vui long dang nhap de dat tour')
      navigate('/login')
      return
    }
    if (!selectedDep) {
      toast.error('Vui long chon ngay khoi hanh')
      return
    }
    navigate(`/tours/${tour.id}/book`, { state: { departureId: selectedDep, adults, children } })
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
        <div className="flex items-end justify-between mb-6 pb-6 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gia tu</p>
            <p className="text-3xl font-serif font-semibold text-accent">{fmt(tour.priceAdult)}</p>
            <p className="text-xs text-muted-foreground">/ nguoi lon</p>
          </div>
          <button
            onClick={toggleFavorite}
            title={favorite ? 'Bo yeu thich' : 'Yeu thich'}
            className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all ${
              favorite
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
            }`}
          >
            {favorite ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
          </button>
        </div>

        {tour.priceChild && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
            <HiOutlineUser size={14} />
            Tre em: <span className="font-semibold text-foreground">{fmt(tour.priceChild)}</span>
          </p>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <HiOutlineCalendar size={16} className="text-primary" />
            Ngay khoi hanh
          </p>
          {activeDeps.length === 0 ? (
            <div className="text-center py-4 bg-muted rounded-xl text-sm text-muted-foreground">
              Chua co lich khoi hanh
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {(tour.departures ?? []).map((dep) => {
                const avail = dep.availableSlots > 0
                return (
                  <button
                    key={dep.id}
                    disabled={!avail}
                    onClick={() => setSelectedDep(dep.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                      selectedDep === dep.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : avail
                          ? 'border-border text-foreground hover:border-primary/50'
                          : 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="font-medium">{new Date(dep.departureDate).toLocaleDateString('vi-VN')}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        avail ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {avail ? `${dep.availableSlots} cho` : 'Het cho'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border border-border rounded-xl px-4 mb-4 divide-y divide-border">
          <Counter
            label="Nguoi lon"
            sub=">= 12 tuoi"
            icon={<HiOutlineUser size={16} />}
            value={adults}
            min={1}
            onChange={setAdults}
          />
          <Counter
            label="Tre em"
            sub="2 - 11 tuoi"
            icon={<HiOutlineUser size={16} />}
            value={children}
            onChange={setChildren}
          />
        </div>

        {selectedDep && (
          <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-primary/10">
            <span className="text-sm font-medium text-foreground">Tong cong</span>
            <span className="text-lg font-semibold text-primary">{fmt(total)}</span>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={activeDeps.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <HiOutlineCalendar size={18} /> Dat tour ngay
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="font-medium text-foreground mb-4 text-sm">Thong tin nhanh</p>
        <div className="space-y-3">
          {[
            { icon: <HiOutlineClock size={16} />, text: `${tour.durationDays} ngay` },
            { icon: <HiOutlineUserGroup size={16} />, text: `Toi da ${tour.maxSlots ?? '-'} nguoi` },
            { icon: <HiOutlineCalendar size={16} />, text: `${activeDeps.length} lich con cho` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="text-primary">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TourDetailPage = () => {
  const { tourId } = useParams<{ tourId: string }>()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!isLoading && !tour) navigate('/tours')
  }, [isLoading, tour, navigate])

  if (isLoading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  if (!tour) return null

  const images = tour.images ?? []
  const typeMeta = tour.tourType ? TOUR_TYPE[tour.tourType] : null

  const tabsWithCount: typeof TABS = TABS.map((t) =>
    t.key === 'reviews' ? { ...t, label: `Danh gia (${reviews.length})` } : t
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-10 px-6 bg-primary">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground transition-colors">
              Trang chu
            </Link>
            <span>/</span>
            <button onClick={() => navigate('/tours')} className="hover:text-primary-foreground transition-colors">
              Tour
            </button>
            <span>/</span>
            <span className="text-primary-foreground font-medium line-clamp-1">{tour.name}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-4">
                {typeMeta && (
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${typeMeta.className}`}>
                    {typeMeta.label}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-primary-foreground mb-4">{tour.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-primary-foreground/70 text-sm">
                {tour.destination && (
                  <span className="flex items-center gap-1.5">
                    <HiOutlineLocationMarker size={16} className="text-accent" />
                    {tour.destination}
                  </span>
                )}
                {tour.durationDays && (
                  <span className="flex items-center gap-1.5">
                    <HiOutlineClock size={16} className="text-accent" />
                    {tour.durationDays} ngay
                  </span>
                )}
                {(tour.averageRating ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Stars n={tour.averageRating!} size={14} />
                    <span className="text-primary-foreground font-medium">{tour.averageRating?.toFixed(1)}</span>
                    <span>({reviews.length} danh gia)</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/tours')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm font-medium hover:bg-primary-foreground/20 transition-all shrink-0"
            >
              <HiArrowLeft size={16} /> Quay lai
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <ImageGallery images={images} name={tour.name} />

            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-serif font-semibold text-foreground text-xl mb-5">Thong tin tour</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: <HiOutlineLocationMarker size={18} />, label: 'Diem den', value: tour.destination ?? '-' },
                  { icon: <HiArrowRight size={18} />, label: 'Xuat phat', value: tour.departure ?? '-' },
                  { icon: <HiOutlineClock size={18} />, label: 'Thoi gian', value: `${tour.durationDays} ngay` },
                  { icon: <HiOutlineUserGroup size={18} />, label: 'Toi da', value: `${tour.maxSlots ?? '-'} nguoi` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
                    <span className="mt-0.5 text-primary">{icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {tour.description && <p className="text-muted-foreground text-sm leading-relaxed">{tour.description}</p>}
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex border-b border-border overflow-x-auto">
                {tabsWithCount.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 transition-colors ${
                      activeTab === t.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'itinerary' && <ItineraryTab itineraries={tour.itineraries ?? []} />}
                {activeTab === 'hotels' && (
                  <EmptyTab icon={<HiOutlineHome size={32} />} text="Thong tin khach san dang duoc cap nhat" />
                )}
                {activeTab === 'restaurants' && (
                  <EmptyTab icon={<HiOutlineSparkles size={32} />} text="Thong tin nha hang dang duoc cap nhat" />
                )}
                {activeTab === 'reviews' &&
                  (reviews.length === 0 ? (
                    <EmptyTab icon={<HiOutlineChatAlt2 size={32} />} text="Chua co danh gia nao. Hay la nguoi dau tien!" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-6 p-5 rounded-2xl bg-secondary mb-6">
                        <div className="text-center">
                          <p className="text-4xl font-serif font-semibold text-accent">
                            {tour.averageRating?.toFixed(1) ?? '-'}
                          </p>
                          <Stars n={tour.averageRating ?? 0} />
                          <p className="text-xs text-muted-foreground mt-1">{reviews.length} danh gia</p>
                        </div>
                        <div className="flex-1">
                          {[5, 4, 3, 2, 1].map((s) => {
                            const count = reviews.filter((r) => Math.round(r.rating) === s).length
                            const pct = reviews.length ? (count / reviews.length) * 100 : 0
                            return (
                              <div key={s} className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-muted-foreground w-3">{s}</span>
                                <HiStar size={12} className="text-accent" />
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-accent transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-5">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {reviews.map((r) => (
                        <ReviewCard key={r.id} r={r} />
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right */}
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
