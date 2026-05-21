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
            <span className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
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
            <div className="relative bg-gradient-to-br from-sky-700 via-sky-600 to-blue-700 pt-24 pb-12 px-6 overflow-hidden">
                {hotel.photo && (
                    <img
                        src={`data:image/jpeg;base64,${hotel.photo}`}
                        alt={hotel.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-25"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-sky-900/40" />
                <div className="relative z-10 max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate("/hotels")}
                        className="flex items-center gap-2 text-sky-200 hover:text-white text-sm font-medium mb-6 transition-colors group"
                    >
                        <i className="bi bi-arrow-left group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
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
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">{hotel.name}</h1>
                            <p className="text-sky-200 flex items-center gap-1.5">
                                <i className="bi bi-geo-alt-fill" />
                                {hotel.address ? `${hotel.address}, ` : ""}{hotel.city}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 text-white text-center shrink-0 shadow-xl">
                            <p className="text-4xl font-black">{availableRooms}</p>
                            <p className="text-sky-200 text-sm mt-1">phòng còn trống</p>
                            <p className="text-xs text-sky-300 mt-0.5">/ {rooms.length} phòng tổng</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {hotel.description && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <i className="bi bi-info-circle text-sky-500" /> Mô tả
                            </h2>
                            <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
                        </div>
                    )}

                    {amenitiesList.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="bi bi-stars text-sky-500" /> Tiện ích
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenitiesList.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5">
                                        <i className="bi bi-check-circle-fill text-sky-500 text-sm shrink-0" />
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
                                <i className="bi bi-door-open text-sky-500" /> Danh sách phòng
                            </h2>
                            <div className="flex gap-1.5 text-xs font-semibold flex-wrap">
                                {[
                                    { val: "ALL", label: "Tất cả" },
                                    { val: "AVAILABLE", label: "Còn trống" },
                                    { val: "BOOKED", label: "Đã đặt" },
                                    { val: "MAINTENANCE", label: "Bảo trì" },
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => setRoomFilter(opt.val)}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${roomFilter === opt.val ? "bg-sky-500 text-white shadow-md shadow-sky-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
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
                                        <div key={room.id} className="border border-gray-100 rounded-2xl p-4 hover:border-sky-200 hover:shadow-md hover:shadow-sky-50 transition-all flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="w-full sm:w-28 h-20 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                                                {room.photo ? (
                                                    <img src={`data:image/jpeg;base64,${room.photo}`} alt={room.roomType} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <i className="bi bi-image text-2xl text-sky-200" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">
                                                            {room.roomType}
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

                                            <div className="sm:text-right shrink-0">
                                                <p className="text-xl font-black text-sky-600">
                                                    {Number(room.roomPrice).toLocaleString("vi-VN")}
                                                    <span className="text-xs font-normal text-gray-400"> ₫/đêm</span>
                                                </p>
                                                {room.status === "AVAILABLE" ? (
                                                    <button
                                                        onClick={() => navigate(`/hotels/${hotelId}/book/${room.id}`)}
                                                        className="mt-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors w-full sm:w-auto shadow-md shadow-sky-200"
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-bold text-gray-900 mb-4">Thông tin nhanh</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { icon: "bi-building", bg: "bg-sky-50", iconColor: "text-sky-500", label: "Loại", value: HOTEL_TYPE_LABEL[hotel.hotelType] || hotel.hotelType },
                                { icon: "bi-star-fill", bg: "bg-amber-50", iconColor: "text-amber-500", label: "Xếp hạng", value: `${hotel.starRating} sao` },
                                { icon: "bi-door-open", bg: "bg-emerald-50", iconColor: "text-emerald-600", label: "Tổng phòng", value: `${rooms.length} phòng (${availableRooms} trống)` },
                                { icon: "bi-geo-alt", bg: "bg-purple-50", iconColor: "text-purple-600", label: "Thành phố", value: hotel.city },
                                { icon: "bi-box-arrow-in-right", bg: "bg-blue-50", iconColor: "text-blue-600", label: "Nhận phòng", value: "Từ 14:00" },
                                { icon: "bi-box-arrow-right", bg: "bg-orange-50", iconColor: "text-orange-500", label: "Trả phòng", value: "Trước 12:00" },
                            ].filter(item => item.value).map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                        <i className={`bi ${item.icon} ${item.iconColor} text-sm`} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">{item.label}</p>
                                        <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Room status */}
                    <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl p-5 text-white">
                        <h3 className="font-bold mb-4">Tình trạng phòng</h3>
                        {[
                            { status: "AVAILABLE", icon: "bi-check-circle-fill", color: "text-emerald-300" },
                            { status: "BOOKED", icon: "bi-x-circle-fill", color: "text-red-300" },
                            { status: "MAINTENANCE", icon: "bi-tools", color: "text-amber-300" },
                        ].map(({ status, icon, color }) => {
                            const count = rooms.filter(r => r.status === status).length
                            return (
                                <div key={status} className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0">
                                    <span className={`flex items-center gap-2 text-sm ${color}`}>
                                        <i className={`bi ${icon}`} />
                                        {STATUS_CONFIG[status].label}
                                    </span>
                                    <span className="font-black text-lg">{count}</span>
                                </div>
                            )
                        })}
                    </div>

                    {availableRooms > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                            <p className="text-sm text-gray-500 mb-1">Còn <strong className="text-sky-500">{availableRooms}</strong> phòng trống</p>
                            <p className="text-xs text-gray-400 mb-4">Đặt ngay để giữ chỗ!</p>
                            <button
                                onClick={() => {
                                    const firstAvail = rooms.find(r => r.status === "AVAILABLE")
                                    if (firstAvail) navigate(`/hotels/${hotelId}/book/${firstAvail.id}`)
                                }}
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-200"
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
