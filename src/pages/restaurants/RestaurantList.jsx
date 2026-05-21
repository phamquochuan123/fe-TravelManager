import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllRestaurants } from "../../api/restaurantApi"
import MenuBar from "../../components/Menubar"

const CUISINE_LABEL = {
    VIETNAMESE: "Việt Nam", ASIAN: "Châu Á", WESTERN: "Âu Mỹ",
    SEAFOOD: "Hải sản", BBQ: "BBQ", VEGETARIAN: "Chay", FUSION: "Fusion", OTHER: "Khác"
}
const PRICE_LABEL = { BUDGET: "$", STANDARD: "$$", PREMIUM: "$$$", LUXURY: "$$$$" }
const PRICE_COLOR = { BUDGET: "bg-green-500 text-white", STANDARD: "bg-blue-500 text-white", PREMIUM: "bg-purple-500 text-white", LUXURY: "bg-amber-500 text-white" }

const RestaurantCard = ({ restaurant }) => {
    const navigate = useNavigate()
    const amenities = restaurant.amenities?.split(",").map(a => a.trim()).filter(Boolean).slice(0, 3) || []

    return (
        <div
            onClick={() => navigate(`/restaurants/${restaurant.id}`)}
            className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-orange-100/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer group overflow-hidden"
        >
            <div className="h-52 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 relative overflow-hidden flex items-center justify-center">
                {restaurant.photo ? (
                    <img src={`data:image/jpeg;base64,${restaurant.photo}`} alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <i className="bi bi-cup-hot text-6xl text-orange-200 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-3 left-3">
                    <span className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                        {CUISINE_LABEL[restaurant.cuisineType] || restaurant.cuisineType}
                    </span>
                </div>
                {restaurant.priceRange && (
                    <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${PRICE_COLOR[restaurant.priceRange] || "bg-gray-500 text-white"}`}>
                            {PRICE_LABEL[restaurant.priceRange]}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-5">
                <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {restaurant.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <i className="bi bi-geo-alt-fill text-orange-400 text-xs" />
                    {restaurant.city}{restaurant.address ? `, ${restaurant.address}` : ""}
                </p>
                {restaurant.openingHours && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                        <i className="bi bi-clock text-orange-300" /> {restaurant.openingHours}
                    </p>
                )}
                {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {amenities.map((a, i) => (
                            <span key={i} className="bg-orange-50 text-orange-600 text-xs px-2.5 py-0.5 rounded-full border border-orange-100 font-medium">{a}</span>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <i className="bi bi-people text-orange-400 text-xs" />{restaurant.capacity || "—"} chỗ
                    </span>
                    <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
                        Đặt bàn <i className="bi bi-arrow-right text-xs" />
                    </span>
                </div>
            </div>
        </div>
    )
}

const RestaurantList = () => {
    const [restaurants, setRestaurants] = useState([])
    const [filtered, setFiltered] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [cityFilter, setCityFilter] = useState("")
    const [cuisineFilter, setCuisineFilter] = useState("Tất cả")

    useEffect(() => {
        getAllRestaurants()
            .then(data => { setRestaurants(data); setFiltered(data) })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let result = [...restaurants]
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(r => r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q))
        }
        if (cityFilter) result = result.filter(r => r.city?.toLowerCase().includes(cityFilter.toLowerCase()))
        if (cuisineFilter !== "Tất cả") result = result.filter(r => r.cuisineType === cuisineFilter)
        setFiltered(result)
    }, [search, cityFilter, cuisineFilter, restaurants])

    const cities = [...new Set(restaurants.map(r => r.city).filter(Boolean))]
    const cuisines = ["Tất cả", ...Object.keys(CUISINE_LABEL)]

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 pt-28 pb-16 px-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-orange-200 text-sm mb-4">
                        <i className="bi bi-house" /> Trang chủ <i className="bi bi-chevron-right text-xs" />
                        <span className="text-white font-semibold">Nhà hàng</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Nhà hàng & Ẩm thực</h1>
                    <p className="text-orange-100 text-lg mb-8"><span className="text-white font-bold">{restaurants.length}</span> nhà hàng đang chờ bạn khám phá</p>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
                            <input type="text" placeholder="Tìm nhà hàng, thành phố..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all" />
                        </div>
                        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none min-w-[160px]">
                            <option value="" className="text-gray-900">Tất cả thành phố</option>
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
                                <i className="bi bi-funnel text-orange-500" /> Loại ẩm thực
                            </h3>
                            <div className="flex flex-col gap-1">
                                {cuisines.map(c => (
                                    <button key={c} onClick={() => setCuisineFilter(c)}
                                        className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${cuisineFilter === c ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                                        {c === "Tất cả" ? c : CUISINE_LABEL[c]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <p className="text-gray-500 text-sm mb-6">
                            Tìm thấy <span className="font-bold text-gray-900">{filtered.length}</span> nhà hàng
                        </p>
                        {loading ? (
                            <div className="flex justify-center py-24">
                                <span className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-16">
                                <i className="bi bi-exclamation-triangle text-4xl text-red-400 block mb-3" />
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <i className="bi bi-cup-hot text-5xl text-gray-300 block mb-3" />
                                <p className="text-gray-500 font-medium">Không tìm thấy nhà hàng phù hợp</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RestaurantList
