import { useNavigate } from "react-router-dom"

const HOTEL_TYPE_LABEL = { HOTEL: "Khách sạn", RESORT: "Resort", HOMESTAY: "Homestay" }
const HOTEL_TYPE_COLOR = {
    HOTEL: "bg-blue-100 text-blue-700",
    RESORT: "bg-emerald-100 text-emerald-700",
    HOMESTAY: "bg-amber-100 text-amber-700",
}

const HotelCard = ({ hotel }) => {
    const navigate = useNavigate()

    const renderStars = (count) =>
        Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={`bi bi-star${i < count ? "-fill text-amber-400" : " text-gray-300"} text-sm`} />
        ))

    const amenitiesList = hotel.amenities
        ? hotel.amenities.split(",").map(a => a.trim()).filter(Boolean).slice(0, 3)
        : []

    return (
        <div
            onClick={() => navigate(`/hotels/${hotel.id}`)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden"
        >
            {/* Hotel image */}
            <div className="h-48 bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 relative overflow-hidden flex items-center justify-center">
                {hotel.photo ? (
                    <img
                        src={`data:image/jpeg;base64,${hotel.photo}`}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <i className="bi bi-building text-6xl text-indigo-200 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${HOTEL_TYPE_COLOR[hotel.hotelType] || "bg-gray-100 text-gray-600"}`}>
                        {HOTEL_TYPE_LABEL[hotel.hotelType] || hotel.hotelType}
                    </span>
                </div>
                {hotel.active === false && (
                    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                        <span className="bg-white/90 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Tạm đóng</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                {/* Stars */}
                <div className="flex items-center gap-1 mb-2">
                    {renderStars(hotel.starRating)}
                    <span className="text-xs text-gray-400 ml-1">{hotel.starRating} sao</span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {hotel.name}
                </h3>

                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <i className="bi bi-geo-alt text-indigo-400" />
                    {hotel.city}{hotel.address ? `, ${hotel.address}` : ""}
                </p>

                {hotel.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{hotel.description}</p>
                )}

                {amenitiesList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {amenitiesList.map((a, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
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

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                        <i className="bi bi-door-open mr-1 text-indigo-400" />
                        {hotel.totalRooms} phòng
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 group-hover:underline flex items-center gap-1">
                        Xem chi tiết <i className="bi bi-arrow-right text-xs" />
                    </span>
                </div>
            </div>
        </div>
    )
}

export default HotelCard
