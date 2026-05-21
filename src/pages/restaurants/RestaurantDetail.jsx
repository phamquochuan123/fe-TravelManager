import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getRestaurantById } from "../../api/restaurantApi"
import MenuBar from "../../components/Menubar"

const CUISINE_LABEL = {
    VIETNAMESE: "Việt Nam", ASIAN: "Châu Á", WESTERN: "Âu Mỹ",
    SEAFOOD: "Hải sản", BBQ: "BBQ", VEGETARIAN: "Chay", FUSION: "Fusion", OTHER: "Khác"
}
const PRICE_LABEL = { BUDGET: "Bình dân ($)", STANDARD: "Vừa phải ($$)", PREMIUM: "Cao cấp ($$$)", LUXURY: "Sang trọng ($$$$)" }
const PRICE_COLOR = { BUDGET: "bg-green-500 text-white", STANDARD: "bg-blue-500 text-white", PREMIUM: "bg-purple-500 text-white", LUXURY: "bg-amber-500 text-white" }

const RestaurantDetail = () => {
    const { restaurantId } = useParams()
    const navigate = useNavigate()
    const [restaurant, setRestaurant] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getRestaurantById(restaurantId)
            .then(setRestaurant)
            .catch(() => navigate("/restaurants"))
            .finally(() => setLoading(false))
    }, [restaurantId])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen">
                <span className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        </div>
    )

    if (!restaurant) return null
    const amenities = restaurant.amenities?.split(",").map(a => a.trim()).filter(Boolean) || []

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            {/* Hero */}
            <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 pt-24 pb-10 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-orange-200 text-sm mb-4">
                        <i className="bi bi-house" /> Trang chủ
                        <i className="bi bi-chevron-right text-xs" />
                        <button onClick={() => navigate("/restaurants")} className="hover:text-white transition-colors">Nhà hàng</button>
                        <i className="bi bi-chevron-right text-xs" />
                        <span className="text-white font-semibold line-clamp-1">{restaurant.name}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">{restaurant.name}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                            {CUISINE_LABEL[restaurant.cuisineType] || restaurant.cuisineType}
                        </span>
                        {restaurant.priceRange && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${PRICE_COLOR[restaurant.priceRange] || "bg-gray-500 text-white"}`}>
                                {PRICE_LABEL[restaurant.priceRange] || restaurant.priceRange}
                            </span>
                        )}
                        <span className="text-orange-200 text-sm flex items-center gap-1.5">
                            <i className="bi bi-geo-alt-fill text-orange-300 text-xs" />
                            {restaurant.city}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Photo */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="h-72 bg-gradient-to-br from-orange-100 to-amber-100 relative overflow-hidden flex items-center justify-center">
                                {restaurant.photo ? (
                                    <img src={`data:image/jpeg;base64,${restaurant.photo}`} alt={restaurant.name}
                                        className="w-full h-full object-cover" />
                                ) : (
                                    <i className="bi bi-cup-hot text-8xl text-orange-200" />
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-black text-gray-900 mb-4">Thông tin nhà hàng</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                <span className="flex items-center gap-1.5">
                                    <i className="bi bi-geo-alt text-orange-500" />
                                    {restaurant.address ? `${restaurant.address}, ` : ""}{restaurant.city}
                                </span>
                                {restaurant.openingHours && (
                                    <span className="flex items-center gap-1.5">
                                        <i className="bi bi-clock text-blue-500" /> {restaurant.openingHours}
                                    </span>
                                )}
                                {restaurant.capacity && (
                                    <span className="flex items-center gap-1.5">
                                        <i className="bi bi-people text-purple-500" /> {restaurant.capacity} chỗ ngồi
                                    </span>
                                )}
                            </div>
                            {restaurant.description && (
                                <p className="text-gray-600 text-sm leading-relaxed">{restaurant.description}</p>
                            )}
                        </div>

                        {/* Amenities */}
                        {amenities.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <i className="bi bi-stars text-orange-500" /> Tiện ích & Dịch vụ
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {amenities.map((a, i) => (
                                        <span key={i} className="bg-orange-50 text-orange-600 border border-orange-100 text-sm px-3 py-1.5 rounded-xl font-medium">
                                            <i className="bi bi-check-circle mr-1.5" />{a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="font-bold text-gray-900 mb-5">Đặt bàn</h2>
                            <div className="space-y-3 mb-6 text-sm">
                                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                        <i className="bi bi-currency-dollar text-orange-500 text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Mức giá</p>
                                        <p className="font-bold text-gray-800">{PRICE_LABEL[restaurant.priceRange] || restaurant.priceRange || "—"}</p>
                                    </div>
                                </div>
                                {restaurant.openingHours && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                            <i className="bi bi-clock text-blue-500 text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Giờ phục vụ</p>
                                            <p className="font-bold text-gray-800">{restaurant.openingHours}</p>
                                        </div>
                                    </div>
                                )}
                                {restaurant.capacity && (
                                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                            <i className="bi bi-people text-purple-500 text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Sức chứa</p>
                                            <p className="font-bold text-gray-800">{restaurant.capacity} chỗ ngồi</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate(`/restaurants/${restaurantId}/book`)}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <i className="bi bi-calendar-check" /> Đặt bàn ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RestaurantDetail
