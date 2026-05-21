import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllDestinations } from "../../api/destinationApi"
import MenuBar from "../../components/Menubar"

const TYPE_LABEL = {
    NATURE: "Thiên nhiên", CULTURE: "Văn hóa", FOOD: "Ẩm thực",
    ENTERTAINMENT: "Giải trí", BEACH: "Biển", MOUNTAIN: "Núi", CITY: "Đô thị"
}
const TYPE_ICON = {
    NATURE: "bi-tree", CULTURE: "bi-bank", FOOD: "bi-egg-fried",
    ENTERTAINMENT: "bi-stars", BEACH: "bi-water", MOUNTAIN: "bi-triangle", CITY: "bi-building"
}
const TYPE_COLOR_BADGE = {
    NATURE: "bg-green-500 text-white", CULTURE: "bg-purple-500 text-white",
    FOOD: "bg-orange-500 text-white", ENTERTAINMENT: "bg-pink-500 text-white",
    BEACH: "bg-cyan-500 text-white", MOUNTAIN: "bg-slate-500 text-white", CITY: "bg-sky-500 text-white"
}

const DestinationCard = ({ destination }) => {
    const navigate = useNavigate()
    return (
        <div
            onClick={() => navigate(`/destinations/${destination.id}`)}
            className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-sky-100/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer group overflow-hidden"
        >
            <div className="h-52 bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 relative overflow-hidden flex items-center justify-center">
                {destination.photo ? (
                    <img src={`data:image/jpeg;base64,${destination.photo}`} alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <i className={`bi ${TYPE_ICON[destination.destinationType] || "bi-compass"} text-6xl text-sky-200 group-hover:scale-110 transition-transform duration-500`} />
                )}
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${TYPE_COLOR_BADGE[destination.destinationType] || "bg-gray-500 text-white"}`}>
                        {TYPE_LABEL[destination.destinationType] || destination.destinationType}
                    </span>
                </div>
            </div>
            <div className="p-5">
                <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {destination.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <i className="bi bi-geo-alt-fill text-sky-400 text-xs" />
                    {destination.province ? `${destination.province}, ` : ""}{destination.city}
                </p>
                {destination.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{destination.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{destination.city}</span>
                    <span className="text-sm font-bold text-sky-500 flex items-center gap-1">
                        Khám phá <i className="bi bi-arrow-right text-xs" />
                    </span>
                </div>
            </div>
        </div>
    )
}

const DestinationList = () => {
    const [destinations, setDestinations] = useState([])
    const [filtered, setFiltered] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("Tất cả")
    const [cityFilter, setCityFilter] = useState("")

    useEffect(() => {
        getAllDestinations()
            .then(data => { setDestinations(data); setFiltered(data) })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let result = [...destinations]
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(d => d.name?.toLowerCase().includes(q) || d.city?.toLowerCase().includes(q) || d.province?.toLowerCase().includes(q))
        }
        if (cityFilter) result = result.filter(d => d.city?.toLowerCase().includes(cityFilter.toLowerCase()))
        if (typeFilter !== "Tất cả") result = result.filter(d => d.destinationType === typeFilter)
        setFiltered(result)
    }, [search, cityFilter, typeFilter, destinations])

    const cities = [...new Set(destinations.map(d => d.city).filter(Boolean))]
    const types = ["Tất cả", ...Object.keys(TYPE_LABEL)]

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-600 pt-28 pb-16 px-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-sky-200 text-sm mb-4">
                        <i className="bi bi-house" /> Trang chủ <i className="bi bi-chevron-right text-xs" />
                        <span className="text-white font-semibold">Điểm đến</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Địa điểm du lịch</h1>
                    <p className="text-sky-200 text-lg mb-8"><span className="text-white font-bold">{destinations.length}</span> địa điểm hấp dẫn tại Việt Nam</p>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
                            <input type="text" placeholder="Tìm địa điểm, tỉnh thành..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all" />
                        </div>
                        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none min-w-[160px]">
                            <option value="" className="text-gray-900">Tất cả tỉnh/thành</option>
                            {cities.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-56 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="bi bi-funnel text-sky-500" /> Loại địa điểm
                            </h3>
                            <div className="flex flex-col gap-1">
                                {types.map(t => (
                                    <button key={t} onClick={() => setTypeFilter(t)}
                                        className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${typeFilter === t ? "bg-sky-50 text-sky-600 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                                        {t !== "Tất cả" && <i className={`bi ${TYPE_ICON[t]} text-xs`} />}
                                        {t === "Tất cả" ? t : TYPE_LABEL[t]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <p className="text-gray-500 text-sm mb-6">
                            Tìm thấy <span className="font-bold text-gray-900">{filtered.length}</span> địa điểm
                        </p>
                        {loading ? (
                            <div className="flex justify-center py-24">
                                <span className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-16">
                                <i className="bi bi-exclamation-triangle text-4xl text-red-400 block mb-3" />
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <i className="bi bi-compass text-5xl text-gray-300 block mb-3" />
                                <p className="text-gray-500 font-medium">Không tìm thấy địa điểm phù hợp</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map(d => <DestinationCard key={d.id} destination={d} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DestinationList
