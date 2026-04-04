import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getAllHotels } from "../../api/hotelApi"
import HotelCard from "../../components/hotel/HotelCard"
import MenuBar from "../../components/Menubar"

const HOTEL_TYPES = ["Tất cả", "HOTEL", "RESORT", "HOMESTAY"]
const HOTEL_TYPE_LABEL = { HOTEL: "Khách sạn", RESORT: "Resort", HOMESTAY: "Homestay" }
const STAR_OPTIONS = [0, 1, 2, 3, 4, 5]

const HotelList = () => {
    const [hotels, setHotels] = useState([])
    const [filtered, setFiltered] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [searchParams] = useSearchParams()
    const [search, setSearch] = useState("")
    const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "")
    const [typeFilter, setTypeFilter] = useState("Tất cả")
    const [starFilter, setStarFilter] = useState(0)

    useEffect(() => {
        getAllHotels()
            .then(data => { setHotels(data); setFiltered(data) })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let result = hotels.filter(h => h.active !== false)
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(h =>
                h.name?.toLowerCase().includes(q) ||
                h.city?.toLowerCase().includes(q) ||
                h.address?.toLowerCase().includes(q)
            )
        }
        if (cityFilter.trim()) {
            result = result.filter(h => h.city?.toLowerCase().includes(cityFilter.toLowerCase()))
        }
        if (typeFilter !== "Tất cả") {
            result = result.filter(h => h.hotelType === typeFilter)
        }
        if (starFilter > 0) {
            result = result.filter(h => h.starRating === starFilter)
        }
        setFiltered(result)
    }, [search, cityFilter, typeFilter, starFilter, hotels])

    const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))]

    const handleClear = () => {
        setSearch("")
        setCityFilter("")
        setTypeFilter("Tất cả")
        setStarFilter(0)
    }

    const hasFilter = search || cityFilter || typeFilter !== "Tất cả" || starFilter > 0

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 pt-28 pb-16 px-6 text-white">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-black tracking-tight mb-2">Tìm khách sạn lý tưởng</h1>
                    <p className="text-indigo-200 text-lg mb-8">Khám phá {hotels.length} khách sạn và resort trên khắp Việt Nam</p>

                    {/* Search bar */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, thành phố..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-9 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                            />
                        </div>
                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 min-w-[140px]"
                        >
                            <option value="" className="text-gray-900">Tất cả thành phố</option>
                            {cities.map(c => (
                                <option key={c} value={c} className="text-gray-900">{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar filters */}
                    <aside className="md:w-60 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Bộ lọc</h3>
                                {hasFilter && (
                                    <button onClick={handleClear} className="text-xs text-indigo-600 hover:underline font-medium">
                                        Xoá tất cả
                                    </button>
                                )}
                            </div>

                            {/* Loại khách sạn */}
                            <div className="mb-5">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loại</p>
                                <div className="flex flex-col gap-1">
                                    {HOTEL_TYPES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTypeFilter(t)}
                                            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {t === "Tất cả" ? t : HOTEL_TYPE_LABEL[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Số sao */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số sao</p>
                                <div className="flex flex-col gap-1">
                                    {STAR_OPTIONS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStarFilter(s)}
                                            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${starFilter === s ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {s === 0 ? "Tất cả" : (
                                                <>
                                                    {Array.from({ length: s }, (_, i) => (
                                                        <i key={i} className="bi bi-star-fill text-amber-400 text-xs" />
                                                    ))}
                                                    <span className="ml-0.5">{s} sao</span>
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-500 text-sm">
                                Tìm thấy <span className="font-bold text-gray-900">{filtered.length}</span> khách sạn
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-24">
                                <span className="w-10 h-10 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-16">
                                <i className="bi bi-exclamation-triangle text-4xl text-red-400 block mb-3" />
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <i className="bi bi-building-x text-5xl text-gray-300 block mb-3" />
                                <p className="text-gray-500 font-medium">Không tìm thấy khách sạn phù hợp</p>
                                <button onClick={handleClear} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
                                    Xoá bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map(hotel => (
                                    <HotelCard key={hotel.id} hotel={hotel} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HotelList
