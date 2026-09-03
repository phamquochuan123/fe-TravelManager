import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, MapPin } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

export interface PlaceCandidate {
  placeId: string
  displayName: string | null
  formattedAddress: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  photos: { name: string; widthPx: number; heightPx: number }[]
}

interface PhotoThumb { name: string; url: string; file: File }

interface Props {
  /** Giá trị mặc định của ô tìm kiếm — thường lấy từ field "Tên" đang gõ ở form cha */
  defaultQuery: string
  /** 'full': map cả address/city/lat/lng (Hotel/Restaurant/Destination) — 'photosOnly': chỉ lấy ảnh (Tour) */
  mode: 'full' | 'photosOnly'
  onSelect?: (candidate: PlaceCandidate) => void
  onPhotoSelected: (file: File) => void
}

async function fetchPhotoFile(name: string, maxWidthPx: number): Promise<PhotoThumb> {
  const res = await api.get('/admin/places/photo', {
    params: { name, maxWidthPx },
    responseType: 'blob',
  })
  const blob: Blob = res.data
  const file = new File([blob], 'google-photo.jpg', { type: blob.type || 'image/jpeg' })
  return { name, file, url: URL.createObjectURL(blob) }
}

export default function GooglePlacePicker({ defaultQuery, mode, onSelect, onPhotoSelected }: Props) {
  const [query, setQuery] = useState(defaultQuery)
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [selected, setSelected] = useState<PlaceCandidate | null>(null)
  const [thumbs, setThumbs] = useState<PhotoThumb[]>([])
  const [thumbsLoading, setThumbsLoading] = useState(false)
  const [selectedPhotoName, setSelectedPhotoName] = useState<string | null>(null)

  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin', 'places-search', searchTerm],
    queryFn: async () =>
      (await api.get('/admin/places/search', { params: { query: searchTerm } })).data as
        { candidates: PlaceCandidate[] },
    enabled: !!searchTerm,
  })

  const search = () => {
    if (!query.trim()) return
    setSelected(null); setThumbs([]); setSelectedPhotoName(null)
    setSearchTerm(query.trim())
  }

  const pickCandidate = async (c: PlaceCandidate) => {
    setSelected(c)
    setSelectedPhotoName(null)
    if (mode === 'full') onSelect?.(c)
    if (!c.photos?.length) { setThumbs([]); return }
    setThumbsLoading(true)
    try {
      const results = await Promise.allSettled(c.photos.slice(0, 5).map(p => fetchPhotoFile(p.name, 400)))
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<PhotoThumb> => r.status === 'fulfilled')
        .map(r => r.value)
      const failedCount = results.length - loaded.length
      setThumbs(loaded)
      if (failedCount > 0) {
        toast.error(`Không tải được ${failedCount} ảnh từ Google, vui lòng thử lại`)
      }
    } catch {
      toast.error('Không tải được ảnh từ Google, vui lòng thử lại')
    } finally {
      setThumbsLoading(false)
    }
  }

  const pickPhoto = (t: PhotoThumb) => {
    setSelectedPhotoName(t.name)
    onPhotoSelected(t.file)
  }

  return (
    <div className="space-y-3 border border-gray-200 rounded p-3 bg-[#f8f5ee]/40">
      <div className="flex gap-2">
        <Input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search() } }}
          placeholder="Tên trên Google Maps..." className="text-sm" />
        <Button type="button" variant="outline" onClick={search} disabled={isFetching || !query.trim()}>
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          <span className="ml-1.5 hidden sm:inline">Tìm trên Google</span>
        </Button>
      </div>

      {isError && <p className="text-xs text-red-500">Tìm kiếm thất bại, thử lại sau.</p>}

      {data?.candidates?.length === 0 && (
        <p className="text-xs text-gray-400">Không tìm thấy kết quả nào khớp.</p>
      )}

      {!!data?.candidates?.length && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {data.candidates.map(c => (
            <button key={c.placeId} type="button" onClick={() => pickCandidate(c)}
              className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors
                ${selected?.placeId === c.placeId ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-white'}`}>
              <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400 shrink-0" /> {c.displayName}
              </p>
              {c.formattedAddress && <p className="text-xs text-gray-500 truncate">{c.formattedAddress}</p>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Chọn ảnh gợi ý:</p>
          {thumbsLoading
            ? <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={13} className="animate-spin" /> Đang tải ảnh...</div>
            : thumbs.length === 0
              ? <p className="text-xs text-gray-400">Địa điểm này không có ảnh trên Google.</p>
              : (
                <div className="flex gap-2 flex-wrap">
                  {thumbs.map(t => (
                    <button key={t.name} type="button" onClick={() => pickPhoto(t)}
                      className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-colors
                        ${selectedPhotoName === t.name ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}>
                      <img src={t.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
        </div>
      )}
    </div>
  )
}
