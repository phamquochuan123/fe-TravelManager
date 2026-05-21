import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getTourById, getTourReviews } from "../../api/tourApi"
import MenuBar from "../../components/Menubar"

const TOUR_TYPE_LABEL = { DOMESTIC: "Trong nước", INTERNATIONAL: "Nước ngoài" }
const TOUR_TYPE_COLOR = {
    DOMESTIC: "bg-emerald-500 text-white",
    INTERNATIONAL: "bg-blue-500 text-white",
}

const TourDetail = () => {
    const { tourId } = useParams()
    const navigate = useNavigate()
    const [tour, setTour] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("itinerary")
    const [selectedImg, setSelectedImg] = useState(0)

    useEffect(() => {
        Promise.all([
            getTourById(tourId),
            getTourReviews(tourId).catch(() => []),
        ]).then(([tourData, reviewData]) => {
            setTour(tourData)
            setReviews(reviewData)
        }).catch(() => navigate("/tours"))
          .finally(() => setLoading(false))
    }, [tourId])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen">
                <span className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        </div>
    )

    if (!tour) return null

    const images = tour.images || []
    const stars = Math.round(tour.averageRating || 0)

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            {/* Hero */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 pt-24 pb-10 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-emerald-200 text-sm mb-4">
                        <i className="bi bi-house" /> Trang chủ
                        <i className="bi bi-chevron-right text-xs" />
                        <button onClick={() => navigate("/tours")} className="hover:text-white transition-colors">Tour du lịch</button>
                        <i className="bi bi-chevron-right text-xs" />
                        <span className="text-white font-semibold line-clamp-1">{tour.name}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">{tour.name}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${TOUR_TYPE_COLOR[tour.tourType] || "bg-white/20 text-white"}`}>
                            {TOUR_TYPE_LABEL[tour.tourType] || tour.tourType}
                        </span>
                        <span className="text-emerald-200 text-sm flex items-center gap-1.5">
                            <i className="bi bi-geo-alt-fill text-emerald-300 text-xs" /> {tour.destination}
                        </span>
                        <span className="text-emerald-200 text-sm flex items-center gap-1.5">
                            <i className="bi bi-clock text-emerald-300 text-xs" /> {tour.durationDays} ngày
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="h-72 bg-gradient-to-br from-emerald-100 to-teal-100 relative overflow-hidden">
                                {images.length > 0 ? (
                                    <img
                                        src={`data:image/jpeg;base64,${images[selectedImg].photo}`}
                                        alt={tour.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <i className="bi bi-map text-8xl text-emerald-200" />
                                    </div>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 p-3 overflow-x-auto">
                                    {images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={`data:image/jpeg;base64,${img.photo}`}
                                            alt=""
                                            onClick={() => setSelectedImg(i)}
                                            className={`w-16 h-16 object-cover rounded-xl cursor-pointer shrink-0 transition-all ${selectedImg === i ? "ring-2 ring-emerald-500 opacity-100" : "opacity-60 hover:opacity-100"}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tour info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-black text-gray-900 mb-3">Thông tin tour</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                <span className="flex items-center gap-1.5">
                                    <i className="bi bi-geo-alt text-emerald-500" /> {tour.destination}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <i className="bi bi-geo text-blue-500" /> Xuất phát: {tour.departure}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <i className="bi bi-calendar3 text-purple-500" /> {tour.durationDays} ngày
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <i className="bi bi-people text-orange-500" /> Tối đa {tour.maxSlots} người
                                </span>
                            </div>
                            {tour.averageRating > 0 && (
                                <div className="flex items-center gap-1.5 mb-4">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <i key={i} className={`bi bi-star${i < stars ? "-fill text-amber-400" : " text-gray-300"} text-sm`} />
                                    ))}
                                    <span className="text-sm text-gray-500 ml-1">{tour.averageRating?.toFixed(1)} / 5</span>
                                </div>
                            )}
                            {tour.description && (
                                <p className="text-gray-600 text-sm leading-relaxed">{tour.description}</p>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex border-b border-gray-100 overflow-x-auto">
                                {[
                                    { key: "itinerary", label: "Lịch trình", icon: "bi-calendar-week" },
                                    { key: "includes", label: "Bao gồm", icon: "bi-check-circle" },
                                    { key: "policy", label: "Chính sách hủy", icon: "bi-shield-check" },
                                    { key: "reviews", label: `Đánh giá (${reviews.length})`, icon: "bi-star" },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === tab.key ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                                    >
                                        <i className={`bi ${tab.icon}`} /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === "itinerary" && (
                                    tour.itineraries?.length > 0 ? (
                                        <div className="space-y-4">
                                            {tour.itineraries.sort((a, b) => a.dayNumber - b.dayNumber).map(it => (
                                                <div key={it.id} className="flex gap-4">
                                                    <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-black text-sm shadow-sm shadow-emerald-200">
                                                        {it.dayNumber}
                                                    </div>
                                                    <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                                                        <h4 className="font-bold text-gray-900 mb-1">{it.title}</h4>
                                                        {it.description && <p className="text-sm text-gray-600 mb-2">{it.description}</p>}
                                                        {it.activities && (
                                                            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                                                <i className="bi bi-play-circle mr-1.5" />{it.activities}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-8">Chưa có lịch trình chi tiết</p>
                                    )
                                )}

                                {activeTab === "includes" && (
                                    tour.includedServices ? (
                                        <div className="space-y-2">
                                            {tour.includedServices.split("\n").map((line, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <i className="bi bi-check-circle-fill text-emerald-500 mt-0.5 shrink-0" />
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-8">Chưa có thông tin dịch vụ</p>
                                    )
                                )}

                                {activeTab === "policy" && (
                                    tour.cancellationPolicy ? (
                                        <p className="text-sm text-gray-700 leading-relaxed">{tour.cancellationPolicy}</p>
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-8">Chưa có chính sách hủy</p>
                                    )
                                )}

                                {activeTab === "reviews" && (
                                    reviews.length === 0 ? (
                                        <div className="text-center py-10">
                                            <i className="bi bi-star text-5xl text-gray-200 block mb-3" />
                                            <p className="text-gray-400 text-sm">Chưa có đánh giá nào</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {reviews.map(r => (
                                                <div key={r.id} className="border border-gray-100 rounded-2xl p-4 hover:border-emerald-100 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                {r.userName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-semibold text-gray-800 text-sm">{r.userName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                            {Array.from({ length: 5 }, (_, i) => (
                                                                <i key={i} className={`bi bi-star${i < r.rating ? "-fill text-amber-400" : " text-gray-300"} text-xs`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Price & booking card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <div className="mb-5 pb-5 border-b border-gray-100">
                                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Giá từ</p>
                                <p className="text-3xl font-black text-emerald-600">
                                    {Number(tour.priceAdult).toLocaleString("vi-VN")} ₫
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">/ người lớn</p>
                                {tour.priceChild && (
                                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                        <i className="bi bi-person text-emerald-400 text-xs" />
                                        Trẻ em: {Number(tour.priceChild).toLocaleString("vi-VN")} ₫
                                    </p>
                                )}
                            </div>

                            {/* Departures */}
                            {tour.departures?.length > 0 ? (
                                <div className="mb-5">
                                    <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                                        <i className="bi bi-calendar-event text-emerald-500" />
                                        Ngày khởi hành
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {tour.departures.map(dep => (
                                            <div key={dep.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${dep.availableSlots > 0 ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                                                <span className="font-semibold text-gray-800">
                                                    {new Date(dep.departureDate).toLocaleDateString("vi-VN")}
                                                </span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dep.availableSlots > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                                                    {dep.availableSlots > 0 ? `${dep.availableSlots} chỗ` : "Hết chỗ"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 mb-5 text-center py-3 bg-gray-50 rounded-xl">Chưa có lịch khởi hành</p>
                            )}

                            <button
                                onClick={() => navigate(`/tours/${tourId}/book`)}
                                disabled={!tour.departures?.some(d => d.availableSlots > 0)}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <i className="bi bi-calendar-check" /> Đặt tour ngay
                            </button>
                        </div>

                        {/* Quick info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-4">Thông tin nhanh</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { icon: "bi-clock", color: "text-emerald-500", label: `${tour.durationDays} ngày` },
                                    { icon: "bi-people", color: "text-blue-500", label: `Tối đa ${tour.maxSlots} người` },
                                    { icon: "bi-globe", color: "text-purple-500", label: TOUR_TYPE_LABEL[tour.tourType] },
                                    { icon: "bi-calendar3", color: "text-orange-500", label: `${tour.totalDepartures || tour.departures?.length || 0} lịch khởi hành` },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-600 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                            <i className={`bi ${item.icon} ${item.color} text-sm`} />
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TourDetail
