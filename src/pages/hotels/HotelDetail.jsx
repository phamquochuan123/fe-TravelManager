import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getHotelById } from "../../api/hotelApi"
import { getRoomsByHotelId } from "../../api/roomApi"
import MenuBar from "../../components/Menubar"

const STATUS_CONFIG = {
    AVAILABLE: { label: "Còn trống", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    BOOKED: { label: "Đã đặt", color: "bg-red-100 text-red-600 border-red-200" },
    MAINTENANCE: { label: "Bảo trì", color: "bg-amber-100 text-amber-700 border-amber-200" },
}

const HOTEL_TYPE_LABEL = { HOTEL: "Khách sạn", RESORT: "Resort", HOMESTAY: "Homestay" }

const HotelDetail = () => {
    const { hotelId } = useParams()
    const navigate = useNavigate()
    const [hotel, setHotel] = useState(null)
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [roomFilter, setRoomFilter] = useState("ALL")

    useEffect(() => {
        Promise.all([
            getHotelById(hotelId),
            getRoomsByHotelId(Number(hotelId)),
        ])
            .then(([h, r]) => { setHotel(h); setRooms(r) })
            .catch(() => navigate("/hotels"))
            .finally(() => setLoading(false))
    }, [hotelId])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit'] flex items-center justify-center">
            <MenuBar />
            <span className="w-12 h-12 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )

    if (!hotel) return null

    const amenitiesList = hotel.amenities ? hotel.amenities.split(",").map(a => a.trim()).filter(Boolean) : []
    const filteredRooms = roomFilter === "ALL" ? rooms : rooms.filter(r => r.status === roomFilter)
    const availableRooms = rooms.filter(r => r.status === "AVAILABLE").length

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            {/* Hero banner */}
            <div
                className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 pt-24 pb-10 px-6 overflow-hidden"
            >
                {hotel.photo && (
                    <img
                        src={`data:image/jpeg;base64,${hotel.photo}`}
                        alt={hotel.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                )}
                <div className="relative z-10 max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate("/hotels")}
                        className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm font-medium mb-6 transition-colors"
                    >
                        <i className="bi bi-arrow-left" /> Quay lại danh sách
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {HOTEL_TYPE_LABEL[hotel.hotelType] || hotel.hotelType}
                                </span>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <i key={i} className={`bi bi-star${i < hotel.starRating ? "-fill text-amber-300" : " text-white/30"} text-sm`} />
                                    ))}
                                </div>
                                {hotel.active === false && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Tạm đóng</span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{hotel.name}</h1>
                            <p className="text-indigo-200 flex items-center gap-1.5">
                                <i className="bi bi-geo-alt-fill" />
                                {hotel.address ? `${hotel.address}, ` : ""}{hotel.city}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white text-center shrink-0">
                            <p className="text-3xl font-black">{availableRooms}</p>
                            <p className="text-indigo-200 text-sm mt-1">phòng còn trống</p>
                            <p className="text-xs text-indigo-300">/ {rooms.length} phòng</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    {hotel.description && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <i className="bi bi-info-circle text-indigo-500" /> Mô tả
                            </h2>
                            <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
                        </div>
                    )}

                    {/* Amenities */}
                    {amenitiesList.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="bi bi-stars text-indigo-500" /> Tiện ích
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenitiesList.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                                        <i className="bi bi-check-circle-fill text-indigo-500 text-sm shrink-0" />
                                        <span className="text-sm text-gray-700 font-medium">{a}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rooms */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <i className="bi bi-door-open text-indigo-500" /> Danh sách phòng
                            </h2>
                            {/* Room status filter */}
                            <div className="flex gap-2 text-xs font-semibold">
                                {[
                                    { val: "ALL", label: "Tất cả" },
                                    { val: "AVAILABLE", label: "Còn trống" },
                                    { val: "BOOKED", label: "Đã đặt" },
                                    { val: "MAINTENANCE", label: "Bảo trì" },
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => setRoomFilter(opt.val)}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${roomFilter === opt.val ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredRooms.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <i className="bi bi-door-closed text-4xl block mb-2" />
                                <p className="text-sm">Không có phòng phù hợp</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredRooms.map(room => {
                                    const statusCfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE
                                    return (
                                        <div key={room.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Room photo */}
                                            <div className="w-full sm:w-28 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                                                {room.photo ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${room.photo}`}
                                                        alt={room.roomType}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <i className="bi bi-image text-2xl text-indigo-200" />
                                                )}
                                            </div>

                                            {/* Room info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{room.roomType}
                                                            {room.roomNumber && <span className="text-gray-400 font-normal text-sm ml-2">#{room.roomNumber}</span>}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500">
                                                            {room.numBeds > 0 && <span><i className="bi bi-lamp mr-1" />{room.numBeds} giường</span>}
                                                            {room.maxGuests > 0 && <span><i className="bi bi-people mr-1" />{room.maxGuests} khách</span>}
                                                            {room.area > 0 && <span><i className="bi bi-aspect-ratio mr-1" />{room.area} m²</span>}
                                                        </div>
                                                        {room.description && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{room.description}</p>
                                                        )}
                                                    </div>
                                                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price & action */}
                                            <div className="sm:text-right shrink-0">
                                                <p className="text-lg font-black text-indigo-600">
                                                    {Number(room.roomPrice).toLocaleString("vi-VN")}
                                                    <span className="text-xs font-normal text-gray-400"> ₫/đêm</span>
                                                </p>
                                                {room.status === "AVAILABLE" ? (
                                                    <button
                                                        onClick={() => navigate(`/hotels/${hotelId}/book/${room.id}`)}
                                                        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors w-full sm:w-auto"
                                                    >
                                                        Đặt ngay
                                                    </button>
                                                ) : (
                                                    <span className="mt-2 inline-block text-xs text-gray-400">Không khả dụng</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="space-y-5">
                    {/* Quick info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-bold text-gray-900 mb-4">Thông tin nhanh</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="bi bi-building text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Loại</p>
                                    <p className="font-semibold text-gray-800">{HOTEL_TYPE_LABEL[hotel.hotelType] || hotel.hotelType}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="bi bi-star-fill text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Xếp hạng sao</p>
                                    <p className="font-semibold text-gray-800">{hotel.starRating} sao</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="bi bi-door-open text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Tổng số phòng</p>
                                    <p className="font-semibold text-gray-800">{rooms.length} phòng ({availableRooms} còn trống)</p>
                                </div>
                            </div>
                            {hotel.city && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                                        <i className="bi bi-geo-alt text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Thành phố</p>
                                        <p className="font-semibold text-gray-800">{hotel.city}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="bi bi-box-arrow-in-right text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Giờ nhận phòng</p>
                                    <p className="font-semibold text-gray-800">Từ 14:00</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="bi bi-box-arrow-right text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Giờ trả phòng</p>
                                    <p className="font-semibold text-gray-800">Trước 12:00</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Availability summary */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
                        <h3 className="font-bold mb-4">Tình trạng phòng</h3>
                        {[
                            { status: "AVAILABLE", icon: "bi-check-circle-fill", color: "text-emerald-300" },
                            { status: "BOOKED", icon: "bi-x-circle-fill", color: "text-red-300" },
                            { status: "MAINTENANCE", icon: "bi-tools", color: "text-amber-300" },
                        ].map(({ status, icon, color }) => {
                            const count = rooms.filter(r => r.status === status).length
                            return (
                                <div key={status} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                                    <span className={`flex items-center gap-2 text-sm ${color}`}>
                                        <i className={`bi ${icon}`} />
                                        {STATUS_CONFIG[status].label}
                                    </span>
                                    <span className="font-bold">{count}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* CTA */}
                    {availableRooms > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                            <p className="text-sm text-gray-500 mb-1">Còn <strong className="text-indigo-600">{availableRooms}</strong> phòng trống</p>
                            <p className="text-xs text-gray-400 mb-4">Đặt ngay để giữ chỗ!</p>
                            <button
                                onClick={() => {
                                    const firstAvail = rooms.find(r => r.status === "AVAILABLE")
                                    if (firstAvail) navigate(`/hotels/${hotelId}/book/${firstAvail.id}`)
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Đặt phòng ngay
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default HotelDetail
