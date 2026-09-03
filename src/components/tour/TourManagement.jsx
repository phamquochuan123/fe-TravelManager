import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
    getAllTours, createTour, updateTour, deleteTour,
    getTourById, addTourItinerary, updateTourItinerary,
    deleteTourItinerary, addTourDeparture, deleteTourDeparture
} from "../../api/tourApi"
import api from "../../api/axiosInstance"
import ConfirmDialog from "../admin/ConfirmDialog"

const TOUR_TYPE_LABEL = { DOMESTIC: "Trong nước", INTERNATIONAL: "Quốc tế" }
const TOUR_TYPE_COLOR = { DOMESTIC: "bg-teal-50 text-teal-700 border-teal-200", INTERNATIONAL: "bg-blue-50 text-blue-700 border-blue-200" }
const STATUS_LABEL = { ACTIVE: "Hoạt động", INACTIVE: "Tạm đóng", DRAFT: "Nháp" }
const STATUS_COLOR = {
    ACTIVE: "bg-[#2A7553]/10 text-[#2A7553]",
    INACTIVE: "bg-gray-100 text-gray-500",
    DRAFT: "bg-amber-100 text-amber-700"
}

const EMPTY_FORM = {
    name: "", description: "", destination: "", departure: "",
    tourType: "DOMESTIC", priceAdult: "", priceChild: "",
    durationDays: 1, maxSlots: 10, cancellationPolicy: "", includedServices: ""
}
const EMPTY_ITINERARY = { dayNumber: 1, title: "", description: "", activities: "" }
const EMPTY_DEPARTURE = { departureDate: "", availableSlots: 10 }

const TourManagement = () => {
    const navigate = useNavigate()
    const [tours, setTours] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [view, setView] = useState("list")
    const [editingTour, setEditingTour] = useState(null)
    const [detailTour, setDetailTour] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [detailTab, setDetailTab] = useState("itineraries")

    const [itineraryForm, setItineraryForm] = useState(EMPTY_ITINERARY)
    const [editingItinerary, setEditingItinerary] = useState(null)
    const [departureForm, setDepartureForm] = useState(EMPTY_DEPARTURE)
    const [subSaving, setSubSaving] = useState(false)
    const [deletingSubId, setDeletingSubId] = useState(null)
    const [staffList, setStaffList] = useState([])
    const [assigningStaff, setAssigningStaff] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", variant: "danger", onConfirm: () => { } })

    const fetchTours = () => {
        setLoading(true)
        getAllTours(true).then(setTours).catch(e => toast.error(e.message)).finally(() => setLoading(false))
    }

    const fetchDetail = (id) => {
        setDetailLoading(true)
        getTourById(id).then(setDetailTour).catch(() => toast.error("Không thể tải chi tiết tour")).finally(() => setDetailLoading(false))
    }

    useEffect(() => { fetchTours() }, [])

    useEffect(() => {
        if (detailTab === "departures") fetchStaff()
    }, [detailTab])

    const openAdd = () => { setForm(EMPTY_FORM); setEditingTour(null); setView("add") }
    const openEdit = async (tour) => {
        setEditingTour(tour)
        setView("edit")
        try {
            const full = await getTourById(tour.id)
            setForm({
                name: full.name || "", description: full.description || "",
                destination: full.destination || "", departure: full.departure || "",
                tourType: full.tourType || "DOMESTIC",
                priceAdult: full.priceAdult || "", priceChild: full.priceChild || "",
                durationDays: full.durationDays || 1, maxSlots: full.maxSlots || 10,
                cancellationPolicy: full.cancellationPolicy || "",
                includedServices: full.includedServices || ""
            })
        } catch {
            setForm({
                name: tour.name || "", description: "",
                destination: tour.destination || "", departure: tour.departure || "",
                tourType: tour.tourType || "DOMESTIC",
                priceAdult: tour.priceAdult || "", priceChild: tour.priceChild || "",
                durationDays: tour.durationDays || 1, maxSlots: tour.maxSlots || 10,
                cancellationPolicy: "", includedServices: ""
            })
        }
    }
    const openDetail = (tour) => {
        setDetailTour(null)
        setDetailTab("itineraries")
        setItineraryForm(EMPTY_ITINERARY)
        setDepartureForm(EMPTY_DEPARTURE)
        setEditingItinerary(null)
        fetchDetail(tour.id)
        setView("detail")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.destination.trim() || !form.departure.trim()) {
            toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
            return
        }
        setSaving(true)
        try {
            const payload = {
                ...form,
                priceAdult: Number(form.priceAdult),
                priceChild: Number(form.priceChild) || 0,
                durationDays: Number(form.durationDays),
                maxSlots: Number(form.maxSlots),
            }
            if (view === "add") {
                const created = await createTour(payload)
                toast.success("Tạo tour thành công!")
                fetchTours()
                openDetail(created)
            } else {
                await updateTour(editingTour.id, payload)
                toast.success("Cập nhật tour thành công!")
                fetchTours()
                setView("list")
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (tour) => {
        setConfirmDialog({
            open: true,
            title: `Xoá tour "${tour.name}"?`,
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                try {
                    await deleteTour(tour.id)
                    toast.success("Đã xoá tour")
                    fetchTours()
                } catch (e) {
                    toast.error(e.message)
                }
            }
        })
    }

    const handleSaveItinerary = async (e) => {
        e.preventDefault()
        if (!itineraryForm.title.trim()) { toast.error("Cần nhập tiêu đề"); return }
        setSubSaving(true)
        try {
            if (editingItinerary) {
                await updateTourItinerary(detailTour.id, editingItinerary.id, itineraryForm)
                toast.success("Cập nhật lịch trình thành công")
            } else {
                await addTourItinerary(detailTour.id, itineraryForm)
                toast.success("Thêm lịch trình thành công")
            }
            setItineraryForm(EMPTY_ITINERARY)
            setEditingItinerary(null)
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSubSaving(false)
        }
    }

    const handleDeleteItinerary = (id) => {
        setConfirmDialog({
            open: true,
            title: "Xoá lịch trình này?",
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingSubId(id)
                try {
                    await deleteTourItinerary(detailTour.id, id)
                    toast.success("Đã xoá")
                    fetchDetail(detailTour.id)
                } catch (e) {
                    toast.error(e.message)
                } finally {
                    setDeletingSubId(null)
                }
            }
        })
    }

    const handleAddDeparture = async (e) => {
        e.preventDefault()
        if (!departureForm.departureDate) { toast.error("Chọn ngày khởi hành"); return }
        setSubSaving(true)
        try {
            await addTourDeparture(detailTour.id, {
                departureDate: departureForm.departureDate,
                availableSlots: Number(departureForm.availableSlots)
            })
            toast.success("Thêm ngày khởi hành thành công")
            setDepartureForm(EMPTY_DEPARTURE)
            fetchDetail(detailTour.id)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSubSaving(false)
        }
    }

    const handleDeleteDeparture = (id) => {
        setConfirmDialog({
            open: true,
            title: "Xoá ngày khởi hành này?",
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingSubId(id)
                try {
                    await deleteTourDeparture(detailTour.id, id)
                    toast.success("Đã xoá")
                    fetchDetail(detailTour.id)
                } catch (e) {
                    toast.error(e.message)
                } finally {
                    setDeletingSubId(null)
                }
            }
        })
    }

    const fetchStaff = async () => {
        try {
            const res = await api.get("/admin/users")
            setStaffList((res.data || []).filter(u => u.roleName === "STAFF"))
        } catch { /* bỏ qua lỗi tải danh sách staff, không chặn UI */ }
    }

    const handleAssignStaff = async (departureId, staffId) => {
        setAssigningStaff(departureId)
        try {
            await api.patch(`/tours/${detailTour.id}/departures/${departureId}/assign-staff`, { staffId: staffId ? Number(staffId) : null })
            toast.success("Phân công staff thành công")
            fetchDetail(detailTour.id)
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể phân công staff")
        } finally {
            setAssigningStaff(null)
        }
    }

    const filtered = tours.filter(t => {
        const q = search.toLowerCase()
        return !q || t.name?.toLowerCase().includes(q) || t.destination?.toLowerCase().includes(q)
    })

    // --- CÁC COMPONENT TÁI SỬ DỤNG CHO FORM (GIỮ VIBE ẢNH MẪU) ---
    const InputClass = "w-full border-0 bg-[#f8f5ee]/50 rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7553]/50 transition-all shadow-inner"
    const LabelClass = "block text-xs font-bold text-gray-800 mb-2 tracking-wide uppercase"

    if (view === "add" || view === "edit") {
        return (
            <div className="font-sans">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-400 hover:text-[#2A7553] text-sm font-semibold transition-colors mb-2">
                            <i className="bi bi-arrow-left" /> Quay lại
                        </button>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {view === "add" ? "Thêm Tour Mới" : `Chỉnh sửa: ${editingTour?.name}`}
                        </h2>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 max-w-4xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={LabelClass}>Tên tour *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nhập tên tour ấn tượng..." className={InputClass} />
                        </div>
                        <div>
                            <label className={LabelClass}>Điểm đến *</label>
                            <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                                placeholder="California, Đà Lạt..." className={InputClass} />
                        </div>
                        <div>
                            <label className={LabelClass}>Điểm khởi hành *</label>
                            <input value={form.departure} onChange={e => setForm(f => ({ ...f, departure: e.target.value }))}
                                placeholder="Hà Nội, TP. HCM..." className={InputClass} />
                        </div>
                        <div>
                            <label className={LabelClass}>Loại tour</label>
                            <select value={form.tourType} onChange={e => setForm(f => ({ ...f, tourType: e.target.value }))}
                                className={InputClass}>
                                <option value="DOMESTIC">Trong nước</option>
                                <option value="INTERNATIONAL">Quốc tế</option>
                            </select>
                        </div>
                        <div>
                            <label className={LabelClass}>Số ngày</label>
                            <input type="number" min="1" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                                className={InputClass} />
                        </div>
                        <div>
                            <label className={LabelClass}>Giá người lớn (₫) *</label>
                            <input type="number" min="0" value={form.priceAdult} onChange={e => setForm(f => ({ ...f, priceAdult: e.target.value }))}
                                placeholder="Ví dụ: 2000000" className={InputClass} />
                        </div>
                        <div>
                            <label className={LabelClass}>Giá trẻ em (₫)</label>
                            <input type="number" min="0" value={form.priceChild} onChange={e => setForm(f => ({ ...f, priceChild: e.target.value }))}
                                placeholder="Ví dụ: 1500000" className={InputClass} />
                        </div>
                        <div>
                            <label className={LabelClass}>Số slot tối đa</label>
                            <input type="number" min="1" value={form.maxSlots} onChange={e => setForm(f => ({ ...f, maxSlots: e.target.value }))}
                                className={InputClass} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={LabelClass}>Mô tả</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={4} placeholder="Hãy viết một đoạn mô tả thật hấp dẫn..." className={`${InputClass} resize-none`} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={LabelClass}>Dịch vụ bao gồm</label>
                            <textarea value={form.includedServices} onChange={e => setForm(f => ({ ...f, includedServices: e.target.value }))}
                                rows={2} placeholder="Xe đưa đón, Ăn sáng, Hướng dẫn viên..." className={`${InputClass} resize-none`} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={LabelClass}>Chính sách huỷ</label>
                            <textarea value={form.cancellationPolicy} onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))}
                                rows={2} placeholder="Điều kiện huỷ tour..." className={`${InputClass} resize-none`} />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button type="submit" disabled={saving}
                            className="px-8 py-3.5 bg-[#2A7553] hover:bg-[#1f5c40] text-white font-bold rounded-full transition-all flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-[#2A7553]/30 hover:-translate-y-0.5">
                            {saving ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : view === "add" ? "Tạo Tour & Quản Lý Chi Tiết" : "Lưu Thay Đổi"}
                        </button>
                        <button type="button" onClick={() => setView("list")}
                            className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all">
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    if (view === "detail") {
        return (
            <div className="font-sans">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => { setView("list"); setDetailTour(null) }} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-500 hover:text-[#2A7553] transition-colors">
                        <i className="bi bi-arrow-left text-xl" />
                    </button>
                    {detailTour && (
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{detailTour.name}</h2>
                            <p className="text-sm text-[#2A7553] font-bold mt-1 tracking-wider uppercase">{detailTour.destination}</p>
                        </div>
                    )}
                </div>

                {detailLoading ? (
                    <div className="flex justify-center py-20"><span className="w-10 h-10 border-4 border-[#2A7553]/20 border-t-[#2A7553] rounded-full animate-spin" /></div>
                ) : detailTour && (
                    <div>
                        {/* Biển hiệu thông tin nhanh dạng khối bo tròn mềm mại */}
                        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-8 flex flex-wrap gap-6 items-center border border-gray-50">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${TOUR_TYPE_COLOR[detailTour.tourType]}`}>{TOUR_TYPE_LABEL[detailTour.tourType]}</span>
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><i className="bi bi-clock text-gray-400" />{detailTour.durationDays} Ngày</span>
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><i className="bi bi-people text-gray-400" />Tối đa {detailTour.maxSlots} người</span>
                            <span className="text-lg font-black text-[#2A7553] ml-auto">
                                {Number(detailTour.priceAdult).toLocaleString("vi-VN")} ₫<span className="text-xs text-gray-400 font-normal"> / khách</span>
                            </span>
                        </div>

                        {/* Các Tab với phong cách Pill */}
                        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { key: "itineraries", icon: "bi-signpost-split", label: "Lịch trình", count: detailTour.itineraries?.length },
                                { key: "departures", icon: "bi-calendar-event", label: "Khởi hành", count: detailTour.departures?.length },
                                { key: "images", icon: "bi-image", label: "Thư viện ảnh", count: detailTour.images?.length },
                            ].map(t => (
                                <button key={t.key} onClick={() => setDetailTab(t.key)}
                                    className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 whitespace-nowrap
                                        ${detailTab === t.key
                                            ? "bg-[#2A7553] text-white shadow-md shadow-[#2A7553]/20"
                                            : "bg-white text-gray-500 hover:bg-[#f8f5ee] border border-gray-100"}`}>
                                    <i className={`bi ${t.icon}`} />{t.label}
                                    {t.count > 0 && <span className={`text-[10px] rounded-full px-2 py-0.5 ${detailTab === t.key ? "bg-white/20" : "bg-gray-100"}`}>{t.count}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Nội dung Tab - Giao diện chung dạng Card bo tròn sâu */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 space-y-4">

                                {/* Render Lịch trình */}
                                {detailTab === "itineraries" && (
                                    <>
                                        {detailTour.itineraries?.length === 0 && <div className="text-center py-16 bg-white/50 border border-dashed border-gray-200 rounded-[32px] text-gray-400"><i className="bi bi-map text-4xl block mb-3" />Chưa có lịch trình</div>}
                                        {detailTour.itineraries?.sort((a, b) => a.dayNumber - b.dayNumber).map(item => (
                                            <div key={item.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 flex gap-5 group hover:shadow-md transition-shadow">
                                                <div className="w-14 h-14 rounded bg-[#2A7553]/10 text-[#2A7553] font-black text-lg flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-70">Ngày</span>{item.dayNumber}
                                                </div>
                                                <div className="flex-1 min-w-0 py-1">
                                                    <p className="font-bold text-gray-900 text-base">{item.title}</p>
                                                    {item.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>}
                                                    {item.activities && <p className="text-xs font-semibold text-[#2A7553] mt-3 flex items-center gap-1.5"><i className="bi bi-check-circle-fill" />{item.activities}</p>}
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingItinerary(item); setItineraryForm({ dayNumber: item.dayNumber, title: item.title, description: item.description || "", activities: item.activities || "" }) }} className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center"><i className="bi bi-pencil" /></button>
                                                    <button onClick={() => handleDeleteItinerary(item.id)} disabled={deletingSubId === item.id} className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center disabled:opacity-40">{deletingSubId === item.id ? <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin" /> : <i className="bi bi-trash3" />}</button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Tương tự cho Departures, Images, Seasonal Prices... (Chỉ cập nhật class để bo tròn và hiện đại hơn) */}
                                {/* Bạn có thể áp dụng class bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 cho các block hiển thị dữ liệu ở các tab khác */}
                                {detailTab === "departures" && (
                                    <>
                                        {detailTour.departures?.length === 0 && <div className="text-center py-16 bg-white/50 border border-dashed border-gray-200 rounded-[32px] text-gray-400"><i className="bi bi-calendar-x text-4xl block mb-3" />Chưa có lịch khởi hành</div>}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {detailTour.departures?.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate)).map(dep => (
                                                <div key={dep.id} className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm flex flex-col gap-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-extrabold text-gray-900 text-lg">{new Date(dep.departureDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                                                            <p className={`text-xs font-bold mt-1 ${dep.availableSlots > 0 ? "text-[#2A7553]" : "text-red-500"}`}>
                                                                {dep.availableSlots > 0 ? `Còn ${dep.availableSlots} chỗ` : "Đã hết chỗ"}
                                                            </p>
                                                        </div>
                                                        <button onClick={() => handleDeleteDeparture(dep.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="bi bi-x-circle-fill text-lg" /></button>
                                                    </div>
                                                    <div className="pt-3 border-t border-gray-50">
                                                        <select value={dep.staffId || ""} onChange={e => handleAssignStaff(dep.id, e.target.value)} disabled={assigningStaff === dep.id}
                                                            className="w-full text-xs font-semibold bg-[#f8f5ee] border-0 rounded px-3 py-2 focus:ring-2 focus:ring-[#2A7553]/30">
                                                            <option value="">Chưa phân công HDV</option>
                                                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Form bên phải - Dạng Card nổi bật */}
                            <div className="xl:col-span-1">
                                <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-6 sticky top-8">
                                    <h3 className="font-extrabold text-gray-900 mb-6 text-lg tracking-tight border-b border-gray-100 pb-4">
                                        {detailTab === "itineraries" ? (editingItinerary ? "Chỉnh sửa lịch trình" : "Thêm điểm đến mới") :
                                            detailTab === "departures" ? "Tạo lịch khởi hành" : "Quản lý dữ liệu"}
                                    </h3>

                                    {/* Render Form Lịch trình (Giữ logic cũ, thêm style) */}
                                    {detailTab === "itineraries" && (
                                        <form onSubmit={handleSaveItinerary} className="space-y-4">
                                            <div>
                                                <label className={LabelClass}>Ngày thứ</label>
                                                <input type="number" min="1" value={itineraryForm.dayNumber} onChange={e => setItineraryForm(f => ({ ...f, dayNumber: e.target.value }))} className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Tiêu đề *</label>
                                                <input value={itineraryForm.title} onChange={e => setItineraryForm(f => ({ ...f, title: e.target.value }))} className={InputClass} placeholder="Di chuyển..." />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Mô tả</label>
                                                <textarea value={itineraryForm.description} onChange={e => setItineraryForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${InputClass} resize-none`} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Hoạt động</label>
                                                <input value={itineraryForm.activities} onChange={e => setItineraryForm(f => ({ ...f, activities: e.target.value }))} className={InputClass} />
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" disabled={subSaving} className="w-full bg-[#2A7553] hover:bg-[#1f5c40] text-white font-bold py-3.5 rounded-full transition-all shadow-md shadow-[#2A7553]/20">
                                                    {subSaving ? "Đang xử lý..." : (editingItinerary ? "Cập nhật" : "Thêm Lịch Trình")}
                                                </button>
                                                {editingItinerary && <button type="button" onClick={() => { setEditingItinerary(null); setItineraryForm(EMPTY_ITINERARY) }} className="w-full mt-3 font-bold text-gray-500 py-2 hover:text-gray-800">Huỷ chỉnh sửa</button>}
                                            </div>
                                        </form>
                                    )}

                                    {/* Render Form Khởi hành */}
                                    {detailTab === "departures" && (
                                        <form onSubmit={handleAddDeparture} className="space-y-4">
                                            <div>
                                                <label className={LabelClass}>Ngày khởi hành *</label>
                                                <input type="date" min={new Date().toISOString().split("T")[0]} value={departureForm.departureDate} onChange={e => setDepartureForm(f => ({ ...f, departureDate: e.target.value }))} className={InputClass} />
                                            </div>
                                            <div>
                                                <label className={LabelClass}>Số slot</label>
                                                <input type="number" min="1" value={departureForm.availableSlots} onChange={e => setDepartureForm(f => ({ ...f, availableSlots: e.target.value }))} className={InputClass} />
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" disabled={subSaving} className="w-full bg-[#2A7553] hover:bg-[#1f5c40] text-white font-bold py-3.5 rounded-full transition-all shadow-md shadow-[#2A7553]/20">
                                                    {subSaving ? "Đang xử lý..." : "Mở Chuyến Đi Này"}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Các form khác (images, prices) bạn bọc trong <div className="space-y-4"> và dùng InputClass tương tự */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <ConfirmDialog open={confirmDialog.open} onOpenChange={v => setConfirmDialog(s => ({ ...s, open: v }))} title={confirmDialog.title} description={confirmDialog.description} variant={confirmDialog.variant} onConfirm={confirmDialog.onConfirm} />
            </div>
        )
    }

    // ── GIAO DIỆN DANH SÁCH (Tái tạo thanh Search khổng lồ & Bảng bo tròn) ──
    return (
        <div className="font-sans">
            {/* Banner: Aerial image background + pill search */}
            <div className="relative rounded-[32px] mb-8 shadow-xl flex flex-col items-center justify-center text-center overflow-hidden" style={{ minHeight: '220px', padding: '2.5rem' }}>
                {/* Background image */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(https://picsum.photos/seed/coastal-aerial-1/1920/600)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 35%',
                        filter: 'brightness(0.5) saturate(1.1)',
                    }}
                />
                {/* Green tint overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(42,117,83,0.65) 0%, rgba(26,81,56,0.55) 100%)' }} />

                <div className="relative z-10 w-full max-w-2xl">
                    <h1 className="font-black text-white mb-6 tracking-tight drop-shadow-lg" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
                        Tìm Ký Ức Chuyến Đi Tiếp Theo
                    </h1>
                    <div className="flex items-center shadow-2xl rounded-full bg-white p-2 w-full">
                        <i className="bi bi-search text-gray-400 text-lg ml-4 shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Nhập tên tour hoặc điểm đến..."
                            className="flex-1 pl-4 pr-2 py-3 bg-transparent text-gray-800 font-semibold focus:outline-none placeholder-gray-400"
                        />
                        <button
                            onClick={openAdd}
                            className="shrink-0 text-white font-extrabold px-8 py-3 rounded-full transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}
                        >
                            + Thêm Mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Thống kê dạng thẻ mềm mại */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: "Tổng số Tour", value: tours.length, icon: "bi-layers-fill", color: "text-[#2A7553] bg-[#2A7553]/10" },
                    { label: "Đang hoạt động", value: tours.filter(t => t.status === "ACTIVE").length, icon: "bi-check-circle-fill", color: "text-blue-600 bg-blue-50" },
                    { label: "Đang tạm ngưng", value: tours.filter(t => t.status !== "ACTIVE").length, icon: "bi-pause-circle-fill", color: "text-amber-500 bg-amber-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-[24px] border border-gray-50 shadow-sm p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform cursor-default">
                        <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl ${s.color}`}><i className={`bi ${s.icon}`} /></div>
                        <div><p className="text-3xl font-black text-gray-900 tracking-tight">{s.value}</p><p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p></div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="w-10 h-10 border-4 border-[#2A7553]/20 border-t-[#2A7553] rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                    <i className="bi bi-folder-x text-5xl text-gray-300 block mb-4" />
                    <p className="text-gray-500 font-medium">Không tìm thấy dữ liệu phù hợp</p>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8f5ee]/50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Chuyến đi</th>
                                    <th className="px-6 py-5">Thông tin</th>
                                    <th className="px-6 py-5">Mức giá</th>
                                    <th className="px-6 py-5">Trạng thái</th>
                                    <th className="px-8 py-5 text-right">Tuỳ chỉnh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(tour => (
                                    <tr key={tour.id} className="hover:bg-[#f8f5ee]/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-extrabold text-gray-900 text-base mb-1">{tour.name}</p>
                                            <p className="text-xs font-bold text-[#2A7553] uppercase tracking-wide flex items-center gap-1"><i className="bi bi-geo-alt-fill opacity-50" /> {tour.destination}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mb-1 ${TOUR_TYPE_COLOR[tour.tourType] || "bg-gray-100 text-gray-600"}`}>
                                                {TOUR_TYPE_LABEL[tour.tourType] || tour.tourType}
                                            </span>
                                            <p className="text-xs text-gray-500 font-semibold">{tour.durationDays} Ngày • {tour.totalDepartures || 0} Chuyến</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-black text-gray-900">{Number(tour.priceAdult).toLocaleString("vi-VN")} ₫</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide ${STATUS_COLOR[tour.status] || "bg-gray-100 text-gray-500"}`}>
                                                {STATUS_LABEL[tour.status] || tour.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openDetail(tour)} className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-blue-500 flex items-center justify-center transition-all shadow-sm" title="Quản lý chi tiết"><i className="bi bi-gear-fill" /></button>
                                                <button onClick={() => navigate(`/tours/${tour.id}`)} className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center transition-all shadow-sm" title="Xem trang"><i className="bi bi-box-arrow-up-right" /></button>
                                                <button onClick={() => openEdit(tour)} className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-amber-500 flex items-center justify-center transition-all shadow-sm" title="Chỉnh sửa"><i className="bi bi-pencil-fill" /></button>
                                                <button onClick={() => handleDelete(tour)} className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-red-500 flex items-center justify-center transition-all shadow-sm" title="Xoá"><i className="bi bi-trash3-fill" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <ConfirmDialog open={confirmDialog.open} onOpenChange={v => setConfirmDialog(s => ({ ...s, open: v }))} title={confirmDialog.title} description={confirmDialog.description} variant={confirmDialog.variant} onConfirm={confirmDialog.onConfirm} />
        </div>
    )
}

export default TourManagement