import { useEffect, useState } from 'react'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'

interface LocationMapProps {
  name: string
  address?: string
  city?: string
  /** Null khi cơ sở chưa được gán toạ độ. */
  latitude?: number | null
  longitude?: number | null
  title?: string
}

/**
 * Phần "Vị trí" của trang chi tiết: bản đồ thật thay cho ô xám chỉ ghi địa chỉ.
 *
 * Có toạ độ  -> nhúng bản đồ OpenStreetMap ghim đúng điểm. Chọn OSM vì embed của
 *              họ không cần API key; nhúng Google Maps chính thức thì phải lộ
 *              GOOGLE_PLACES_API_KEY ra client.
 * Chưa có    -> không vẽ bản đồ (embed của OSM ghim theo toạ độ chứ không tra được
 *              theo chữ), nhưng vẫn mở được Google Maps bằng tên + địa chỉ.
 *
 * Dù ở trường hợp nào, bấm vào khối này cũng mở bản đồ đầy đủ ở tab mới.
 */
export default function LocationMap({
  name, address, city, latitude, longitude, title = 'Vị trí',
}: LocationMapProps) {
  const diaChiDayDu = [address, city].filter(Boolean).join(', ')
  const coToaDo = typeof latitude === 'number' && typeof longitude === 'number'

  // Tra theo TÊN chứ không theo toạ độ trần, kể cả khi đã có toạ độ.
  // `query=lat,lng` chỉ thả một ghim vào toạ độ và Google hiện plus code kiểu
  // "W2RG+F49 Bãi Cháy" — đúng chỗ nhưng khách chẳng thấy thông tin gì. Tra theo
  // tên thì Google khớp vào đúng listing của khách sạn, kèm ảnh, đánh giá, giờ mở
  // cửa và nút chỉ đường thật.
  const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, diaChiDayDu].filter(Boolean).join(', '))}`

  // Khung nhìn quanh điểm ghim, ~1.2km mỗi chiều.
  const d = 0.006
  const osmSrc = coToaDo
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - d}%2C${latitude! - d}%2C${longitude! + d}%2C${latitude! + d}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null

  // null = đang dò, true = tải được, false = không với tới openstreetmap.org.
  //
  // Phải dò trước khi nhúng: nếu mạng của khách chặn OSM (một số ISP/DNS ở VN có
  // chặn) thì iframe chỉ hiện ô trắng câm, khách tưởng trang lỗi. Dò bằng một tile
  // nhỏ với mode 'no-cors' — request hỏng thì fetch ném lỗi, đó là tín hiệu duy
  // nhất bắt được, vì iframe cross-origin không cho đọc trạng thái tải.
  const [osmTruyCapDuoc, setOsmTruyCapDuoc] = useState<boolean | null>(null)

  useEffect(() => {
    if (!osmSrc) return
    let daHuy = false
    fetch('https://tile.openstreetmap.org/0/0/0.png', { mode: 'no-cors' })
      .then(() => { if (!daHuy) setOsmTruyCapDuoc(true) })
      .catch(() => { if (!daHuy) setOsmTruyCapDuoc(false) })
    return () => { daHuy = true }
  }, [osmSrc])

  return (
    <section className="bg-white rounded border border-border p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <MapPin size={16} className="text-accent" /> {title}
        </h2>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          Xem trên Google Maps <ExternalLink size={12} />
        </a>
      </div>

      {diaChiDayDu && (
        <p className="text-sm text-muted-foreground mb-3 flex items-start gap-1.5">
          <MapPin size={14} className="mt-0.5 shrink-0 opacity-60" />
          <span>{diaChiDayDu}</span>
        </p>
      )}

      {osmSrc && osmTruyCapDuoc === null && (
        <div className="rounded-lg h-64 bg-muted animate-pulse" />
      )}

      {osmSrc && osmTruyCapDuoc === true && (
        <div className="rounded-lg overflow-hidden border border-border">
          <iframe
            src={osmSrc}
            title={`Bản đồ vị trí ${name}`}
            className="w-full h-64 block"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {(!osmSrc || osmTruyCapDuoc === false) && (
        // Hai trường hợp cùng rơi vào đây: chưa có toạ độ, hoặc có toạ độ nhưng
        // không với tới OSM. Nói thẳng lý do thay vì để ô trắng, và luôn còn một
        // đường ra là mở Google Maps.
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg overflow-hidden h-40 bg-muted hover:bg-muted/70 transition-colors flex flex-col items-center justify-center text-center gap-2 text-muted-foreground"
        >
          <MapPin size={30} className="opacity-30" />
          <p className="text-sm font-medium text-foreground/70">
            {osmSrc ? 'Không tải được bản đồ' : 'Chưa ghim được vị trí chính xác'}
          </p>
          <span className="text-xs text-accent font-semibold flex items-center gap-1">
            Bấm để xem trên Google Maps <ExternalLink size={11} />
          </span>
        </a>
      )}

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded border border-border text-sm font-semibold hover:bg-muted transition-colors"
      >
        <Navigation size={15} className="text-accent" /> Chỉ đường tới đây
      </a>
    </section>
  )
}
