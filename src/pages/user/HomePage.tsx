import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import {
  MdSearch, MdLocationOn, MdCalendarToday, MdPeople,
  MdFlight, MdHotel, MdRestaurant,
  MdStar, MdStarBorder, MdArrowForward,
  MdAccessTime, MdVerified,
} from 'react-icons/md'
import { getAllTours } from '../../api/tourApi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

// ─── Local types (matches real API shape) ─────────────────────────────────────

interface ApiTourImage { id: number; photo: number[] }
interface ApiTour {
  id: number
  name: string
  destination?: string
  durationDays?: number
  priceAdult?: number
  images?: ApiTourImage[]
  rating?: number
  availableSlots?: number
}

// ─── Static data ──────────────────────────────────────────────────────────────

const DESTINATIONS = [
  { name: 'Hà Nội',    seed: 'hanoi-city',     path: 'Hà Nội',    desc: 'Thủ đô nghìn năm văn hiến' },
  { name: 'Đà Nẵng',  seed: 'danang-beach',    path: 'Đà Nẵng',  desc: 'Thành phố đáng sống nhất' },
  { name: 'Hội An',   seed: 'hoian-lanterns',  path: 'Hội An',   desc: 'Phố cổ huyền bí lung linh' },
  { name: 'Phú Quốc', seed: 'phuquoc-island',  path: 'Phú Quốc', desc: 'Đảo ngọc thiên đường' },
]

const SERVICES = [
  {
    icon: MdFlight,     label: 'Đặt Tour',
    desc: 'Khám phá hàng trăm tour trong và ngoài nước với giá tốt nhất',
    path: '/tours',
  },
  {
    icon: MdHotel,      label: 'Đặt Khách sạn',
    desc: 'Tìm phòng phù hợp ngân sách từ homestay đến resort 5 sao',
    path: '/hotels',
  },
  {
    icon: MdRestaurant, label: 'Đặt Nhà hàng',
    desc: 'Trải nghiệm ẩm thực địa phương tại những nhà hàng hàng đầu',
    path: '/restaurants',
  },
]

const TESTIMONIALS = [
  {
    name: 'Nguyễn Thị Mai', avatar: 'https://picsum.photos/seed/avatar-mai/80/80',
    rating: 5, dest: 'Tour Hạ Long 3N2Đ',
    text: 'Dịch vụ tuyệt vời! Đặt tour nhanh chóng, hướng dẫn viên nhiệt tình. Sẽ tiếp tục sử dụng TravelVN cho những chuyến đi tiếp theo.',
  },
  {
    name: 'Trần Văn Hùng', avatar: 'https://picsum.photos/seed/avatar-hung/80/80',
    rating: 5, dest: 'Tour Đà Nẵng 4N3Đ',
    text: 'Giao diện thân thiện, thông tin rõ ràng. Chuyến đi vượt ngoài kỳ vọng. Cảnh đẹp, đồ ăn ngon, dịch vụ chuyên nghiệp từ đầu đến cuối.',
  },
  {
    name: 'Lê Thị Hương', avatar: 'https://picsum.photos/seed/avatar-huong/80/80',
    rating: 4, dest: 'Tour Phú Quốc 5N4Đ',
    text: 'Giá cả hợp lý, đúng như mô tả. Khách sạn sạch sẽ, bãi biển đẹp. Chắc chắn sẽ giới thiệu cho bạn bè và người thân.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Stars = ({ n, max = 5 }: { n: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) =>
      i < n
        ? <MdStar key={i} size={15} className="text-accent" />
        : <MdStarBorder key={i} size={15} className="text-border" />
    )}
  </div>
)

const tourImageSrc = (tour: ApiTour): string | null => {
  if (!tour.images?.length) return null
  try {
    const bytes = new Uint8Array(tour.images[0].photo)
    let bin = ''
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i])
    return `data:image/jpeg;base64,${btoa(bin)}`
  } catch { return null }
}

// ─── 1. HeroSection ──────────────────────────────────────────────────────────

const HeroSection = () => {
  const navigate = useNavigate()
  const [dest,    setDest]    = useState('')
  const [date,    setDate]    = useState<Date | null>(null)
  const [persons, setPersons] = useState(2)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (dest.trim())   p.set('destination', dest.trim())
    if (date)          p.set('date', dayjs(date).format('YYYY-MM-DD'))
    if (persons !== 1) p.set('persons', String(persons))
    navigate(`/tours${p.toString() ? `?${p}` : ''}`)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* BG image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[10s] hover:scale-100"
        style={{ backgroundImage: 'url(https://picsum.photos/seed/vietnam-landscape/1920/1080)' }}
      />
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(26,82,118,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.65) 100%)' }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-white/10 backdrop-blur mb-7">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-white/90 text-sm font-medium tracking-wide">Du lịch Việt Nam cùng TravelVN</span>
        </div>

        {/* Headline — weight contrast replaces color accent */}
        <h1 className="text-[56px] sm:text-[72px] md:text-[80px] leading-[1.05] tracking-tight mb-5">
          <span className="block font-black text-white">Khám phá Việt Nam</span>
          <span className="block font-light text-white/70">theo cách của bạn</span>
        </h1>
        <p className="text-white/65 text-base sm:text-xl mb-10 max-w-lg mx-auto leading-relaxed">
          Tour du lịch, khách sạn và nhà hàng hàng đầu —{' '}
          <span className="text-white/90">tất cả trong một nơi.</span>
        </p>

        {/* Search card — no glassmorphism */}
        <form
          onSubmit={handleSearch}
          className="bg-white border border-gray-200/80 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto"
        >
          {/* Destination */}
          <div className="flex-1 relative">
            <MdLocationOn
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary"
            />
            <input
              type="text"
              placeholder="Điểm đến... (Hà Nội, Đà Nẵng...)"
              value={dest}
              onChange={e => setDest(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-transparent border-b border-gray-200 focus:border-primary text-sm text-gray-700 placeholder-gray-400 font-medium focus:outline-none transition-colors"
            />
          </div>

          {/* DatePicker */}
          <div className="sm:w-44 relative">
            <MdCalendarToday
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-primary"
            />
            <DatePicker
              selected={date}
              onChange={d => setDate(d)}
              placeholderText="Ngày đi"
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              wrapperClassName="w-full"
              className="w-full pl-9 pr-3 py-3 bg-transparent border-b border-gray-200 focus:border-primary text-sm text-gray-700 placeholder-gray-400 font-medium focus:outline-none cursor-pointer transition-colors"
            />
          </div>

          {/* Persons */}
          <div className="sm:w-36 relative">
            <MdPeople
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-primary"
            />
            <select
              value={persons}
              onChange={e => setPersons(Number(e.target.value))}
              className="w-full pl-9 pr-3 py-3 bg-transparent border-b border-gray-200 focus:border-primary text-sm text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer transition-colors"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} người</option>
              ))}
            </select>
          </div>

          {/* Submit — orange earns its place here */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm bg-accent transition-all hover:opacity-90 active:scale-95 shrink-0"
          >
            <MdSearch size={18} /> Tìm Tour
          </button>
        </form>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-10 mt-10 pb-8">
          {[
            { v: '200+', l: 'Tour hấp dẫn' },
            { v: '500+', l: 'Khách sạn' },
            { v: '50K+', l: 'Khách hài lòng' },
          ].map(s => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-black text-white">{s.v}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2.5 bg-white rounded-full" />
        </div>
      </div>
    </section>
  )
}

// ─── 2. FeaturedToursSection ──────────────────────────────────────────────────

const TourCard = ({ tour }: { tour: ApiTour }) => {
  const navigate = useNavigate()
  const img = tourImageSrc(tour)

  return (
    <article className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-200 group flex flex-col">
      {/* Image — brightness filter instead of scale (no layout animation) */}
      <div className="relative overflow-hidden h-52 shrink-0">
        {img ? (
          <img
            src={img}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:brightness-105 transition-[filter] duration-500"
          />
        ) : (
          <img
            src={`https://picsum.photos/seed/tour-${tour.id}/480/320`}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:brightness-105 transition-[filter] duration-500"
          />
        )}
        {/* Nổi bật badge — restrained, not solid orange */}
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-accent border border-accent/20 shadow-sm">
            <MdVerified size={12} /> Nổi bật
          </span>
        </div>
        {tour.durationDays && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
              <MdAccessTime size={12} /> {tour.durationDays} ngày
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-foreground text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {tour.name}
        </h3>

        {tour.destination && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MdLocationOn size={14} className="text-primary" />
            {tour.destination}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Stars n={tour.rating ?? 5} />
          <span className="text-xs text-muted-foreground">({tour.rating ?? 5}.0)</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Giá từ</p>
            <p className="text-lg font-black text-accent">
              {tour.priceAdult
                ? `${tour.priceAdult.toLocaleString('vi-VN')}₫`
                : 'Liên hệ'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/tours/${tour.id}`)}
            className="flex items-center gap-1.5 text-sm font-bold text-primary px-4 py-2 rounded-xl border border-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            Xem chi tiết <MdArrowForward size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}

const TourCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
    <div className="h-52 bg-muted" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-1/3" />
      <div className="h-8 bg-muted rounded-xl w-28 mt-4" />
    </div>
  </div>
)

const FeaturedToursSection = () => {
  const navigate = useNavigate()
  const { data: tours, isLoading } = useQuery<ApiTour[]>({
    queryKey: ['tours', 'featured'],
    queryFn: () => getAllTours() as Promise<ApiTour[]>,
    select: data => data.slice(0, 6),
  })

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider mb-3 bg-primary/10 text-primary">
              Nổi bật
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              Tour du lịch hấp dẫn
            </h2>
            <p className="text-muted-foreground mt-2">Những hành trình đáng nhớ đang chờ bạn khám phá</p>
          </div>
          <button
            onClick={() => navigate('/tours')}
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border-2 border-primary text-primary transition-all hover:bg-primary hover:text-primary-foreground shrink-0"
          >
            Xem tất cả <MdArrowForward size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={i} />)
            : tours?.map(t => <TourCard key={t.id} tour={t} />)
          }
        </div>

        {!isLoading && (!tours || tours.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <MdFlight size={48} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có tour nào. Vui lòng thử lại sau.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 3. PopularDestinationsSection ───────────────────────────────────────────

const PopularDestinationsSection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-20 px-6 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider mb-3 bg-accent/10 text-accent">
            Điểm đến
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Điểm đến phổ biến
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Những địa danh nổi tiếng nhất Việt Nam đang chờ bạn khám phá
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {DESTINATIONS.map((d, i) => (
            <button
              key={d.name}
              onClick={() => navigate(`/tours?destination=${encodeURIComponent(d.path)}`)}
              className={`relative overflow-hidden rounded-2xl cursor-pointer group text-left ${
                i === 0 ? 'sm:row-span-2' : ''
              }`}
              style={{ minHeight: i === 0 ? 460 : 210 }}
            >
              <img
                src={`https://picsum.photos/seed/${d.seed}/800/600`}
                alt={d.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/75 transition-all duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-black text-2xl mb-1">{d.name}</h3>
                <p className="text-white/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-2">
                  {d.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-accent text-white">
                  Khám phá ngay <MdArrowForward size={12} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 4. ServicesSection — split layout, not identical card grid ───────────────

const ServicesSection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-start">

          {/* Left: anchor text */}
          <div className="lg:w-2/5 shrink-0 lg:pt-7">
            <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider mb-5 bg-muted text-primary">
              Dịch vụ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight mb-5">
              Một nơi.<br />Mọi dịch vụ du lịch.
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Từ tour khám phá đến phòng nghỉ và bàn ăn — đặt tất cả trong một lần, không cần chuyển trang hay gọi điện.
            </p>
          </div>

          {/* Right: row list with dividers */}
          <div className="flex-1 divide-y divide-border">
            {SERVICES.map(({ icon: Icon, label, desc, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="group w-full flex items-center gap-5 py-7 text-left transition-all duration-200 first:pt-0 last:pb-0"
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-200">
                  <Icon size={20} className="text-primary group-hover:text-primary-foreground transition-colors duration-200" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-200">{label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <MdArrowForward
                  size={18}
                  className="shrink-0 text-border group-hover:text-primary group-hover:translate-x-1 transition-all duration-200"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 5. TestimonialsSection ───────────────────────────────────────────────────

const TestimonialsSection = () => (
  <section className="py-20 px-6 bg-primary">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider mb-3 bg-accent/20 text-accent">
          Đánh giá
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-primary-foreground">
          Khách hàng nói gì về chúng tôi
        </h2>
        <p className="mt-2 text-primary-foreground/55">
          Hàng nghìn du khách đã tin tưởng và hài lòng với TravelVN
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.name}
            className="p-6 rounded-2xl flex flex-col gap-4 bg-white/8 border border-white/12"
          >
            <div className="flex items-center justify-between">
              <Stars n={t.rating} />
              <MdVerified size={16} className="text-accent" />
            </div>

            <p className="text-sm leading-relaxed flex-1 text-white/75">
              "{t.text}"
            </p>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-accent"
              />
              <div>
                <p className="text-primary-foreground font-bold text-sm">{t.name}</p>
                <p className="text-xs text-accent">{t.dest}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage = () => (
  <div>
    <Navbar />
    <HeroSection />
    <FeaturedToursSection />
    <PopularDestinationsSection />
    <ServicesSection />
    <TestimonialsSection />
    <Footer />
  </div>
)

export default HomePage
