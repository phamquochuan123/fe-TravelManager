import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getTourById, bookTour } from "../../api/tourApi"
import { AppContext } from "../../context/AppContext"
import MenuBar from "../../components/Menubar"
import { toast } from "react-toastify"

const BookTour = () => {
    const { tourId } = useParams()
    const navigate = useNavigate()
    const { userData } = useContext(AppContext)

    const [tour, setTour] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [booking, setBooking] = useState(null)

    const [form, setForm] = useState({
        departureId: "",
        numAdults: 1,
        numChildren: 0,
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        couponCode: "",
        note: "",
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        getTourById(tourId)
            .then(data => {
                setTour(data)
                const first = data.departures?.find(d => d.availableSlots > 0)
                if (first) setForm(f => ({ ...f, departureId: first.id }))
            })
            .catch(() => navigate("/tours"))
            .finally(() => setLoading(false))
    }, [tourId])

    useEffect(() => {
        if (userData) {
            setForm(f => ({
                ...f,
                contactName: userData.name || f.contactName,
                contactEmail: userData.email || f.contactEmail,
            }))
        }
    }, [userData])

    const selectedDep = tour?.departures?.find(d => d.id === Number(form.departureId))
    const priceAdult = tour ? Number(tour.priceAdult) : 0
    const priceChild = tour ? (Number(tour.priceChild) || priceAdult) : 0
    const total = priceAdult * Number(form.numAdults) + priceChild * Number(form.numChildren)

    const validate = () => {
        const e = {}
        if (!form.departureId) e.departureId = "Chọn ngày khởi hành"
        if (!form.contactName.trim()) e.contactName = "Vui lòng nhập họ tên"
        if (!form.contactPhone.trim()) e.contactPhone = "Vui lòng nhập số điện thoại"
        if (!form.contactEmail.trim() || !/\S+@\S+\.\S+/.test(form.contactEmail)) e.contactEmail = "Email không hợp lệ"
        if (selectedDep && (form.numAdults + form.numChildren) > selectedDep.availableSlots)
            e.departureId = `Chỉ còn ${selectedDep.availableSlots} chỗ trống`
        return e
    }

    const handleChange = e => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: ["numAdults", "numChildren"].includes(name) ? Number(value) : value }))
        setErrors(errs => ({ ...errs, [name]: "" }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setSubmitting(true)
        try {
            const freshTour = await getTourById(tourId)
            const freshDep = freshTour.departures?.find(d => d.id === Number(form.departureId))
            if (!freshDep || freshDep.availableSlots < (Number(form.numAdults) + Number(form.numChildren))) {
                setErrors({ departureId: `Chỉ còn ${freshDep?.availableSlots ?? 0} chỗ trống. Vui lòng chọn ngày khác.` })
                setSubmitting(false)
                return
            }

            const result = await bookTour(tourId, {
                ...form,
                departureId: Number(form.departureId),
            })
            setBooking(result)
            toast.success("Đặt tour thành công!")
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen">
                <span className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        </div>
    )

    if (booking) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen px-6 pt-20">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200">
                        <i className="bi bi-check-circle-fill text-4xl text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Đặt tour thành công!</h2>
                    <p className="text-gray-500 mb-6">
                        Booking #<span className="font-bold text-emerald-600">{booking.id}</span>
                    </p>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left text-sm text-gray-700 mb-6 space-y-2">
                        <p><span className="font-semibold">Tour:</span> {booking.tourName}</p>
                        <p><span className="font-semibold">Điểm đến:</span> {booking.tourDestination}</p>
                        <p><span className="font-semibold">Ngày khởi hành:</span> {new Date(booking.departureDate).toLocaleDateString("vi-VN")}</p>
                        <p><span className="font-semibold">Số khách:</span> {booking.numAdults} người lớn{booking.numChildren > 0 ? `, ${booking.numChildren} trẻ em` : ""}</p>
                        <p><span className="font-semibold">Tổng tiền:</span> <span className="text-emerald-600 font-bold">{Number(booking.finalPrice).toLocaleString("vi-VN")} ₫</span></p>
                        <p><span className="font-semibold">Trạng thái:</span> <span className="text-amber-600 font-medium">Chờ xác nhận</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/my-bookings")}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-200 hover:shadow-lg text-white font-bold py-3 rounded-xl transition-all"
                        >
                            Xem lịch sử
                        </button>
                        <button
                            onClick={() => navigate("/tours")}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                        >
                            Về trang tour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(`/tours/${tourId}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 text-sm font-medium mb-6 transition-colors"
                >
                    <i className="bi bi-arrow-left" /> Quay lại chi tiết tour
                </button>
                <h1 className="text-3xl font-black text-gray-900 mb-8">Đặt tour</h1>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
                        {/* Departure */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-calendar-event text-emerald-500" /> Chọn ngày khởi hành
                            </h2>
                            <div className="space-y-2">
                                {tour?.departures?.filter(d => d.availableSlots > 0).map(dep => (
                                    <label key={dep.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${Number(form.departureId) === dep.id ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}>
                                        <input
                                            type="radio"
                                            name="departureId"
                                            value={dep.id}
                                            checked={Number(form.departureId) === dep.id}
                                            onChange={handleChange}
                                            className="accent-emerald-600"
                                        />
                                        <span className="font-semibold text-gray-800 text-sm flex-1">
                                            {new Date(dep.departureDate).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{dep.availableSlots} chỗ</span>
                                    </label>
                                ))}
                                {(!tour?.departures?.some(d => d.availableSlots > 0)) && (
                                    <p className="text-center text-gray-400 py-4">Hiện tại không có lịch khởi hành</p>
                                )}
                            </div>
                            {errors.departureId && <p className="text-red-500 text-xs mt-2">{errors.departureId}</p>}
                        </div>

                        {/* Guests */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-people text-emerald-500" /> Số lượng khách
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Người lớn <span className="text-red-500">*</span></label>
                                    <select name="numAdults" value={form.numAdults} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-shadow">
                                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trẻ em</label>
                                    <select name="numChildren" value={form.numChildren} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-shadow">
                                        {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-person-circle text-emerald-500" /> Thông tin liên hệ
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { name: "contactName", label: "Họ và tên", type: "text", placeholder: "Nguyễn Văn A" },
                                    { name: "contactPhone", label: "Số điện thoại", type: "tel", placeholder: "0912 345 678" },
                                    { name: "contactEmail", label: "Email", type: "email", placeholder: "email@example.com" },
                                ].map(field => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label} <span className="text-red-500">*</span></label>
                                        <input
                                            name={field.name} type={field.type} value={form[field.name]}
                                            onChange={handleChange} placeholder={field.placeholder}
                                            className={`w-full border ${errors[field.name] ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-emerald-100"} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-emerald-400 transition-all`}
                                        />
                                        {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon & Note */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        <i className="bi bi-tag text-emerald-400 mr-1.5" /> Mã giảm giá
                                    </label>
                                    <input name="couponCode" value={form.couponCode} onChange={handleChange}
                                        placeholder="Nhập mã giảm giá (nếu có)"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 uppercase transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú</label>
                                    <textarea name="note" value={form.note} onChange={handleChange}
                                        placeholder="Yêu cầu đặc biệt, chế độ ăn uống..."
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={submitting}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base">
                            {submitting
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                                : <><i className="bi bi-calendar-check" /> Xác nhận đặt tour</>
                            }
                        </button>
                    </form>

                    {/* Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="font-bold text-gray-900 mb-5">Tóm tắt đặt tour</h2>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 mb-5">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{tour?.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <i className="bi bi-geo-alt text-emerald-400" /> {tour?.destination}
                                </p>
                                {selectedDep && (
                                    <p className="text-xs text-emerald-700 mt-2 font-semibold bg-emerald-100 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                                        <i className="bi bi-calendar" />
                                        {new Date(selectedDep.departureDate).toLocaleDateString("vi-VN")}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 text-sm mb-4">
                                {form.numAdults > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>{form.numAdults} người lớn × {priceAdult.toLocaleString("vi-VN")} ₫</span>
                                        <span className="font-semibold">{(priceAdult * form.numAdults).toLocaleString("vi-VN")} ₫</span>
                                    </div>
                                )}
                                {form.numChildren > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>{form.numChildren} trẻ em × {priceChild.toLocaleString("vi-VN")} ₫</span>
                                        <span className="font-semibold">{(priceChild * form.numChildren).toLocaleString("vi-VN")} ₫</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-base">
                                    <span>Tạm tính</span>
                                    <span className="text-emerald-600">{total.toLocaleString("vi-VN")} ₫</span>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-xs text-amber-700 flex items-start gap-1.5">
                                    <i className="bi bi-info-circle shrink-0 mt-0.5" />
                                    Giá cuối cùng sẽ được xác nhận sau khi áp dụng mã giảm giá.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookTour
