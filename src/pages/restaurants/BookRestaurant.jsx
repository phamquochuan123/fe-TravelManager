import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getRestaurantById, bookRestaurant } from "../../api/restaurantApi"
import { AppContext } from "../../context/appContextObject"
import axiosInstance from "../../api/axiosInstance"
import MenuBar from "../../components/layout/Navbar"
import { toast } from "react-toastify"

const ALL_TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00", "19:00", "20:00", "21:00"]

const bookingSchema = z.object({
    bookingDate: z.string().min(1, "Chọn ngày đặt bàn"),
    bookingTime: z.string().min(1, "Chọn giờ"),
    guestCount: z.coerce.number().min(1, "Ít nhất 1 khách"),
    specialRequests: z.string().optional(),
    contactName: z.string().min(1, "Vui lòng nhập họ tên"),
    contactPhone: z.string().regex(/^0[35789]\d{8}$/, "Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09)"),
    contactEmail: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
})

const toDateStr = (d) => d.toISOString().split("T")[0]

const getAvailableSlots = (bookingDate) => {
    const today = toDateStr(new Date())
    if (bookingDate !== today) return ALL_TIME_SLOTS
    const now = new Date()
    const bufferMs = 60 * 60 * 1000
    return ALL_TIME_SLOTS.filter(t => {
        const [h, m] = t.split(":").map(Number)
        const slotTime = new Date()
        slotTime.setHours(h, m, 0, 0)
        return slotTime.getTime() > now.getTime() + bufferMs
    })
}

const BookRestaurant = () => {
    const { restaurantId } = useParams()
    const navigate = useNavigate()
    const { userData } = useContext(AppContext)

    const [restaurant, setRestaurant] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [booking, setBooking] = useState(null)
    const [payingVNPay, setPayingVNPay] = useState(false)
    const DEPOSIT_AMOUNT = 100000 // 100,000 ₫ tiền đặt cọc

    const today = toDateStr(new Date())

    const { register, handleSubmit: handleFormSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            bookingDate: today,
            bookingTime: "19:00",
            guestCount: 2,
            specialRequests: "",
            contactName: "",
            contactPhone: "",
            contactEmail: "",
        },
    })
    const form = watch()

    useEffect(() => {
        getRestaurantById(restaurantId)
            .then(setRestaurant)
            .catch(() => navigate("/restaurants"))
            .finally(() => setLoading(false))
    }, [restaurantId, navigate])

    useEffect(() => {
        if (userData) {
            if (userData.name) setValue("contactName", userData.name)
            if (userData.email) setValue("contactEmail", userData.email)
        }
    }, [userData, setValue])

    useEffect(() => {
        const slots = getAvailableSlots(form.bookingDate)
        if (slots.length > 0 && !slots.includes(form.bookingTime)) {
            setValue("bookingTime", slots[0])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- cố ý bỏ qua form.bookingTime vì effect này tự set nó, thêm vào sẽ gây chạy lại thừa mỗi khi giờ đặt đổi
    }, [form.bookingDate, setValue])

    const onSubmit = async data => {
        setSubmitting(true)
        try {
            const result = await bookRestaurant(restaurantId, data)
            setBooking(result)
            toast.success("Đặt bàn thành công!")
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen">
                <span className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        </div>
    )

    const handlePayDeposit = async () => {
        setPayingVNPay(true)
        try {
            const res = await axiosInstance.post("/payment/create", {
                bookingType: "RESTAURANT",
                bookingId: booking.id,
                amount: DEPOSIT_AMOUNT,
                orderInfo: `Dat coc ban ${booking.restaurantName} #${booking.id}`,
            })
            window.location.href = res.data.payUrl
        } catch {
            toast.error("Không thể khởi tạo thanh toán VNPay")
            setPayingVNPay(false)
        }
    }

    if (booking) return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen px-6 pt-20 pb-12">
                <div className="bg-white rounded shadow-sm border border-gray-100 max-w-md w-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-900 px-8 pt-8 pb-6 text-center">
                        <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500/40 rounded flex items-center justify-center mx-auto mb-4">
                            <i className="bi bi-check-circle-fill text-3xl text-amber-400" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-1">Đặt bàn thành công!</h2>
                        <p className="text-gray-500 text-xs mb-2">Mã xác nhận</p>
                        <p className="text-xl font-black text-amber-400 tracking-widest font-mono">{booking.confirmationCode}</p>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-5 border-b border-gray-100 space-y-2.5 text-sm">
                        {[
                            { label: "Nhà hàng", value: booking.restaurantName, bold: true },
                            { label: "Ngày", value: new Date(booking.bookingDate).toLocaleDateString("vi-VN") },
                            { label: "Giờ", value: booking.bookingTime },
                            { label: "Số khách", value: `${booking.guestCount} người` },
                            { label: "Trạng thái", value: "Chờ xác nhận", amber: true },
                        ].map(item => (
                            <div key={item.label} className="flex items-start justify-between gap-3">
                                <span className="text-gray-400 shrink-0">{item.label}</span>
                                <span className={`text-right font-semibold ${item.amber ? "text-amber-600" : "text-gray-900"}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Payment */}
                    <div className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Đặt cọc giữ bàn</p>
                        <p className="text-xs text-gray-400 mb-3">Đặt cọc <span className="font-bold text-amber-600">{DEPOSIT_AMOUNT.toLocaleString("vi-VN")} ₫</span> để xác nhận và giữ bàn trước</p>
                        <button
                            onClick={handlePayDeposit}
                            disabled={payingVNPay}
                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#0065AC] hover:bg-[#005494] disabled:opacity-60 text-white font-bold rounded transition-colors mb-3"
                        >
                            {payingVNPay ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang chuyển hướng...</>
                            ) : (
                                <><i className="bi bi-credit-card-2-front-fill text-lg" /> Đặt cọc qua VNPay</>
                            )}
                        </button>
                        <div className="flex gap-3">
                            <button onClick={() => navigate("/my-bookings")}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-colors text-sm">
                                Bỏ qua
                            </button>
                            <button onClick={() => navigate("/restaurants")}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-colors text-sm">
                                Về danh sách
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                            <i className="bi bi-shield-lock-fill text-gray-300" /> Thanh toán bảo mật qua cổng VNPay
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#f8f5ee]">
            <MenuBar />
            <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(`/restaurants/${restaurantId}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-orange-600 text-sm font-medium mb-6 transition-colors"
                >
                    <i className="bi bi-arrow-left" /> Quay lại nhà hàng
                </button>
                <h1 className="text-3xl font-black text-gray-900 mb-8">Đặt bàn</h1>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <form onSubmit={handleFormSubmit(onSubmit)} className="lg:col-span-3 space-y-6">
                        {/* Date & Time */}
                        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-calendar3 text-orange-500" /> Ngày & Giờ
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày <span className="text-red-500">*</span></label>
                                    <input type="date" min={today}
                                        {...register("bookingDate")}
                                        className={`w-full border ${errors.bookingDate ? "border-red-400" : "border-gray-200"} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all`} />
                                    {errors.bookingDate && <p className="text-red-500 text-xs mt-1">{errors.bookingDate.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giờ <span className="text-red-500">*</span></label>
                                    <select {...register("bookingTime")}
                                        className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all">
                                        {getAvailableSlots(form.bookingDate).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {getAvailableSlots(form.bookingDate).length === 0 && (
                                        <p className="text-red-500 text-xs mt-1">Hôm nay không còn khung giờ nào. Vui lòng chọn ngày khác.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Guests */}
                        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-people text-orange-500" /> Số khách
                            </h2>
                            <div className="flex items-center gap-4">
                                <button type="button"
                                    onClick={() => setValue("guestCount", Math.max(1, form.guestCount - 1))}
                                    className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 flex items-center justify-center text-gray-600 font-bold transition-all">−</button>
                                <span className="text-2xl font-black text-gray-900 w-8 text-center">{form.guestCount}</span>
                                <button type="button"
                                    onClick={() => setValue("guestCount", form.guestCount + 1)}
                                    className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 flex items-center justify-center text-gray-600 font-bold transition-all">+</button>
                                <span className="text-sm text-gray-500">người</span>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-person-circle text-orange-500" /> Thông tin liên hệ
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { name: "contactName", label: "Họ và tên", type: "text", placeholder: "Nguyễn Văn A" },
                                    { name: "contactPhone", label: "Số điện thoại", type: "tel", placeholder: "0912 345 678" },
                                    { name: "contactEmail", label: "Email", type: "email", placeholder: "email@example.com" },
                                ].map(field => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label} <span className="text-red-500">*</span></label>
                                        <input type={field.type}
                                            placeholder={field.placeholder}
                                            {...register(field.name)}
                                            className={`w-full border ${errors[field.name] ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:ring-orange-100 focus:border-orange-400"} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`} />
                                        {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>}
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yêu cầu đặc biệt</label>
                                    <textarea {...register("specialRequests")}
                                        placeholder="Chế độ ăn kiêng, dị ứng thực phẩm, bàn riêng..."
                                        rows={3}
                                        className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={submitting}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded transition-all flex items-center justify-center gap-2 text-base">
                            {submitting
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                                : <><i className="bi bi-calendar-check" /> Xác nhận đặt bàn</>
                            }
                        </button>
                    </form>

                    {/* Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="font-bold text-gray-900 mb-5">Tóm tắt đặt bàn</h2>
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded p-4 mb-5">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{restaurant?.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <i className="bi bi-geo-alt text-orange-400" /> {restaurant?.city}
                                </p>
                                {restaurant?.openingHours && (
                                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                        <i className="bi bi-clock text-orange-300" /> {restaurant.openingHours}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-center gap-3 p-2.5 bg-[#f8f5ee] rounded">
                                    <i className="bi bi-calendar text-orange-400 w-4 text-center" />
                                    <span>{form.bookingDate ? new Date(form.bookingDate).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 bg-[#f8f5ee] rounded">
                                    <i className="bi bi-clock text-orange-400 w-4 text-center" />
                                    <span>{form.bookingTime}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 bg-[#f8f5ee] rounded">
                                    <i className="bi bi-people text-orange-400 w-4 text-center" />
                                    <span>{form.guestCount} khách</span>
                                </div>
                            </div>
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3">
                                <p className="text-xs text-amber-700 flex items-start gap-1.5">
                                    <i className="bi bi-info-circle shrink-0 mt-0.5" />
                                    Nhà hàng sẽ liên hệ xác nhận trong vòng 30 phút.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookRestaurant
