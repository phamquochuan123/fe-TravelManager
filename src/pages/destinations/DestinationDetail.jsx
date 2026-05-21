import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getDestinationById } from "../../api/destinationApi"
import MenuBar from "../../components/Menubar"

const TYPE_LABEL = {
    NATURE: "Thiên nhiên", CULTURE: "Văn hóa", FOOD: "Ẩm thực",
    ENTERTAINMENT: "Giải trí", BEACH: "Biển", MOUNTAIN: "Núi", CITY: "Đô thị"
}
const TYPE_COLOR = {
    NATURE: "bg-green-500 text-white", CULTURE: "bg-purple-500 text-white",
    FOOD: "bg-orange-500 text-white", ENTERTAINMENT: "bg-pink-500 text-white",
    BEACH: "bg-cyan-500 text-white", MOUNTAIN: "bg-slate-500 text-white", CITY: "bg-sky-500 text-white"
}
const TYPE_ICON = {
    NATURE: "bi-tree-fill", CULTURE: "bi-bank2", FOOD: "bi-egg-fried",
    ENTERTAINMENT: "bi-stars", BEACH: "bi-water", MOUNTAIN: "bi-triangle-fill", CITY: "bi-buildings-fill"
}
const TYPE_GRADIENT = {
    NATURE: "from-green-600 to-emerald-700",
    CULTURE: "from-purple-600 to-violet-700",
    FOOD: "from-orange-500 to-amber-600",
    ENTERTAINMENT: "from-pink-600 to-rose-700",
    BEACH: "from-cyan-500 to-teal-600",
    MOUNTAIN: "from-slate-600 to-gray-700",
    CITY: "from-blue-600 to-sky-700",
}

const DestinationDetail = () => {
    const { destinationId } = useParams()
    const navigate = useNavigate()
    const [destination, setDestination] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDestinationById(destinationId)
            .then(setDestination)
            .catch(() => navigate("/destinations"))
            .finally(() => setLoading(false))
    }, [destinationId])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen">
                <span className="w-10 h-10 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin" />
            </div>
        </div>
    )

    if (!destination) return null

    const gradient = TYPE_GRADIENT[destination.destinationType] || "from-sky-600 to-blue-700"

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            {/* Hero section */}
            <div className={`relative bg-gradient-to-br ${gradient} pt-24 pb-12 px-6 overflow-hidden min-h-[320px] flex items-end`}>
                {destination.photo && (
                    <img
                        src={`data:image/jpeg;base64,${destination.photo}`}
                        alt={destination.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="relative z-10 max-w-5xl mx-auto w-full">
                    <button
                        onClick={() => navigate("/destinations")}
                        className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-4 transition-colors"
                    >
                        <i className="bi bi-arrow-left" /> Quay lại danh sách địa điểm
                    </button>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30`}>
                                    <i className={`bi ${TYPE_ICON[destination.destinationType] || "bi-compass"} mr-1.5`} />
                                    {TYPE_LABEL[destination.destinationType] || destination.destinationType}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{destination.name}</h1>
                            <p className="text-white/70 flex items-center gap-1.5 text-base">
                                <i className="bi bi-geo-alt-fill text-white/50" />
                                {destination.province ? `${destination.province}, ` : ""}{destination.city}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Description */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Description card */}
                        {destination.description && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <i className="bi bi-info-circle text-sky-500" /> Giới thiệu
                                </h2>
                                <p className="text-gray-600 leading-relaxed text-sm">{destination.description}</p>
                            </div>
                        )}

                        {/* Explore nearby */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-compass text-sky-500" /> Khám phá tại {destination.city}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    {
                                        icon: "bi-map-fill",
                                        label: "Tour du lịch",
                                        desc: `Các tour khởi hành đến ${destination.city}`,
                                        color: "text-emerald-600",
                                        bg: "bg-emerald-50",
                                        border: "border-emerald-100",
                                        hover: "hover:border-emerald-300 hover:bg-emerald-50",
                                        onClick: () => navigate(`/tours?destination=${destination.city}`),
                                    },
                                    {
                                        icon: "bi-building-fill",
                                        label: "Khách sạn",
                                        desc: `Nơi lưu trú tại ${destination.city}`,
                                        color: "text-sky-600",
                                        bg: "bg-sky-50",
                                        border: "border-sky-100",
                                        hover: "hover:border-sky-300 hover:bg-sky-50",
                                        onClick: () => navigate(`/hotels?city=${destination.city}`),
                                    },
                                    {
                                        icon: "bi-cup-hot-fill",
                                        label: "Nhà hàng",
                                        desc: `Ẩm thực đặc sắc tại ${destination.city}`,
                                        color: "text-orange-600",
                                        bg: "bg-orange-50",
                                        border: "border-orange-100",
                                        hover: "hover:border-orange-300 hover:bg-orange-50",
                                        onClick: () => navigate(`/restaurants?city=${destination.city}`),
                                    },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={item.onClick}
                                        className={`text-left p-4 rounded-xl border ${item.border} ${item.hover} transition-all duration-200 group`}
                                    >
                                        <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-3`}>
                                            <i className={`bi ${item.icon} ${item.color}`} />
                                        </div>
                                        <p className={`font-bold text-sm ${item.color} group-hover:underline`}>{item.label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Info sidebar */}
                    <div className="space-y-4">
                        {/* Quick info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-4">Thông tin địa điểm</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                        <i className={`bi ${TYPE_ICON[destination.destinationType] || "bi-compass"} text-sky-500 text-sm`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Loại địa điểm</p>
                                        <p className="font-semibold text-gray-800 text-sm">{TYPE_LABEL[destination.destinationType] || destination.destinationType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                        <i className="bi bi-geo-alt-fill text-blue-500 text-sm" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Thành phố</p>
                                        <p className="font-semibold text-gray-800 text-sm">{destination.city}</p>
                                    </div>
                                </div>
                                {destination.province && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                            <i className="bi bi-map text-purple-500 text-sm" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Tỉnh / Vùng</p>
                                            <p className="font-semibold text-gray-800 text-sm">{destination.province}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTA card */}
                        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white relative overflow-hidden`}>
                            <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full"></div>
                            <div className="relative z-10">
                                <i className="bi bi-stars text-3xl text-white/80 mb-3 block" />
                                <h3 className="font-bold text-white mb-1">Sẵn sàng khám phá?</h3>
                                <p className="text-white/70 text-xs mb-4 leading-relaxed">Đặt tour, phòng hoặc nhà hàng tại {destination.city} ngay hôm nay.</p>
                                <button
                                    onClick={() => navigate(`/tours?destination=${destination.city}`)}
                                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold py-2.5 rounded-xl transition-colors border border-white/30"
                                >
                                    Xem tour ngay <i className="bi bi-arrow-right ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DestinationDetail
