import { useParams, useNavigate } from 'react-router-dom'
import { resolveBase64Image } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { MdLocationOn, MdArrowBack, MdAccessTime, MdStar, MdMap } from 'react-icons/md'
import api from '../../api/axiosInstance'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

interface Destination {
  id: number
  name: string
  description?: string
  city: string
  province?: string
  destinationType: string
  photo?: string // base64
  isActive: boolean
}

interface Tour {
  id: number
  name: string
  durationDays: number
  priceAdult: number
  averageRating?: number
  images?: string[]
}

const TYPE_LABEL: Record<string, string> = {
  BEACH: '🏖️ Biển',
  MOUNTAIN: '⛰️ Núi',
  CITY: '🏙️ Thành phố',
  NATURE: '🌿 Thiên nhiên',
  CULTURE: '🏛️ Văn hóa',
  FOOD: '🍜 Ẩm thực',
  ENTERTAINMENT: '🎡 Giải trí',
}

// Ảnh fallback theo tên địa điểm (Unsplash verified)
const DEST_PHOTOS: Record<string, string> = {
  'Vịnh Hạ Long':         'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
  'Hội An':               'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
  'Sapa':                 'https://images.unsplash.com/photo-1598430772299-8412a84a4604?w=1200&q=80',
  'Đà Nẵng':              'https://images.unsplash.com/photo-1620979856082-c22df08abb29?w=1200&q=80',
  'Nha Trang':            'https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=1200&q=80',
  'Phú Quốc':             'https://images.unsplash.com/photo-1596422846543-75c6fc197f11?w=1200&q=80',
  'Đà Lạt':               'https://images.unsplash.com/photo-1557456754-3900c7e7fb19?w=1200&q=80',
  'Hà Nội':               'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1200&q=80',
  'TP. Hồ Chí Minh':      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80',
  'Huế':                  'https://images.unsplash.com/photo-1588945107329-45e1bc09fa7a?w=1200&q=80',
  'Mũi Né':               'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80',
  'Ninh Bình':            'https://images.unsplash.com/photo-1591777334733-a2e1e7ae7219?w=1200&q=80',
  'Hà Giang':             'https://images.unsplash.com/photo-1598430772299-8412a84a4604?w=1200&q=80',
  'Mù Cang Chải':         'https://images.unsplash.com/photo-1598430772299-8412a84a4604?w=1200&q=80',
  'Bangkok - Pattaya':    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80',
  'Singapore':            'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
  'Bali':                 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  'Hàn Quốc - Seoul':     'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&q=80',
  'Nhật Bản - Tokyo':     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
}

// Fallback theo loại
const TYPE_PHOTOS: Record<string, string> = {
  BEACH:         'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  MOUNTAIN:      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
  CITY:          'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80',
  NATURE:        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  CULTURE:       'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=1200&q=80',
  FOOD:          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
  ENTERTAINMENT: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
}

const fmtVND = (n: number) => n?.toLocaleString('vi-VN') + '₫'

export default function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: dest, isLoading: loadingDest } = useQuery<Destination>({
    queryKey: ['destination', id],
    queryFn: async () => (await api.get(`/destinations/${id}`)).data,
    enabled: !!id,
  })

  const { data: tours = [] } = useQuery<Tour[]>({
    queryKey: ['tours-by-dest', dest?.name],
    queryFn: async () => {
      const res = await api.get(`/tours?destination=${encodeURIComponent(dest!.name)}`)
      return res.data?.content ?? res.data ?? []
    },
    enabled: !!dest?.name,
  })

  const photoUrl = dest?.photo
    ? resolveBase64Image(dest.photo, '')
    : dest ? (DEST_PHOTOS[dest.name] ?? TYPE_PHOTOS[dest.destinationType] ?? null)
    : null

  if (loadingDest) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f0e8' }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!dest) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f0e8' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <MdMap size={64} className="text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">Không tìm thấy địa điểm</p>
          <button onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-full text-sm font-bold text-white bg-primary">
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f0e8' }}>
      <Navbar />

      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={dest.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0a1628 100%)' }}>
            <MdMap size={80} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)' }} />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
          <MdArrowBack size={16} /> Quay lại
        </button>

        {/* Title */}
        <div className="absolute bottom-6 left-6 right-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
            style={{ background: 'rgba(201,168,76,0.85)' }}>
            {TYPE_LABEL[dest.destinationType] ?? dest.destinationType}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{dest.name}</h1>
          <p className="text-white/80 flex items-center gap-1 mt-1 text-sm">
            <MdLocationOn size={15} /> {dest.city}{dest.province && dest.province !== dest.city ? `, ${dest.province}` : ''}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Description */}
        {dest.description && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-3">Giới thiệu</h2>
            <p className="text-gray-600 leading-relaxed">{dest.description}</p>
          </div>
        )}

        {/* Tours */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Tour tại {dest.name}
            {tours.length > 0 && <span className="ml-2 text-sm font-semibold text-gray-400">({tours.length} tour)</span>}
          </h2>

          {tours.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <MdMap size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Chưa có tour tại địa điểm này</p>
              <button onClick={() => navigate('/tours')}
                className="mt-4 px-6 py-2 rounded-full text-sm font-bold text-white bg-primary">
                Xem tất cả tour
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tours.map(t => {
                const img = t.images?.[0] ? resolveBase64Image(t.images[0], '') : null
                return (
                  <div key={t.id}
                    onClick={() => navigate(`/tours/${t.id}`)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 duration-200">
                    <div className="h-44 bg-gray-100 overflow-hidden">
                      {img
                        ? <img src={img} alt={t.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <MdMap size={36} className="text-gray-300" />
                          </div>
                      }
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{t.name}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MdAccessTime size={13} />
                          {t.durationDays} ngày
                        </div>
                        {t.averageRating != null && (
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <MdStar size={13} />
                            {t.averageRating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-black" style={{ color: '#c9a84c' }}>
                        {fmtVND(t.priceAdult)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
