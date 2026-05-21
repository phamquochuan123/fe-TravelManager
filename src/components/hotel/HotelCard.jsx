import { useNavigate } from "react-router-dom"

const HOTEL_TYPE_LABEL = { HOTEL: "Khách sạn", RESORT: "Resort", HOMESTAY: "Homestay" }
const HOTEL_TYPE_COLOR = {
    HOTEL: "bg-sky-500 text-white",
    RESORT: "bg-emerald-500 text-white",
    HOMESTAY: "bg-amber-500 text-white",
}

const HotelCard = ({ hotel }) => {
    const navigate = useNavigate()

    const renderStars = (count) =>
        Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={`bi bi-star${i < count ? "-fill text-amber-400" : " text-gray-300"} text-xs`} />
        ))

    const amenitiesList = hotel.amenities
        ? hotel.amenities.split(",").map(a => a.trim()).filter(Boolean).slice(0, 3)
        : []

    return (
        <div
            onClick={() => navigate(`/hotels/${hotel.id}`)}
            className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-sky-100/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer group overflow-hidden"
        >
            {/* Image */}
            <div className="h-52 bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 relative overflow-hidden flex items-center justify-center">
                {hotel.photo ? (
                    <img
                        src={`data:image/jpeg;base64,${hotel.photo}`}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <i className="bi bi-building text-6xl text-sky-200 group-hover:scale-110 transition-transform duration-500" />
                )}
                {/* Type badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${HOTEL_TYPE_COLOR[hotel.hotelType] || "bg-gray-500 text-white"}`}>
                        {HOTEL_TYPE_LABEL[hotel.hotelType] || hotel.hotelType}
                    </span>
                </div>
                {/* Closed overlay */}
                {hotel.active === false && (
                    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                        <span className="bg-white/90 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Tạm đóng</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-2">
                    {renderStars(hotel.starRating)}
                    <span className="text-xs text-gray-400 ml-1.5">{hotel.starRating} sao</span>
                </div>

                <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {hotel.name}
                </h3>

                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <i className="bi bi-geo-alt-fill text-sky-400 text-xs" />
                    {hotel.city}{hotel.address ? `, ${hotel.address}` : ""}
                </p>

                {hotel.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{hotel.description}</p>
                )}

                {amenitiesList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {amenitiesList.map((a, i) => (
                            <span key={i} className="bg-sky-50 text-sky-600 text-xs px-2.5 py-0.5 rounded-full font-medium border border-sky-100">
                                {a}
                            </span>
                        ))}
                        {hotel.amenities?.split(",").length > 3 && (
                            <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                                +{hotel.amenities.split(",").length - 3}
                            </span>
                        )}
                    </div>
                )}

                <div className="pt-3 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <i className="bi bi-door-open text-sky-400" />
                            {hotel.totalRooms} phòng
                        </span>
                        <span className="text-sm font-bold text-sky-500 flex items-center gap-1">
                            Xem chi tiết <i className="bi bi-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/hotels/${hotel.id}`) }}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-sky-200"
                    >
                        Đặt phòng <i className="bi bi-arrow-right text-xs" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HotelCard
