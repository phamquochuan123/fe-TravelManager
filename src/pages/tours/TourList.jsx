import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllTours } from "../../api/tourApi"
import MenuBar from "../../components/Menubar"

const TOUR_TYPE_LABEL = { DOMESTIC: "Trong nước", INTERNATIONAL: "Nước ngoài" }
const DURATION_OPTIONS = [
    { label: "Tất cả", min: 0, max: Infinity },
    { label: "1-3 ngày", min: 1, max: 3 },
    { label: "4-7 ngày", min: 4, max: 7 },
    { label: "Trên 7 ngày", min: 8, max: Infinity },
]

const TourCard = ({ tour }) => {
    const navigate = useNavigate()
    const stars = Math.round(tour.averageRating || 0)

    return (
        <div
            onClick={() => navigate(`/tours/${tour.id}`)}
            className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-emerald-100/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer group overflow-hidden"
        >
            <div className="h-52 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 relative overflow-hidden flex items-center justify-center">
                {tour.images && tour.images.length > 0 ? (
                    <img
                        src={`data:image/jpeg;base64,${tour.images[0]}`}
                        alt={tour.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <i className="bi bi-map text-6xl text-emerald-200 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${tour.tourType === "DOMESTIC" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"}`}>
                        {TOUR_TYPE_LABEL[tour.tourType] || tour.tourType}
                    </span>
                </div>
                <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        {tour.durationDays} ngày
                    </span>
                </div>
            </div>

            <div className="p-5">
                <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {tour.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <i className="bi bi-geo-alt-fill text-emerald-400 text-xs" />
                    {tour.destination}
                </p>
                {tour.averageRating > 0 && (
                    <div className="flex items-center gap-0.5 mb-3">
                        {Array.from({ length: 5 }, (_, i) => (
                            <i key={i} className={`bi bi-star${i < stars ? "-fill text-amber-400" : " text-gray-300"} text-xs`} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1.5">{tour.averageRating?.toFixed(1)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400">Từ</p>
                        <p className="text-lg font-black text-emerald-600">
                            {Number(tour.priceAdult).toLocaleString("vi-VN")} ₫
                        </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                        Xem tour <i className="bi bi-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </div>
        </div>
    )
}

const TourList = () => {
    const [tours, setTours] = useState([])
    const [filtered, setFiltered] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("Tất cả")
    const [durationFilter, setDurationFilter] = useState(0)

    useEffect(() => {
        getAllTours()
            .then(data => { setTours(data); setFiltered(data) })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let result = [...tours]
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(t =>
                t.name?.toLowerCase().includes(q) ||
                t.destination?.toLowerCase().includes(q)
            )
        }
        if (typeFilter !== "Tất cả") {
            result = result.filter(t => t.tourType === typeFilter)
        }
        const dur = DURATION_OPTIONS[durationFilter]
        if (dur.min > 0) {
            result = result.filter(t => t.durationDays >= dur.min && t.durationDays <= dur.max)
        }
        setFiltered(result)
    }, [search, typeFilter, durationFilter, tours])

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 pt-28 pb-16 px-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-emerald-200 text-sm mb-4">
                        <i className="bi bi-house" /> Trang chủ <i className="bi bi-chevron-right text-xs" />
                        <span className="text-white font-semibold">Tour du lịch</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Khám phá tour du lịch</h1>
                    <p className="text-emerald-200 text-lg mb-8">
                        <span className="text-white font-bold">{tours.length}</span> tour hấp dẫn đang chờ bạn
                    </p>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                        <div className="relative">
                            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên tour, điểm đến..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-56 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-funnel text-emerald-500" /> Bộ lọc
                            </h3>

                            <div className="mb-5">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Loại tour</p>
                                <div className="flex flex-col gap-1">
                                    {["Tất cả", "DOMESTIC", "INTERNATIONAL"].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTypeFilter(t)}
                                            className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${typeFilter === t ? "bg-emerald-50 text-emerald-600 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {t === "Tất cả" ? t : TOUR_TYPE_LABEL[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thời gian</p>
                                <div className="flex flex-col gap-1">
                                    {DURATION_OPTIONS.map((d, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setDurationFilter(i)}
                                            className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${durationFilter === i ? "bg-emerald-50 text-emerald-600 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <p className="text-gray-500 text-sm mb-6">
                            Tìm thấy <span className="font-bold text-gray-900">{filtered.length}</span> tour
                        </p>

                        {loading ? (
                            <div className="flex justify-center items-center py-24">
                                <span className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-16">
                                <i className="bi bi-exclamation-triangle text-4xl text-red-400 block mb-3" />
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <i className="bi bi-map text-5xl text-gray-300 block mb-3" />
                                <p className="text-gray-500 font-medium">Không tìm thấy tour phù hợp</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map(tour => <TourCard key={tour.id} tour={tour} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TourList
